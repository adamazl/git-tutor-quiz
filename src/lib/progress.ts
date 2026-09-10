import { useCallback, useState } from "react";

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

export function useProgress(totalTopics: number) {
  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress());

  const recordResult = useCallback(
    (topicId: string, score: number, totalQuestions: number) => {
      setProgress((prev) => {
        const next = recordTopicResult(prev, topicId, score, totalQuestions);
        saveProgress(next);
        return next;
      });
    },
    []
  );

  const stats = computeOverallStats(progress, totalTopics);

  return { progress, recordResult, stats };
}
