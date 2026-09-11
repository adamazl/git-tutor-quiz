import type { Topic } from "@/data/topics";
import type { ProgressMap } from "@/lib/progress";

export const CREDITS_PER_MASTERY = 25;

export function computeCreditsEarned(progress: ProgressMap): number {
  return Object.values(progress).filter((p) => p.completed).length * CREDITS_PER_MASTERY;
}

export function computeCreditsSpent(unlockedTopics: string[], topics: Topic[]): number {
  const costById = new Map(topics.map((t) => [t.id, t.unlockCost ?? 0]));
  return unlockedTopics.reduce((sum, id) => sum + (costById.get(id) ?? 0), 0);
}

// Credits are never stored as a raw balance -- they're derived from two
// pieces of state (progress, unlockedTopics) that both merge safely across
// devices/tabs (max-per-topic and set-union respectively), so the balance
// is always correct after a merge with no dedicated merge logic of its own.
export function computeCreditBalance(
  progress: ProgressMap,
  unlockedTopics: string[],
  topics: Topic[]
): number {
  return Math.max(0, computeCreditsEarned(progress) - computeCreditsSpent(unlockedTopics, topics));
}

export function isTopicUnlocked(topic: Topic, unlockedTopics: string[]): boolean {
  return topic.tier === "beginner" || unlockedTopics.includes(topic.id);
}
