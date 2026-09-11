import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type NextOrObserver,
  type User,
} from "firebase/auth";
import { signUp, signIn, signOutUser, useAuth } from "./auth";

vi.mock("@/lib/firebase", () => ({ auth: {} }));

describe("signUp", () => {
  it("delegates to Firebase and returns the created user", async () => {
    const fakeUser = { uid: "uid-1", email: "a@b.com" };
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValueOnce({
      user: fakeUser,
    } as never);

    const user = await signUp("a@b.com", "password123");

    expect(user).toBe(fakeUser);
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      "a@b.com",
      "password123"
    );
  });
});

describe("signIn", () => {
  it("delegates to Firebase and returns the signed-in user", async () => {
    const fakeUser = { uid: "uid-1", email: "a@b.com" };
    vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({
      user: fakeUser,
    } as never);

    const user = await signIn("a@b.com", "password123");

    expect(user).toBe(fakeUser);
  });
});

describe("signOutUser", () => {
  it("delegates to Firebase sign out", async () => {
    await signOutUser();
    expect(signOut).toHaveBeenCalled();
  });
});

describe("useAuth", () => {
  it("reflects the current Firebase auth state", async () => {
    const fakeUser = { uid: "uid-1", email: "a@b.com" } as User;
    vi.mocked(onAuthStateChanged).mockImplementationOnce(
      (_auth: Auth, nextOrObserver: NextOrObserver<User>) => {
        (nextOrObserver as (user: User) => void)(fakeUser);
        return () => {};
      }
    );

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBe(fakeUser);
  });

  it("starts loading and resolves to a signed-out state by default", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });
});
