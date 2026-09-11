import { describe, it, expect, vi } from "vitest";
import { deleteDoc, getDoc, runTransaction, setDoc } from "firebase/firestore";
import type { Topic } from "@/data/topics";
import type { ProgressMap } from "@/lib/progress";
import {
  deleteCloudProgress,
  loadCloudProgress,
  saveCloudProgress,
  mergeProgressMaps,
  loadUnlockedTopics,
  saveCloudUnlocks,
  mergeUnlockedTopics,
  unlockTopicCloud,
} from "./cloudProgress";

vi.mock("@/lib/firebase", () => ({ db: {} }));

const rebase: Topic = {
  id: "rebase",
  title: "git rebase",
  summary: "",
  explanation: "",
  diagrams: [],
  quiz: [],
  tier: "intermediate",
  unlockCost: 30,
};

const cherryPick: Topic = {
  id: "cherry-pick",
  title: "git cherry-pick",
  summary: "",
  explanation: "",
  diagrams: [],
  quiz: [],
  tier: "intermediate",
  unlockCost: 30,
};

const allTopics = [rebase, cherryPick];

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

describe("deleteCloudProgress", () => {
  it("deletes the user's Firestore document", async () => {
    await deleteCloudProgress("uid-1");
    expect(vi.mocked(deleteDoc)).toHaveBeenCalled();
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

describe("loadUnlockedTopics", () => {
  it("returns an empty array when the user has no cloud document", async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => false,
      data: () => undefined,
    } as never);

    expect(await loadUnlockedTopics("uid-1")).toEqual([]);
  });

  it("returns the stored unlocked topics", async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ unlockedTopics: ["rebase"] }),
    } as never);

    expect(await loadUnlockedTopics("uid-1")).toEqual(["rebase"]);
  });
});

describe("saveCloudUnlocks", () => {
  it("writes the unlocked topics to Firestore", async () => {
    await saveCloudUnlocks("uid-1", ["rebase"]);
    expect(vi.mocked(setDoc)).toHaveBeenCalledWith(
      undefined,
      { unlockedTopics: ["rebase"] },
      { merge: true }
    );
  });
});

describe("mergeUnlockedTopics", () => {
  it("unions both lists without duplicates", () => {
    expect(mergeUnlockedTopics(["rebase"], ["rebase", "cherry-pick"])).toEqual([
      "rebase",
      "cherry-pick",
    ]);
  });
});

describe("unlockTopicCloud", () => {
  // Models Firestore's transaction contract closely enough to prove the
  // property that matters: the affordability check runs against a document
  // read *inside* the transaction, not against the caller's argument, so a
  // second call that lands after a first one sees the first one's spend.
  function mockServerDoc(initial: { progress?: ProgressMap; unlockedTopics?: string[] }) {
    let serverDoc = initial;
    vi.mocked(runTransaction).mockImplementation(async (_db, updateFn) => {
      const tx = {
        get: async () => ({
          exists: () => true,
          data: () => serverDoc,
        }),
        set: (_ref: unknown, data: { progress: ProgressMap; unlockedTopics: string[] }) => {
          serverDoc = data;
        },
      };
      return updateFn(tx as never);
    });
    return () => serverDoc;
  }

  it("rejects when the balance can't afford the cost", async () => {
    mockServerDoc({ progress: {}, unlockedTopics: [] });

    const result = await unlockTopicCloud("uid-1", rebase, {}, allTopics);
    expect(result).toEqual({ ok: false, reason: "insufficient-credits" });
  });

  it("unlocks when the balance covers the cost", async () => {
    const progress = {
      commit: { completed: true, bestScore: 2, totalQuestions: 2 },
      branch: { completed: true, bestScore: 2, totalQuestions: 2 },
    };
    mockServerDoc({ progress, unlockedTopics: [] });

    const result = await unlockTopicCloud("uid-1", rebase, progress, allTopics);
    expect(result).toEqual({ ok: true, progress, unlockedTopics: ["rebase"] });
  });

  it(
    "re-validates against the server's latest document, so a second unlock that lands " +
      "after a first one can't double-spend credits neither tab could see was already gone",
    async () => {
      // 50 credits earned -- enough for exactly one 30-credit topic, not both.
      const progress = {
        commit: { completed: true, bestScore: 2, totalQuestions: 2 },
        branch: { completed: true, bestScore: 2, totalQuestions: 2 },
      };
      const getServerDoc = mockServerDoc({ progress, unlockedTopics: [] });

      // Tab A and Tab B both read this same stale 50-credit snapshot locally
      // and both believe they can afford their 30-credit purchase.
      const tabAResult = await unlockTopicCloud("uid-1", rebase, progress, allTopics);
      expect(tabAResult).toEqual({ ok: true, progress, unlockedTopics: ["rebase"] });
      expect(getServerDoc().unlockedTopics).toEqual(["rebase"]);

      const tabBResult = await unlockTopicCloud("uid-1", cherryPick, progress, allTopics);
      expect(tabBResult).toEqual({ ok: false, reason: "insufficient-credits" });
      // The first purchase is not rolled back by the second's failed attempt.
      expect(getServerDoc().unlockedTopics).toEqual(["rebase"]);
    }
  );

  it("is idempotent when the same topic is unlocked twice", async () => {
    const progress = { commit: { completed: true, bestScore: 2, totalQuestions: 2 } };
    mockServerDoc({ progress, unlockedTopics: ["rebase"] });

    const result = await unlockTopicCloud("uid-1", rebase, progress, allTopics);
    expect(result).toEqual({ ok: true, progress, unlockedTopics: ["rebase"] });
  });

  it("returns unavailable when Firebase isn't configured", async () => {
    vi.doMock("@/lib/firebase", () => ({ db: null }));
    vi.resetModules();
    const { unlockTopicCloud: unlockWithoutFirebase } = await import("./cloudProgress");

    const result = await unlockWithoutFirebase("uid-1", rebase, {}, allTopics);
    expect(result).toEqual({ ok: false, reason: "unavailable" });

    vi.doUnmock("@/lib/firebase");
    vi.resetModules();
  });
});
