import { describe, it, expect, vi } from "vitest";
import { getDoc, setDoc } from "firebase/firestore";
import { loadCloudProgress, saveCloudProgress, mergeProgressMaps } from "./cloudProgress";

vi.mock("@/lib/firebase", () => ({ db: {} }));

describe("loadCloudProgress", () => {
  it("returns an empty object when the user has no cloud document", async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => false,
      data: () => undefined,
    } as never);

    expect(await loadCloudProgress("uid-1")).toEqual({});
  });

  it("returns the stored progress map when a document exists", async () => {
    const progress = { commit: { completed: true, bestScore: 2, totalQuestions: 2 } };
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ progress }),
    } as never);

    expect(await loadCloudProgress("uid-1")).toEqual(progress);
  });
});

describe("saveCloudProgress", () => {
  it("writes the progress map to Firestore", async () => {
    const progress = { commit: { completed: true, bestScore: 2, totalQuestions: 2 } };
    await saveCloudProgress("uid-1", progress);

    expect(vi.mocked(setDoc)).toHaveBeenCalledWith(
      undefined,
      { progress },
      { merge: true }
    );
  });
});

describe("mergeProgressMaps", () => {
  it("keeps the best score and completion across both maps per topic", () => {
    const local = {
      commit: { completed: false, bestScore: 1, totalQuestions: 2 },
      branch: { completed: true, bestScore: 2, totalQuestions: 2 },
    };
    const cloud = {
      commit: { completed: true, bestScore: 2, totalQuestions: 2 },
      merge: { completed: false, bestScore: 1, totalQuestions: 3 },
    };

    expect(mergeProgressMaps(local, cloud)).toEqual({
      commit: { completed: true, bestScore: 2, totalQuestions: 2 },
      branch: { completed: true, bestScore: 2, totalQuestions: 2 },
      merge: { completed: false, bestScore: 1, totalQuestions: 3 },
    });
  });

  it("handles empty maps on either side", () => {
    const progress = { commit: { completed: true, bestScore: 2, totalQuestions: 2 } };
    expect(mergeProgressMaps({}, progress)).toEqual(progress);
    expect(mergeProgressMaps(progress, {})).toEqual(progress);
    expect(mergeProgressMaps({}, {})).toEqual({});
  });
});
