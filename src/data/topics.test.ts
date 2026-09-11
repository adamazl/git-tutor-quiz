import { describe, it, expect } from "vitest";
import { topics } from "./topics";

describe("topics data", () => {
  it("defines the core topics in learning order, followed by locked topics", () => {
    expect(topics.map((t) => t.id)).toEqual([
      "init",
      "add",
      "commit",
      "branch",
      "checkout",
      "merge",
      "clone",
      "push",
      "pull",
      "stash",
      "rebase",
    ]);
  });

  it("gives every intermediate/advanced topic a positive unlock cost, and every beginner topic none", () => {
    for (const topic of topics) {
      if (topic.tier === "beginner") {
        expect(topic.unlockCost).toBeUndefined();
      } else {
        expect(topic.unlockCost).toBeGreaterThan(0);
      }
    }
  });

  it("gives every topic between 2 and 4 quiz questions", () => {
    for (const topic of topics) {
      expect(topic.quiz.length).toBeGreaterThanOrEqual(2);
      expect(topic.quiz.length).toBeLessThanOrEqual(4);
    }
  });

  it("keeps every correctIndex within the options range", () => {
    for (const topic of topics) {
      for (const q of topic.quiz) {
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);
      }
    }
  });

  it("gives every topic at least one diagram", () => {
    for (const topic of topics) {
      expect(topic.diagrams.length).toBeGreaterThan(0);
    }
  });

  it("gives every question at least 3 answer options", () => {
    for (const topic of topics) {
      for (const q of topic.quiz) {
        expect(q.options.length).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
