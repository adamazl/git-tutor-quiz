import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ProgressMap } from "@/lib/progress";

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
