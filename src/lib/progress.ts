import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { loadCloudProgress, saveCloudProgress, mergeProgressMaps } from "@/lib/cloudProgress";

export interface TopicProgress {
  completed: boolean;
  bestScore: number;
  totalQuestions: number;
}

export type ProgressMap = Record<string, TopicProgress>;

const STORAGE_KEY = "git-tutor-progress";

export function loadProgress(): ProgressMap {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed as ProgressMap;
  } catch {
    return {};
  }
}

export function saveProgress(progress: ProgressMap): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function recordTopicResult(
  progress: ProgressMap,
  topicId: string,
  score: number,
  totalQuestions: number
): ProgressMap {
  const existing = progress[topicId];
  const bestScore = existing ? Math.max(existing.bestScore, score) : score;
  return {
    ...progress,
    [topicId]: {
      completed: score === totalQuestions,
      bestScore,
      totalQuestions,
    },
  };
}

export function computeOverallStats(progress: ProgressMap, totalTopics: number) {
  const values = Object.values(progress);
  const topicsMastered = values.filter((p) => p.completed).length;
  const totalXp = values.reduce((sum, p) => sum + p.bestScore, 0);
  return { topicsMastered, totalTopics, totalXp };
}

export function useProgress(totalTopics: number, user?: User | null) {
  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress());
  const syncedUidRef = useRef<string | null>(null);

  // Local storage stays the source of truth regardless of auth state, so
  // anonymous use is never affected by (or blocked on) cloud sync below.
  useEffect(() => {
    if (!user) {
      syncedUidRef.current = null;
      return;
    }
    if (syncedUidRef.current === user.uid) return;
    syncedUidRef.current = user.uid;

    let cancelled = false;
    void (async () => {
      try {
        const cloudProgress = await loadCloudProgress(user.uid);
        if (cancelled) return;
        setProgress((prev) => {
          const merged = mergeProgressMaps(prev, cloudProgress);
          saveProgress(merged);
          void saveCloudProgress(user.uid, merged).catch(() => {});
          return merged;
        });
      } catch {
        // Best-effort: local progress keeps working even if cloud sync fails.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const recordResult = useCallback(
    (topicId: string, score: number, totalQuestions: number) => {
      setProgress((prev) => {
        const next = recordTopicResult(prev, topicId, score, totalQuestions);
        saveProgress(next);
        if (user) {
          void saveCloudProgress(user.uid, next).catch(() => {});
        }
        return next;
      });
    },
    [user]
  );

  const resetProgress = useCallback(() => {
    setProgress({});
    saveProgress({});
    if (user) {
      void saveCloudProgress(user.uid, {}).catch(() => {});
    }
  }, [user]);

  const stats = computeOverallStats(progress, totalTopics);

  return { progress, recordResult, resetProgress, stats };
}
