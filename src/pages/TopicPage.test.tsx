import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TopicPage } from "./TopicPage";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

function renderTopicPage(onQuizComplete = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={["/topic/init"]}>
      <Routes>
        <Route path="/topic/:id" element={<TopicPage onQuizComplete={onQuizComplete} />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("TopicPage", () => {
  it("renders the topic's explanation, diagram, and quiz", () => {
    renderTopicPage();

    expect(screen.getByRole("heading", { name: "git init" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Git flow diagram" })).toBeInTheDocument();
    expect(screen.getByTestId("quiz")).toBeInTheDocument();
  });

  it("calls onQuizComplete with the topic id and score once the quiz is finished", async () => {
    const user = userEvent.setup();
    const onQuizComplete = vi.fn();
    renderTopicPage(onQuizComplete);

    for (const q of [0, 1]) {
      const options = screen.getAllByRole("radio");
      await user.click(options[0]);
      await user.click(screen.getByRole("button", { name: "Submit" }));
      const nextLabel = q === 1 ? "Finish" : "Next question";
      await user.click(screen.getByRole("button", { name: nextLabel }));
    }

    expect(onQuizComplete).toHaveBeenCalledWith("init", expect.any(Number), 2);
  });
});
