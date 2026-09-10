import { describe, it, expect, beforeEach } from "vitest";
import {
  loadProgress,
  saveProgress,
  recordTopicResult,
  computeOverallStats,
} from "./progress";

const STORAGE_KEY = "git-tutor-progress";

describe("progress storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty object when nothing is stored", () => {
    expect(loadProgress()).toEqual({});
  });

  it("round-trips progress through localStorage", () => {
    saveProgress({ commit: { completed: true, bestScore: 2, totalQuestions: 2 } });
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(loadProgress()).toEqual({
      commit: { completed: true, bestScore: 2, totalQuestions: 2 },
    });
  });

  it("returns an empty object if stored JSON is corrupt", () => {
    window.localStorage.setItem(STORAGE_KEY, "not json");
    expect(loadProgress()).toEqual({});
  });
});

describe("recordTopicResult", () => {
  it("marks a topic completed only when the score is perfect", () => {
    const next = recordTopicResult({}, "commit", 1, 2);
    expect(next.commit).toEqual({ completed: false, bestScore: 1, totalQuestions: 2 });

    const perfect = recordTopicResult({}, "commit", 2, 2);
    expect(perfect.commit).toEqual({ completed: true, bestScore: 2, totalQuestions: 2 });
  });

  it("keeps the best score across attempts", () => {
    const first = recordTopicResult({}, "commit", 1, 2);
    const second = recordTopicResult(first, "commit", 0, 2);
    expect(second.commit.bestScore).toBe(1);
  });
});

describe("computeOverallStats", () => {
  it("counts mastered topics and sums XP", () => {
    const progress = {
      commit: { completed: true, bestScore: 2, totalQuestions: 2 },
      branch: { completed: false, bestScore: 1, totalQuestions: 2 },
    };
    expect(computeOverallStats(progress, 9)).toEqual({
      topicsMastered: 1,
      totalTopics: 9,
      totalXp: 3,
    });
  });
});
