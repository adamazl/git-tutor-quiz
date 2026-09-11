import { describe, it, expect } from "vitest";
import type { Topic } from "@/data/topics";
import {
  CREDITS_PER_MASTERY,
  computeCreditsEarned,
  computeCreditsSpent,
  computeCreditBalance,
  isTopicUnlocked,
} from "./credits";

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

const init: Topic = {
  id: "init",
  title: "git init",
  summary: "",
  explanation: "",
  diagrams: [],
  quiz: [],
  tier: "beginner",
};

describe("computeCreditsEarned", () => {
  it("counts only completed topics", () => {
    const progress = {
      commit: { completed: true, bestScore: 2, totalQuestions: 2 },
      branch: { completed: false, bestScore: 1, totalQuestions: 2 },
    };
    expect(computeCreditsEarned(progress)).toBe(CREDITS_PER_MASTERY);
  });
});

describe("computeCreditsSpent", () => {
  it("sums the unlock cost of purchased topics", () => {
    expect(computeCreditsSpent(["rebase"], [rebase, init])).toBe(30);
  });

  it("ignores unlocked ids with no matching cost", () => {
    expect(computeCreditsSpent(["unknown"], [rebase, init])).toBe(0);
  });
});

describe("computeCreditBalance", () => {
  it("is earned minus spent", () => {
    const progress = {
      commit: { completed: true, bestScore: 2, totalQuestions: 2 },
      branch: { completed: true, bestScore: 2, totalQuestions: 2 },
    };
    expect(computeCreditBalance(progress, [], [rebase, init])).toBe(50);
    expect(computeCreditBalance(progress, ["rebase"], [rebase, init])).toBe(20);
  });

  it("never goes negative", () => {
    expect(computeCreditBalance({}, ["rebase"], [rebase, init])).toBe(0);
  });
});

describe("isTopicUnlocked", () => {
  it("beginner topics are always unlocked", () => {
    expect(isTopicUnlocked(init, [])).toBe(true);
  });

  it("intermediate/advanced topics require a purchase", () => {
    expect(isTopicUnlocked(rebase, [])).toBe(false);
    expect(isTopicUnlocked(rebase, ["rebase"])).toBe(true);
  });
});
