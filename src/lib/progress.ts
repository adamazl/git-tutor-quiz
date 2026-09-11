import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { loadCloudProgress, saveCloudProgress, mergeProgressMaps } from "@/lib/cloudProgress";

export interface TopicProgress {
  completed: boolean;
  bestScore: number;
  totalQuestions: number;
}

export type ProgressMap = Record<string, TopicProgress>;

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

// Progress only persists in the cloud, so it only survives for signed-in
// users. Signed-out play still updates this in-memory state for the
// current session, but nothing is saved once the tab closes.
export function useProgress(totalTopics: number, user?: User | null) {
  const [progress, setProgress] = useState<ProgressMap>({});
  const syncedUidRef = useRef<string | null>(null);

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
          void saveCloudProgress(user.uid, merged).catch(() => {});
          return merged;
        });
      } catch {
        // Best-effort: session progress keeps working even if cloud sync fails.
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
    if (user) {
      void saveCloudProgress(user.uid, {}).catch(() => {});
    }
  }, [user]);

  const stats = computeOverallStats(progress, totalTopics);

  return { progress, recordResult, resetProgress, stats };
}
