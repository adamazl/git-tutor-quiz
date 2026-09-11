import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ContinueCard } from "./ContinueCard";
import type { ProgressMap } from "@/lib/progress";

describe("ContinueCard", () => {
  it("renders nothing when no topic has been attempted yet", () => {
    const { container } = render(
      <MemoryRouter>
        <ContinueCard progress={{}} />
      </MemoryRouter>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("points at the first attempted-but-incomplete topic", () => {
    const progress: ProgressMap = {
      init: { completed: true, bestScore: 2, totalQuestions: 2 },
      branch: { completed: false, bestScore: 1, totalQuestions: 2 },
    };

    render(
      <MemoryRouter>
        <ContinueCard progress={progress} />
      </MemoryRouter>
    );

    expect(screen.getByText("Continue where you left off")).toBeInTheDocument();
    expect(screen.getByText(/git branch/)).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toHaveAttribute(
      "href",
      "/topic/branch"
    );
  });

  it("falls back to the next unstarted topic once every attempted topic is complete", () => {
    const progress: ProgressMap = {
      init: { completed: true, bestScore: 2, totalQuestions: 2 },
    };

    render(
      <MemoryRouter>
        <ContinueCard progress={progress} />
      </MemoryRouter>
    );

    expect(screen.getByText(/git add/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start" })).toHaveAttribute(
      "href",
      "/topic/add"
    );
  });

  it("shows a mastery message once every unlocked topic is completed, without recommending a locked one", () => {
    const progress: ProgressMap = Object.fromEntries(
      ["init", "add", "commit", "branch", "checkout", "merge", "clone", "push", "pull"].map(
        (id) => [id, { completed: true, bestScore: 2, totalQuestions: 2 }]
      )
    );

    render(
      <MemoryRouter>
        <ContinueCard progress={progress} />
      </MemoryRouter>
    );

    expect(screen.getByText(/mastered every topic/)).toBeInTheDocument();
    expect(screen.queryByText(/git stash/)).not.toBeInTheDocument();
  });

  it("recommends an unlocked intermediate/advanced topic once it's been unlocked", () => {
    const progress: ProgressMap = Object.fromEntries(
      ["init", "add", "commit", "branch", "checkout", "merge", "clone", "push", "pull"].map(
        (id) => [id, { completed: true, bestScore: 2, totalQuestions: 2 }]
      )
    );

    render(
      <MemoryRouter>
        <ContinueCard progress={progress} unlockedTopics={["stash"]} />
      </MemoryRouter>
    );

    expect(screen.getByText(/git stash/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start" })).toHaveAttribute("href", "/topic/stash");
  });
});
