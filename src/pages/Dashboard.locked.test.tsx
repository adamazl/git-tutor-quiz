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

describe("Dashboard locked topics (signed out)", () => {
  it("hides the Start link and prompts sign-in instead of showing an unlock button", () => {
    render(
      <MemoryRouter>
        <Dashboard progress={{}} unlockedTopics={[]} credits={30} onUnlock={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in to unlock" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Unlock for 30 credits" })).not.toBeInTheDocument();
  });

  it("opens the account dialog instead of calling onUnlock", async () => {
    const user = userEvent.setup();
    const onUnlock = vi.fn();

    render(
      <MemoryRouter>
        <Dashboard progress={{}} unlockedTopics={[]} credits={30} onUnlock={onUnlock} />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Sign in to unlock" }));

    expect(screen.getByText("Create your account")).toBeInTheDocument();
    expect(onUnlock).not.toHaveBeenCalled();
  });
});

describe("Dashboard locked topics (signed in)", () => {
  it("shows a disabled unlock button when the balance can't afford it", () => {
    render(
      <MemoryRouter>
        <Dashboard progress={{}} unlockedTopics={[]} credits={10} signedIn onUnlock={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unlock for 30 credits" })).toBeDisabled();
  });

  it("enables the unlock button once affordable and calls onUnlock when clicked", async () => {
    const user = userEvent.setup();
    const onUnlock = vi.fn();

    render(
      <MemoryRouter>
        <Dashboard progress={{}} unlockedTopics={[]} credits={30} signedIn onUnlock={onUnlock} />
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
        <Dashboard progress={{}} unlockedTopics={["rebase"]} credits={0} signedIn onUnlock={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getAllByRole("button", { name: "Start" })).toHaveLength(2);
    expect(screen.queryByText(/Unlock for/)).not.toBeInTheDocument();
  });
});
