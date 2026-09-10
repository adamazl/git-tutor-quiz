import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Dashboard } from "./Dashboard";

describe("Dashboard", () => {
  it("lists every topic with a Start link when there is no progress yet", () => {
    render(
      <MemoryRouter>
        <Dashboard progress={{}} />
      </MemoryRouter>
    );

    expect(screen.getByText("git init")).toBeInTheDocument();
    expect(screen.getByText("git pull")).toBeInTheDocument();
    // nativeButton={false} makes Base UI apply role="button" to the rendered
    // <a> (it's not a native <button>), so these are queried as buttons.
    expect(screen.getAllByRole("button", { name: "Start" })).toHaveLength(9);
  });

  it("shows Review for a completed topic", () => {
    render(
      <MemoryRouter>
        <Dashboard progress={{ commit: { completed: true, bestScore: 2, totalQuestions: 2 } }} />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "Review" })).toBeInTheDocument();
  });
});
