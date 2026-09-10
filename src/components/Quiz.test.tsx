import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Quiz } from "./Quiz";
import type { QuizQuestion } from "@/data/topics";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
import confetti from "canvas-confetti";

const questions: QuizQuestion[] = [
  {
    question: "Q1?",
    options: ["right", "wrong"],
    correctIndex: 0,
    explanation: "Because right is right.",
  },
  {
    question: "Q2?",
    options: ["wrong", "right"],
    correctIndex: 1,
    explanation: "Because right is right.",
  },
];

describe("Quiz", () => {
  beforeEach(() => {
    vi.mocked(confetti).mockClear();
  });

  it("shows correct feedback and fires confetti on a correct answer", async () => {
    const user = userEvent.setup();
    render(<Quiz questions={questions} onComplete={vi.fn()} />);

    await user.click(screen.getByRole("radio", { name: "right" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(confetti).toHaveBeenCalledTimes(1);
  });

  it("shows incorrect feedback and does not fire confetti on a wrong answer", async () => {
    const user = userEvent.setup();
    render(<Quiz questions={questions} onComplete={vi.fn()} />);

    await user.click(screen.getByRole("radio", { name: "wrong" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(screen.getByText("Not quite.")).toBeInTheDocument();
    expect(confetti).not.toHaveBeenCalled();
  });

  it("calls onComplete with the final score after the last question, with a bonus confetti burst on a perfect run", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<Quiz questions={questions} onComplete={onComplete} />);

    await user.click(screen.getByRole("radio", { name: "right" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await user.click(screen.getByRole("button", { name: "Next question" }));

    await user.click(screen.getByRole("radio", { name: "right" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await user.click(screen.getByRole("button", { name: "Finish" }));

    expect(onComplete).toHaveBeenCalledWith(2);
    expect(confetti).toHaveBeenCalledTimes(3);
  });

  it("becomes a terminal, non-resubmittable state after finishing, with no Finish button left to re-click", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<Quiz questions={questions} onComplete={onComplete} />);

    await user.click(screen.getByRole("radio", { name: "right" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await user.click(screen.getByRole("button", { name: "Next question" }));

    await user.click(screen.getByRole("radio", { name: "right" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await user.click(screen.getByRole("button", { name: "Finish" }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(confetti).toHaveBeenCalledTimes(3);
    expect(screen.getByText("Quiz complete! Score: 2/2")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Finish" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });
});
