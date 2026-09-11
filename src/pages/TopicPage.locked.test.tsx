import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TopicPage } from "./TopicPage";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

vi.mock("@/data/topics", () => ({
  topics: [
    {
      id: "rebase",
      title: "git rebase",
      summary: "",
      explanation: "Replay commits onto a new base.",
      diagrams: [],
      quiz: [
        {
          question: "What does rebase do?",
          options: ["Replays commits onto a new base", "Deletes history"],
          correctIndex: 0,
          explanation: "Rebase replays commits on top of another base commit.",
        },
      ],
      tier: "intermediate",
      unlockCost: 30,
    },
  ],
}));

describe("TopicPage locked topics", () => {
  it("refuses to render a locked topic even when navigated to directly", () => {
    render(
      <MemoryRouter initialEntries={["/topic/rebase"]}>
        <Routes>
          <Route path="/topic/:id" element={<TopicPage unlockedTopics={[]} onQuizComplete={vi.fn()} />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/locked/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "git rebase" })).not.toBeInTheDocument();
  });

  it("renders the topic once it's in unlockedTopics", () => {
    render(
      <MemoryRouter initialEntries={["/topic/rebase"]}>
        <Routes>
          <Route
            path="/topic/:id"
            element={<TopicPage unlockedTopics={["rebase"]} onQuizComplete={vi.fn()} />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "git rebase" })).toBeInTheDocument();
  });
});
