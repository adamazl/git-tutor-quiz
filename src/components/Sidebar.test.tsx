import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import type { ProgressMap } from "@/lib/progress";

describe("Sidebar", () => {
  it("shows a checkmark badge for completed topics and a score badge for in-progress ones", () => {
    const progress: ProgressMap = {
      commit: { completed: true, bestScore: 2, totalQuestions: 2 },
      branch: { completed: false, bestScore: 1, totalQuestions: 2 },
    };

    render(
      <MemoryRouter>
        <Sidebar progress={progress} topicsMastered={1} />
      </MemoryRouter>
    );

    expect(screen.getByText("git commit")).toBeInTheDocument();
    expect(screen.getByText("✓")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText("1 / 9 topics mastered")).toBeInTheDocument();
  });
});
