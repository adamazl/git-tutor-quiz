import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  type Auth,
  type NextOrObserver,
  type User,
} from "firebase/auth";
import { signUp, signIn, signOutUser, useAuth, changePassword, deleteAccount } from "./auth";
import { deleteCloudProgress } from "@/lib/cloudProgress";

vi.mock("@/lib/firebase", () => ({ auth: {} }));
vi.mock("@/lib/cloudProgress", () => ({ deleteCloudProgress: vi.fn() }));

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

describe("changePassword", () => {
  beforeEach(() => {
    vi.mocked(reauthenticateWithCredential).mockReset().mockResolvedValue(undefined as never);
    vi.mocked(updatePassword).mockReset().mockResolvedValue(undefined);
  });

  it("reauthenticates with the current password before updating it", async () => {
    const fakeUser = { uid: "uid-1", email: "a@b.com" } as User;

    await changePassword(fakeUser, "old-pass", "new-pass");

    expect(EmailAuthProvider.credential).toHaveBeenCalledWith("a@b.com", "old-pass");
    expect(reauthenticateWithCredential).toHaveBeenCalledWith(fakeUser, expect.anything());
    expect(updatePassword).toHaveBeenCalledWith(fakeUser, "new-pass");
  });

  it("does not update the password if reauthentication fails", async () => {
    const fakeUser = { uid: "uid-1", email: "a@b.com" } as User;
    vi.mocked(reauthenticateWithCredential).mockRejectedValueOnce(new Error("boom"));

    await expect(changePassword(fakeUser, "wrong-pass", "new-pass")).rejects.toThrow("boom");
    expect(updatePassword).not.toHaveBeenCalled();
  });
});

describe("deleteAccount", () => {
  beforeEach(() => {
    vi.mocked(reauthenticateWithCredential).mockReset().mockResolvedValue(undefined as never);
    vi.mocked(deleteUser).mockReset().mockResolvedValue(undefined);
    vi.mocked(deleteCloudProgress).mockReset().mockResolvedValue(undefined);
  });

  it("reauthenticates, clears cloud progress, then deletes the account", async () => {
    const fakeUser = { uid: "uid-1", email: "a@b.com" } as User;

    await deleteAccount(fakeUser, "current-pass");

    expect(reauthenticateWithCredential).toHaveBeenCalledWith(fakeUser, expect.anything());
    expect(deleteCloudProgress).toHaveBeenCalledWith("uid-1");
    expect(deleteUser).toHaveBeenCalledWith(fakeUser);
  });

  it("still deletes the account if clearing cloud progress fails", async () => {
    const fakeUser = { uid: "uid-1", email: "a@b.com" } as User;
    vi.mocked(deleteCloudProgress).mockRejectedValueOnce(new Error("offline"));

    await deleteAccount(fakeUser, "current-pass");

    expect(deleteUser).toHaveBeenCalledWith(fakeUser);
  });

  it("does not delete the account if reauthentication fails", async () => {
    const fakeUser = { uid: "uid-1", email: "a@b.com" } as User;
    vi.mocked(reauthenticateWithCredential).mockRejectedValueOnce(new Error("wrong password"));

    await expect(deleteAccount(fakeUser, "wrong-pass")).rejects.toThrow("wrong password");
    expect(deleteUser).not.toHaveBeenCalled();
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
