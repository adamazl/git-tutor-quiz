import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
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

function renderTopicPageWithSidebarNav(onQuizComplete = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={["/topic/init"]}>
      <Link to="/topic/add">Go to git add</Link>
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

  it("renders inline-code markdown in the explanation as <code> elements, not literal backticks", () => {
    renderTopicPage();

    const code = screen.getByText("git init", { selector: "code" });
    expect(code).toBeInTheDocument();

    const heading = screen.getByRole("heading", { name: "git init" });
    // Scope the "no literal backticks" check to the explanation section
    // (the heading's parent), since the quiz question text is out of scope
    // for this fix.
    expect(heading.parentElement?.textContent).not.toContain("`");
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

  it("resets quiz state when navigating from one topic to another via a param-only route change", async () => {
    const user = userEvent.setup();
    renderTopicPageWithSidebarNav();

    expect(screen.getByRole("heading", { name: "git init" })).toBeInTheDocument();
    expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();

    // Answer Q1 and advance to Q2, mid-quiz, without finishing.
    await user.click(screen.getAllByRole("radio")[0]);
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await user.click(screen.getByRole("button", { name: "Next question" }));
    expect(screen.getByText("Question 2 of 2")).toBeInTheDocument();

    // Navigate to a different topic via a param-only route change (same route element).
    await user.click(screen.getByRole("link", { name: "Go to git add" }));

    expect(screen.getByRole("heading", { name: "git add" })).toBeInTheDocument();
    expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
  });
});
