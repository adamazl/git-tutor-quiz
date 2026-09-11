import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "firebase/auth";
import { AccountMenu } from "./AccountMenu";
import { changePassword, deleteAccount } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  changePassword: vi.fn(),
  deleteAccount: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({ firebaseConfigured: true }));

const fakeUser = { uid: "uid-1", email: "a@b.com" } as User;

// The menu opens asynchronously (Base UI defers it to the next animation
// frame), so every test opens it via the trigger and awaits the first item.
async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Account menu" }));
  return screen.findByRole("menuitem", { name: /Change password/ });
}

describe("AccountMenu", () => {
  beforeEach(() => {
    vi.mocked(changePassword).mockReset();
    vi.mocked(deleteAccount).mockReset();
  });

  it("shows the signed-in email and signs out from the dropdown", async () => {
    const onSignOut = vi.fn();
    const user = userEvent.setup();
    render(<AccountMenu user={fakeUser} onSignOut={onSignOut} onResetProgress={vi.fn()} />);

    await openMenu(user);
    expect(screen.getByText("a@b.com")).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: /Sign out/ }));
    expect(onSignOut).toHaveBeenCalled();
  });

  it("resets progress after confirming in the dialog", async () => {
    const onResetProgress = vi.fn();
    const user = userEvent.setup();
    render(<AccountMenu user={fakeUser} onSignOut={vi.fn()} onResetProgress={onResetProgress} />);

    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: /Reset progress/ }));
    await user.click(await screen.findByRole("button", { name: "Reset progress" }));

    expect(onResetProgress).toHaveBeenCalled();
  });

  it("submits the change-password form with both passwords", async () => {
    vi.mocked(changePassword).mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<AccountMenu user={fakeUser} onSignOut={vi.fn()} onResetProgress={vi.fn()} />);

    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: /Change password/ }));
    await user.type(await screen.findByLabelText("Current password"), "old-pass");
    await user.type(screen.getByLabelText("New password"), "new-password");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(changePassword).toHaveBeenCalledWith(fakeUser, "old-pass", "new-password");
  });

  it("submits the delete-account form with the entered password", async () => {
    vi.mocked(deleteAccount).mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<AccountMenu user={fakeUser} onSignOut={vi.fn()} onResetProgress={vi.fn()} />);

    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: /Delete account/ }));
    await user.type(await screen.findByLabelText("Password"), "my-password");
    await user.click(screen.getByRole("button", { name: "Delete account" }));

    expect(deleteAccount).toHaveBeenCalledWith(fakeUser, "my-password");
  });

  it("shows an inline error and keeps the dialog open when deleting the account fails", async () => {
    vi.mocked(deleteAccount).mockRejectedValueOnce(new Error("boom"));
    const user = userEvent.setup();
    render(<AccountMenu user={fakeUser} onSignOut={vi.fn()} onResetProgress={vi.fn()} />);

    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: /Delete account/ }));
    await user.type(await screen.findByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Delete account" }));

    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });
});
