import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import {
  loadCloudProgress,
  saveCloudProgress,
  mergeProgressMaps,
  loadUnlockedTopics,
  saveCloudUnlocks,
  mergeUnlockedTopics,
  unlockTopicCloud,
} from "@/lib/cloudProgress";
import { computeCreditBalance, isTopicUnlocked } from "@/lib/credits";
import { topics as allTopics } from "@/data/topics";

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

export type UnlockOutcome =
  | { ok: true }
  | { ok: false; reason: "insufficient-credits" | "sign-in-required" | "unavailable" | "error" };

// Progress only persists in the cloud, so it only survives for signed-in
// users. Signed-out play still updates this in-memory state for the
// current session, but nothing is saved once the tab closes.
export function useProgress(totalTopics: number, user?: User | null) {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [unlockedTopics, setUnlockedTopics] = useState<string[]>([]);
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
        const [cloudProgress, cloudUnlocked] = await Promise.all([
          loadCloudProgress(user.uid),
          loadUnlockedTopics(user.uid),
        ]);
        if (cancelled) return;
        setProgress((prev) => {
          const merged = mergeProgressMaps(prev, cloudProgress);
          void saveCloudProgress(user.uid, merged).catch(() => {});
          return merged;
        });
        setUnlockedTopics((prev) => mergeUnlockedTopics(prev, cloudUnlocked));
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

  const unlockTopic = useCallback(
    async (topicId: string): Promise<UnlockOutcome> => {
      const topic = allTopics.find((t) => t.id === topicId);
      if (!topic) return { ok: false, reason: "error" };
      if (isTopicUnlocked(topic, unlockedTopics)) return { ok: true };

      // Unlocking spends credits permanently, so it requires an account --
      // signed-out progress is in-memory only and would make the purchase
      // vanish on reload with no way to get it back.
      if (!user) return { ok: false, reason: "sign-in-required" };

      const result = await unlockTopicCloud(user.uid, topic, progress, allTopics);
      if (!result.ok) return result;
      setProgress(result.progress);
      setUnlockedTopics(result.unlockedTopics);
      return { ok: true };
    },
    [user, progress, unlockedTopics]
  );

  const resetProgress = useCallback(() => {
    setProgress({});
    setUnlockedTopics([]);
    if (user) {
      void saveCloudProgress(user.uid, {}).catch(() => {});
      void saveCloudUnlocks(user.uid, []).catch(() => {});
    }
  }, [user]);

  const stats = computeOverallStats(progress, totalTopics);
  const credits = computeCreditBalance(progress, unlockedTopics, allTopics);

  return { progress, unlockedTopics, recordResult, resetProgress, unlockTopic, stats, credits };
}
