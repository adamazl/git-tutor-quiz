import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { User } from "firebase/auth";
import { useProgress } from "./progress";
import { loadCloudProgress, saveCloudProgress } from "./cloudProgress";

vi.mock("./cloudProgress", () => ({
  loadCloudProgress: vi.fn(),
  saveCloudProgress: vi.fn(),
  mergeProgressMaps: vi.fn((a, b) => {
    const merged: Record<string, { completed: boolean; bestScore: number; totalQuestions: number }> = { ...a };
    for (const [topicId, value] of Object.entries(b)) {
      const existing = merged[topicId] as { completed: boolean; bestScore: number; totalQuestions: number } | undefined;
      const incoming = value as { completed: boolean; bestScore: number; totalQuestions: number };
      merged[topicId] = existing
        ? {
            completed: existing.completed || incoming.completed,
            bestScore: Math.max(existing.bestScore, incoming.bestScore),
            totalQuestions: Math.max(existing.totalQuestions, incoming.totalQuestions),
          }
        : incoming;
    }
    return merged;
  }),
}));

const fakeUser = { uid: "uid-1", email: "a@b.com" } as User;

describe("useProgress cloud sync", () => {
  beforeEach(() => {
    vi.mocked(loadCloudProgress).mockReset();
    vi.mocked(saveCloudProgress).mockReset().mockResolvedValue(undefined);
  });

  it("does not touch the cloud when signed out, and progress is not persisted", () => {
    const { result } = renderHook(() => useProgress(9, null));
    expect(loadCloudProgress).not.toHaveBeenCalled();
    expect(result.current.progress).toEqual({});
  });

  it("merges in-session progress with cloud progress on sign-in", async () => {
    vi.mocked(loadCloudProgress).mockResolvedValueOnce({
      commit: { completed: true, bestScore: 2, totalQuestions: 2 },
      branch: { completed: true, bestScore: 2, totalQuestions: 2 },
    });

    const { result, rerender } = renderHook(({ user }) => useProgress(9, user), {
      initialProps: { user: null as User | null },
    });

    act(() => {
      result.current.recordResult("commit", 1, 2);
    });

    rerender({ user: fakeUser });

    await waitFor(() => expect(result.current.progress.branch).toBeDefined());

    expect(result.current.progress).toEqual({
      commit: { completed: true, bestScore: 2, totalQuestions: 2 },
      branch: { completed: true, bestScore: 2, totalQuestions: 2 },
    });
    expect(saveCloudProgress).toHaveBeenCalledWith("uid-1", result.current.progress);
  });

  it("pushes recorded results to the cloud while signed in", async () => {
    vi.mocked(loadCloudProgress).mockResolvedValueOnce({});
    const { result } = renderHook(() => useProgress(9, fakeUser));

    await waitFor(() => expect(loadCloudProgress).toHaveBeenCalled());
    vi.mocked(saveCloudProgress).mockClear();

    act(() => {
      result.current.recordResult("commit", 2, 2);
    });

    await waitFor(() =>
      expect(saveCloudProgress).toHaveBeenCalledWith("uid-1", {
        commit: { completed: true, bestScore: 2, totalQuestions: 2 },
      })
    );
  });
});

describe("resetProgress", () => {
  beforeEach(() => {
    vi.mocked(loadCloudProgress).mockReset();
    vi.mocked(saveCloudProgress).mockReset().mockResolvedValue(undefined);
  });

  it("clears in-memory progress and does not touch the cloud when signed out", () => {
    const { result } = renderHook(() => useProgress(9, null));

    act(() => {
      result.current.recordResult("commit", 2, 2);
    });
    expect(result.current.progress.commit).toBeDefined();

    act(() => {
      result.current.resetProgress();
    });

    expect(result.current.progress).toEqual({});
    expect(saveCloudProgress).not.toHaveBeenCalled();
  });

  it("clears cloud progress when signed in", async () => {
    vi.mocked(loadCloudProgress).mockResolvedValueOnce({});
    const { result } = renderHook(() => useProgress(9, fakeUser));
    await waitFor(() => expect(loadCloudProgress).toHaveBeenCalled());

    act(() => {
      result.current.recordResult("commit", 2, 2);
    });
    await waitFor(() => expect(result.current.progress.commit).toBeDefined());
    vi.mocked(saveCloudProgress).mockClear();

    act(() => {
      result.current.resetProgress();
    });

    expect(result.current.progress).toEqual({});
    expect(saveCloudProgress).toHaveBeenCalledWith("uid-1", {});
  });
});
