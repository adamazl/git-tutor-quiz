import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { App } from "./App";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the dashboard at / and navigates to a topic page on click", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText("Choose a topic")).toBeInTheDocument();

    // The Dashboard's topic links render via Base UI's Button with
    // nativeButton={false} (it's an <a>, not a <button>), which applies
    // role="button" — see src/pages/Dashboard.tsx.
    await user.click(screen.getAllByRole("button", { name: "Start" })[0]);

    expect(screen.getByRole("heading", { name: "git init" })).toBeInTheDocument();
  });
});
