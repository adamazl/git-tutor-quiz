import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountDialog } from "./AccountDialog";
import { signUp, signIn } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  signUp: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({
  firebaseConfigured: true,
}));

describe("AccountDialog", () => {
  beforeEach(() => {
    vi.mocked(signUp).mockReset();
    vi.mocked(signIn).mockReset();
  });

  it("submits sign-up with the entered email and password", async () => {
    vi.mocked(signUp).mockResolvedValueOnce({ uid: "uid-1" } as never);
    const user = userEvent.setup();
    render(<AccountDialog />);

    await user.click(screen.getByRole("button", { name: /Sign in to save progress/ }));
    await user.type(screen.getByLabelText("Email"), "a@b.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(signUp).toHaveBeenCalledWith("a@b.com", "password123");
  });

  it("switches to log-in mode and submits with signIn instead", async () => {
    vi.mocked(signIn).mockResolvedValueOnce({ uid: "uid-1" } as never);
    const user = userEvent.setup();
    render(<AccountDialog />);

    await user.click(screen.getByRole("button", { name: /Sign in to save progress/ }));
    await user.click(screen.getByRole("tab", { name: "Log in" }));
    await user.type(screen.getByLabelText("Email"), "a@b.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(signIn).toHaveBeenCalledWith("a@b.com", "password123");
    expect(signUp).not.toHaveBeenCalled();
  });

  it("shows an inline error and keeps the dialog open when sign-up fails", async () => {
    vi.mocked(signUp).mockRejectedValueOnce(new Error("boom"));
    const user = userEvent.setup();
    render(<AccountDialog />);

    await user.click(screen.getByRole("button", { name: /Sign in to save progress/ }));
    await user.type(screen.getByLabelText("Email"), "a@b.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("requires email and password before the browser allows submission", async () => {
    const user = userEvent.setup();
    render(<AccountDialog />);

    await user.click(screen.getByRole("button", { name: /Sign in to save progress/ }));
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Password")).toBeRequired();
  });
});
