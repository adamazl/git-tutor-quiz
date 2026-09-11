import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Dashboard } from "./Dashboard";

vi.mock("@/data/topics", () => ({
  topics: [
    {
      id: "init",
      title: "git init",
      summary: "Turn a folder into a Git repository.",
      explanation: "",
      diagrams: [],
      quiz: [],
      tier: "beginner",
    },
    {
      id: "rebase",
      title: "git rebase",
      summary: "Replay commits onto a new base.",
      explanation: "",
      diagrams: [],
      quiz: [],
      tier: "intermediate",
      unlockCost: 30,
    },
  ],
}));

describe("Dashboard locked topics", () => {
  it("hides the Start link and shows an unlock prompt for a locked topic", () => {
    render(
      <MemoryRouter>
        <Dashboard progress={{}} unlockedTopics={[]} credits={10} onUnlock={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Unlock for 30 credits" })
    ).toBeDisabled();
  });

  it("enables the unlock button once affordable and calls onUnlock when clicked", async () => {
    const user = userEvent.setup();
    const onUnlock = vi.fn();

    render(
      <MemoryRouter>
        <Dashboard progress={{}} unlockedTopics={[]} credits={30} onUnlock={onUnlock} />
      </MemoryRouter>
    );

    const unlockButton = screen.getByRole("button", { name: "Unlock for 30 credits" });
    expect(unlockButton).toBeEnabled();

    await user.click(unlockButton);
    expect(onUnlock).toHaveBeenCalledWith("rebase");
  });

  it("shows the normal Start/Continue/Review flow once a topic is unlocked", () => {
    render(
      <MemoryRouter>
        <Dashboard progress={{}} unlockedTopics={["rebase"]} credits={0} onUnlock={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getAllByRole("button", { name: "Start" })).toHaveLength(2);
    expect(screen.queryByText(/Unlock for/)).not.toBeInTheDocument();
  });
});
