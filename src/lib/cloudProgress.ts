import { deleteDoc, doc, getDoc, runTransaction, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ProgressMap } from "@/lib/progress";
import type { Topic } from "@/data/topics";
import { computeCreditBalance } from "@/lib/credits";

export async function loadCloudProgress(uid: string): Promise<ProgressMap> {
  if (!db) return {};
  const snapshot = await getDoc(doc(db, "users", uid));
  if (!snapshot.exists()) return {};
  const data = snapshot.data();
  return (data?.progress as ProgressMap | undefined) ?? {};
}

export async function saveCloudProgress(uid: string, progress: ProgressMap): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, "users", uid), { progress }, { merge: true });
}

export async function deleteCloudProgress(uid: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, "users", uid));
}

export async function loadUnlockedTopics(uid: string): Promise<string[]> {
  if (!db) return [];
  const snapshot = await getDoc(doc(db, "users", uid));
  if (!snapshot.exists()) return [];
  return (snapshot.data()?.unlockedTopics as string[] | undefined) ?? [];
}

export async function saveCloudUnlocks(uid: string, unlockedTopics: string[]): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, "users", uid), { unlockedTopics }, { merge: true });
}

export function mergeUnlockedTopics(a: string[], b: string[]): string[] {
  return Array.from(new Set([...a, ...b]));
}

export type UnlockResult =
  | { ok: true; progress: ProgressMap; unlockedTopics: string[] }
  | { ok: false; reason: "insufficient-credits" | "unavailable" | "error" };

// Spends credits and unlocks a topic against the server's current document,
// not the caller's local snapshot. Two tabs racing to unlock (each computing
// "can I afford this?" from stale local state) can't both succeed: Firestore
// re-runs this function against the latest document on write contention, so
// whichever attempt commits second sees the first attempt's spend already
// applied and is correctly re-evaluated against the real remaining balance.
export async function unlockTopicCloud(
  uid: string,
  topic: Topic,
  localProgress: ProgressMap,
  allTopics: Topic[]
): Promise<UnlockResult> {
  if (!db) return { ok: false, reason: "unavailable" };
  const database = db;
  const cost = topic.unlockCost ?? 0;

  try {
    return await runTransaction(database, async (tx) => {
      const ref = doc(database, "users", uid);
      const snapshot = await tx.get(ref);
      const data = snapshot.exists() ? snapshot.data() : undefined;
      const cloudProgress = (data?.progress as ProgressMap | undefined) ?? {};
      const cloudUnlocked = (data?.unlockedTopics as string[] | undefined) ?? [];

      if (cloudUnlocked.includes(topic.id)) {
        return { ok: true, progress: cloudProgress, unlockedTopics: cloudUnlocked };
      }

      const mergedProgress = mergeProgressMaps(cloudProgress, localProgress);
      const balance = computeCreditBalance(mergedProgress, cloudUnlocked, allTopics);
      if (balance < cost) {
        return { ok: false, reason: "insufficient-credits" };
      }

      const nextUnlocked = [...cloudUnlocked, topic.id];
      tx.set(ref, { progress: mergedProgress, unlockedTopics: nextUnlocked }, { merge: true });
      return { ok: true, progress: mergedProgress, unlockedTopics: nextUnlocked };
    });
  } catch {
    return { ok: false, reason: "error" };
  }
}

export function mergeProgressMaps(a: ProgressMap, b: ProgressMap): ProgressMap {
  const topicIds = new Set([...Object.keys(a), ...Object.keys(b)]);
  const merged: ProgressMap = {};
  for (const topicId of topicIds) {
    const fromA = a[topicId];
    const fromB = b[topicId];
    if (fromA && fromB) {
      merged[topicId] = {
        completed: fromA.completed || fromB.completed,
        bestScore: Math.max(fromA.bestScore, fromB.bestScore),
        totalQuestions: Math.max(fromA.totalQuestions, fromB.totalQuestions),
      };
    } else {
      merged[topicId] = fromA ?? fromB;
    }
  }
  return merged;
}
