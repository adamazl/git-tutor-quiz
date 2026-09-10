# Git Tutorial & Quiz App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a gamified, client-side React app that teaches beginner developers the core Git commands through short tutorials with diagrams, paired with multiple-choice quizzes that fire confetti on success and persist progress in `localStorage`.

**Architecture:** A Vite + React + TypeScript SPA using shadcn/ui components and Tailwind CSS, with `react-router-dom` for a Dashboard (`/`) and per-topic pages (`/topic/:id`). Static topic content (explanation + quiz + diagram refs) lives in one typed data file. A small `localStorage`-backed hook tracks per-topic scores and drives sidebar/dashboard progress UI. `canvas-confetti` fires on correct answers and topic completion.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS v4, shadcn/ui, react-router-dom, canvas-confetti, sonner (toasts), Vitest + React Testing Library (unit/component tests).

**Spec:** `docs/superpowers/specs/2026-09-10-git-tutor-quiz-design.md`

## Global Constraints

- No backend, no auth — fully client-side app.
- Topics covered (exactly these 9, in this order): `init`, `add`, `commit`, `branch`, `checkout`, `merge`, `clone`, `push`, `pull`.
- Progress persists to `localStorage` under key `git-tutor-progress` as a JSON map of topic id → `{ completed, bestScore, totalQuestions }`.
- Confetti: small burst (`canvas-confetti`) on each individual correct answer; larger multi-burst + a "Topic mastered! 🎉" toast only when a topic's quiz is finished with every question correct on that attempt.
- Wrong answers are never penalized — user sees the correct explanation and can retry.
- Automated tests (Vitest/RTL) added in this plan are a supplement to, not a replacement for, the manual verification checklist in the spec's Testing section — run that checklist in the final task.
- Use the `@/` path alias for all internal imports (e.g. `@/lib/progress`, `@/data/topics`).

---

### Task 1: Project scaffold & tooling

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`, `components.json`, `src/lib/utils.ts`, `src/test/setup.ts`
- Modify: none
- Test: none (infra-only task; verified via `npm run build` and `npx vitest run`)

**Interfaces:**
- Produces: a working `npm run dev`, `npm run build`, and `npx vitest run` pipeline; the `@/*` → `./src/*` path alias; shadcn/ui primitives available under `src/components/ui/`; `cn()` helper exported from `src/lib/utils.ts`.

- [ ] **Step 1: Scaffold the Vite React-TS template into the project root**

```bash
cd /Users/adamaizal/cursor-general/git-tutor-quiz
npm create vite@latest tmp-scaffold -- --template react-ts
cp -r tmp-scaffold/. .
rm -rf tmp-scaffold
npm install
```

- [ ] **Step 2: Verify the base scaffold builds**

Run: `npm run build`
Expected: build completes with no errors, producing a `dist/` folder.

- [ ] **Step 3: Install Tailwind CSS v4 and the Vite plugin**

```bash
npm install tailwindcss @tailwindcss/vite
```

Replace the contents of `src/index.css` with:

```css
@import "tailwindcss";
```

- [ ] **Step 4: Add the `@/*` path alias**

In `tsconfig.json`, add a top-level `compilerOptions` block (alongside the existing `files`/`references`):

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

In `tsconfig.app.json`, add inside the existing `compilerOptions`:

```json
"baseUrl": ".",
"paths": {
  "@/*": ["./src/*"]
}
```

- [ ] **Step 5: Add the alias to Vite config and install `@types/node`**

```bash
npm install -D @types/node
```

Replace `vite.config.ts` with:

```ts
/// <reference types="vitest/config" />
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
  },
});
```

- [ ] **Step 6: Initialize shadcn/ui and add the components this app needs**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button card progress badge separator dialog radio-group label sonner
```

Expected: `components.json` is created, `src/lib/utils.ts` (exporting `cn`) and `src/components/ui/{button,card,progress,badge,separator,dialog,radio-group,label,sonner}.tsx` are created.

- [ ] **Step 7: Install routing, confetti, and test dependencies**

```bash
npm install react-router-dom canvas-confetti sonner
npm install -D @types/canvas-confetti vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 8: Add the test setup file and npm script**

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 9: Verify the test runner works**

Run: `npx vitest run --passWithNoTests`
Expected: exits successfully with "No test files found" (no test files exist yet — that's expected at this step).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite/React/TS project with Tailwind, shadcn/ui, and Vitest"
```

---

### Task 2: Progress persistence library

**Files:**
- Create: `src/lib/progress.ts`, `src/lib/progress.test.ts`
- Test: `src/lib/progress.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks beyond the scaffold.
- Produces: `TopicProgress { completed: boolean; bestScore: number; totalQuestions: number }`, `ProgressMap = Record<string, TopicProgress>`, `loadProgress(): ProgressMap`, `saveProgress(progress: ProgressMap): void`, `recordTopicResult(progress: ProgressMap, topicId: string, score: number, totalQuestions: number): ProgressMap`, `computeOverallStats(progress: ProgressMap, totalTopics: number): { topicsMastered: number; totalTopics: number; totalXp: number }`, `useProgress(totalTopics: number): { progress: ProgressMap; recordResult: (topicId: string, score: number, totalQuestions: number) => void; stats: { topicsMastered: number; totalTopics: number; totalXp: number } }`. Later tasks import all of these from `@/lib/progress`.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/progress.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  loadProgress,
  saveProgress,
  recordTopicResult,
  computeOverallStats,
} from "./progress";

const STORAGE_KEY = "git-tutor-progress";

describe("progress storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty object when nothing is stored", () => {
    expect(loadProgress()).toEqual({});
  });

  it("round-trips progress through localStorage", () => {
    saveProgress({ commit: { completed: true, bestScore: 2, totalQuestions: 2 } });
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(loadProgress()).toEqual({
      commit: { completed: true, bestScore: 2, totalQuestions: 2 },
    });
  });

  it("returns an empty object if stored JSON is corrupt", () => {
    window.localStorage.setItem(STORAGE_KEY, "not json");
    expect(loadProgress()).toEqual({});
  });
});

describe("recordTopicResult", () => {
  it("marks a topic completed only when the score is perfect", () => {
    const next = recordTopicResult({}, "commit", 1, 2);
    expect(next.commit).toEqual({ completed: false, bestScore: 1, totalQuestions: 2 });

    const perfect = recordTopicResult({}, "commit", 2, 2);
    expect(perfect.commit).toEqual({ completed: true, bestScore: 2, totalQuestions: 2 });
  });

  it("keeps the best score across attempts", () => {
    const first = recordTopicResult({}, "commit", 1, 2);
    const second = recordTopicResult(first, "commit", 0, 2);
    expect(second.commit.bestScore).toBe(1);
  });
});

describe("computeOverallStats", () => {
  it("counts mastered topics and sums XP", () => {
    const progress = {
      commit: { completed: true, bestScore: 2, totalQuestions: 2 },
      branch: { completed: false, bestScore: 1, totalQuestions: 2 },
    };
    expect(computeOverallStats(progress, 9)).toEqual({
      topicsMastered: 1,
      totalTopics: 9,
      totalXp: 3,
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/progress.test.ts`
Expected: FAIL — `progress.ts` does not exist yet (module not found).

- [ ] **Step 3: Implement `src/lib/progress.ts`**

```ts
import { useCallback, useState } from "react";

export interface TopicProgress {
  completed: boolean;
  bestScore: number;
  totalQuestions: number;
}

export type ProgressMap = Record<string, TopicProgress>;

const STORAGE_KEY = "git-tutor-progress";

export function loadProgress(): ProgressMap {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ProgressMap;
  } catch {
    return {};
  }
}

export function saveProgress(progress: ProgressMap): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function recordTopicResult(
  progress: ProgressMap,
  topicId: string,
  score: number,
  totalQuestions: number
): ProgressMap {
  const existing = progress[topicId];
  const bestScore = existing ? Math.max(existing.bestScore, score) : score;
  return {
    ...progress,
    [topicId]: {
      completed: score === totalQuestions,
      bestScore,
      totalQuestions,
    },
  };
}

export function computeOverallStats(progress: ProgressMap, totalTopics: number) {
  const values = Object.values(progress);
  const topicsMastered = values.filter((p) => p.completed).length;
  const totalXp = values.reduce((sum, p) => sum + p.bestScore, 0);
  return { topicsMastered, totalTopics, totalXp };
}

export function useProgress(totalTopics: number) {
  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress());

  const recordResult = useCallback(
    (topicId: string, score: number, totalQuestions: number) => {
      setProgress((prev) => {
        const next = recordTopicResult(prev, topicId, score, totalQuestions);
        saveProgress(next);
        return next;
      });
    },
    []
  );

  const stats = computeOverallStats(progress, totalTopics);

  return { progress, recordResult, stats };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/progress.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/progress.ts src/lib/progress.test.ts
git commit -m "feat: add localStorage-backed progress tracking"
```

---

### Task 3: Topic content data model

**Files:**
- Create: `src/components/gitgraphs/types.ts`, `src/data/topics.ts`, `src/data/topics.test.ts`
- Test: `src/data/topics.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `DiagramKind` union type (from `@/components/gitgraphs/types`), `QuizQuestion { question: string; options: string[]; correctIndex: number; explanation: string }`, `Topic { id: string; title: string; summary: string; explanation: string; diagrams: DiagramKind[]; quiz: QuizQuestion[] }`, `topics: Topic[]` — all from `@/data/topics`. Task 4 consumes `DiagramKind`. Tasks 5-8 consume `Topic`, `QuizQuestion`, and `topics`.

- [ ] **Step 1: Write the failing test**

Create `src/data/topics.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { topics } from "./topics";

describe("topics data", () => {
  it("defines exactly the 9 core topics in learning order", () => {
    expect(topics.map((t) => t.id)).toEqual([
      "init",
      "add",
      "commit",
      "branch",
      "checkout",
      "merge",
      "clone",
      "push",
      "pull",
    ]);
  });

  it("gives every topic between 2 and 4 quiz questions", () => {
    for (const topic of topics) {
      expect(topic.quiz.length).toBeGreaterThanOrEqual(2);
      expect(topic.quiz.length).toBeLessThanOrEqual(4);
    }
  });

  it("keeps every correctIndex within the options range", () => {
    for (const topic of topics) {
      for (const q of topic.quiz) {
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);
      }
    }
  });

  it("gives every topic at least one diagram", () => {
    for (const topic of topics) {
      expect(topic.diagrams.length).toBeGreaterThan(0);
    }
  });

  it("gives every question at least 3 answer options", () => {
    for (const topic of topics) {
      for (const q of topic.quiz) {
        expect(q.options.length).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/data/topics.test.ts`
Expected: FAIL — `topics.ts` does not exist yet.

- [ ] **Step 3: Create the `DiagramKind` type**

Create `src/components/gitgraphs/types.ts`:

```ts
export type DiagramKind =
  | "init"
  | "staging"
  | "commit"
  | "branch"
  | "checkout"
  | "mergeFastForward"
  | "mergeThreeWay"
  | "remoteClone"
  | "remotePush"
  | "remotePull";
```

- [ ] **Step 4: Implement `src/data/topics.ts`**

```ts
import type { DiagramKind } from "@/components/gitgraphs/types";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Topic {
  id: string;
  title: string;
  summary: string;
  explanation: string;
  diagrams: DiagramKind[];
  quiz: QuizQuestion[];
}

export const topics: Topic[] = [
  {
    id: "init",
    title: "git init",
    summary: "Turn a folder into a Git repository.",
    explanation:
      "`git init` creates a hidden `.git` folder inside your project. That folder is where Git stores every commit, branch, and bit of history — the rest of your files are untouched.\n\nYou only need to run it once per project. After that, Git starts tracking changes whenever you ask it to.",
    diagrams: ["init"],
    quiz: [
      {
        question: "What does `git init` actually create?",
        options: [
          "A hidden .git folder that stores Git's history for the project",
          "A remote repository on GitHub",
          "A backup copy of all your files",
          "A new branch called main",
        ],
        correctIndex: 0,
        explanation: "`git init` just creates the local `.git` metadata folder — nothing is uploaded anywhere.",
      },
      {
        question: "How many times do you typically run `git init` for a single project?",
        options: [
          "Once, when you first start tracking it with Git",
          "Every time you commit",
          "Every time you open the folder",
          "Once per branch",
        ],
        correctIndex: 0,
        explanation: "Once is enough — Git then tracks the project until you delete the `.git` folder.",
      },
    ],
  },
  {
    id: "add",
    title: "git add",
    summary: "Stage changes so Git knows what to include in the next commit.",
    explanation:
      "Editing a file changes your working directory, but Git doesn't commit it automatically. `git add <file>` moves those changes into the staging area — a preview of exactly what the next commit will contain.\n\nThis lets you commit only part of your work, like staging one fixed file while leaving an unfinished one out of the commit.",
    diagrams: ["staging"],
    quiz: [
      {
        question: "What is the purpose of the staging area?",
        options: [
          "To let you choose exactly which changes go into the next commit",
          "To permanently save your changes to GitHub",
          "To delete unwanted files",
          "To create a new branch",
        ],
        correctIndex: 0,
        explanation: "Staging is a preview/holding area between your edits and the permanent commit.",
      },
      {
        question: "If you edit two files but only run `git add fileA.txt`, what happens when you commit?",
        options: [
          "Only fileA.txt's changes are included in the commit",
          "Both files' changes are included",
          "Nothing is committed",
          "Git throws an error",
        ],
        correctIndex: 0,
        explanation: "Only staged changes are committed — fileB.txt's edits remain unstaged until you add it too.",
      },
    ],
  },
  {
    id: "commit",
    title: "git commit",
    summary: "Save a permanent snapshot of your staged changes.",
    explanation:
      "`git commit` takes everything in the staging area and saves it as a permanent, timestamped snapshot in your project's history, along with a message describing what changed.\n\nEach commit points back to its parent commit, forming a chain — that chain is what lets Git show you history, compare versions, and undo mistakes.",
    diagrams: ["commit"],
    quiz: [
      {
        question: "What does a commit capture?",
        options: [
          "A snapshot of the currently staged changes, with a message",
          "Every file that has ever existed in the project",
          "Only the files that changed since the last push",
          "A copy of the remote repository",
        ],
        correctIndex: 0,
        explanation: "A commit is a snapshot of what was staged at that moment, not a full rewrite of history.",
      },
      {
        question: "Why does each commit reference a parent commit?",
        options: [
          "So Git can reconstruct the full project history as a chain",
          "So Git knows which branch to delete",
          "So GitHub can bill you correctly",
          "It doesn't — commits are independent",
        ],
        correctIndex: 0,
        explanation: "The parent links form the commit graph, which is how `git log` and diffing work.",
      },
    ],
  },
  {
    id: "branch",
    title: "git branch",
    summary: "Create an independent line of development.",
    explanation:
      "A branch is just a movable label pointing at a commit. `git branch <name>` creates a new label pointing at your current commit — creating a branch is instant and cheap because no files are copied.\n\nBranches let you work on a feature or fix without touching `main` until you're ready to merge it back in.",
    diagrams: ["branch"],
    quiz: [
      {
        question: "What is a Git branch, technically?",
        options: [
          "A movable pointer/label to a specific commit",
          "A full copy of the project folder",
          "A separate Git repository",
          "A saved search filter",
        ],
        correctIndex: 0,
        explanation: "Branches are lightweight pointers, which is why creating one is instant.",
      },
      {
        question: "Why create a branch instead of editing `main` directly?",
        options: [
          "To isolate work-in-progress changes until they're ready to merge",
          "Because `main` can only hold one commit",
          "Branches are required before you can run `git add`",
          "To make the repository smaller",
        ],
        correctIndex: 0,
        explanation: "Branching isolates risky or incomplete work from the stable `main` line.",
      },
    ],
  },
  {
    id: "checkout",
    title: "git checkout",
    summary: "Switch which branch (or commit) you're working on.",
    explanation:
      "`git checkout <branch>` moves `HEAD` — Git's pointer to \"where you currently are\" — to a different branch, and updates your working directory to match that branch's files.\n\nCombine it with `-b` (`git checkout -b feature`) to create a new branch and switch to it in one step.",
    diagrams: ["checkout"],
    quiz: [
      {
        question: "What does `HEAD` represent?",
        options: [
          "A pointer to the branch/commit you currently have checked out",
          "The very first commit in the repository",
          "The remote server's main branch",
          "The staging area",
        ],
        correctIndex: 0,
        explanation: "`HEAD` always points at whatever you're currently \"looking at\" — usually the tip of your current branch.",
      },
      {
        question: "What does `git checkout -b feature` do?",
        options: [
          "Creates a new branch called feature and switches to it",
          "Deletes the feature branch",
          "Merges feature into main",
          "Renames the current branch to feature",
        ],
        correctIndex: 0,
        explanation: "`-b` is shorthand for create-then-switch in a single command.",
      },
    ],
  },
  {
    id: "merge",
    title: "git merge",
    summary: "Combine changes from one branch into another.",
    explanation:
      "`git merge <branch>` brings another branch's commits into your current branch. If your branch hasn't diverged (no new commits since the branch point), Git does a fast-forward — it just moves the pointer forward, no new commit needed.\n\nIf both branches have new commits, Git creates a three-way merge commit with two parents, combining both histories. This is also when merge conflicts can happen, if the same lines were changed differently on each side.",
    diagrams: ["mergeFastForward", "mergeThreeWay"],
    quiz: [
      {
        question: "When does Git perform a fast-forward merge?",
        options: [
          "When the current branch has no new commits since the other branch diverged",
          "Whenever you type --force",
          "Only when merging into main",
          "Every time you run git merge",
        ],
        correctIndex: 0,
        explanation: "Fast-forward is possible only when there's a straight line from your branch to the target — no divergence to reconcile.",
      },
      {
        question: "What makes a three-way merge different from a fast-forward?",
        options: [
          "It creates a new merge commit with two parent commits",
          "It deletes the source branch automatically",
          "It doesn't require staging",
          "It only works with remote branches",
        ],
        correctIndex: 0,
        explanation: "A three-way merge commit ties both diverged histories together via two parents.",
      },
    ],
  },
  {
    id: "clone",
    title: "git clone",
    summary: "Copy an existing remote repository to your machine.",
    explanation:
      "`git clone <url>` downloads a full copy of a remote repository — all its history, branches, and files — into a new folder on your machine, and automatically sets up the remote connection (usually named `origin`) for you.\n\nIt's typically the very first command you run when starting to work on an existing project.",
    diagrams: ["remoteClone"],
    quiz: [
      {
        question: "What does `git clone` set up automatically?",
        options: [
          "A remote connection (commonly named origin) pointing back to the source repository",
          "A new empty branch",
          "A merge conflict",
          "A GitHub account",
        ],
        correctIndex: 0,
        explanation: "Cloning wires up `origin` for you so `git pull`/`git push` work immediately.",
      },
      {
        question: "When would you typically use `git clone`?",
        options: [
          "The first time you get a copy of an existing project onto your machine",
          "Every time you save a file",
          "Only when deleting a repository",
          "Instead of git commit",
        ],
        correctIndex: 0,
        explanation: "You clone once to get started; after that you pull and push to stay in sync.",
      },
    ],
  },
  {
    id: "push",
    title: "git push",
    summary: "Upload your local commits to a remote repository.",
    explanation:
      "`git push` sends the commits you've made locally up to the remote repository (like GitHub), updating the remote branch to match yours.\n\nIf someone else has pushed commits you don't have yet, Git will reject the push until you pull and reconcile those changes first — this protects everyone's work from being silently overwritten.",
    diagrams: ["remotePush"],
    quiz: [
      {
        question: "What does `git push` do?",
        options: [
          "Uploads your local commits to the remote repository",
          "Downloads new commits from the remote",
          "Deletes your local commits",
          "Creates a new local branch",
        ],
        correctIndex: 0,
        explanation: "Push moves commits from your machine up to the shared remote.",
      },
      {
        question: "Why might `git push` be rejected?",
        options: [
          "The remote has commits you don't have locally yet",
          "You haven't run git init",
          "Your files are too large",
          "You're on the wrong operating system",
        ],
        correctIndex: 0,
        explanation: "Git blocks the push to prevent you from overwriting teammates' work — pull first, then push.",
      },
    ],
  },
  {
    id: "pull",
    title: "git pull",
    summary: "Download and merge changes from a remote repository.",
    explanation:
      "`git pull` fetches new commits from the remote repository and merges them into your current branch in one step — it's essentially `git fetch` followed by `git merge`.\n\nRunning `git pull` regularly keeps your local branch up to date with your teammates' work and reduces the chance of a painful, large merge conflict later.",
    diagrams: ["remotePull"],
    quiz: [
      {
        question: "What two steps does `git pull` combine?",
        options: [
          "Fetching remote commits, then merging them into your branch",
          "Staging and committing",
          "Cloning and branching",
          "Adding and pushing",
        ],
        correctIndex: 0,
        explanation: "`git pull` = `git fetch` + `git merge` in one command.",
      },
      {
        question: "Why pull regularly instead of only right before pushing?",
        options: [
          "It keeps your branch closer to teammates' work, avoiding large conflicts later",
          "It automatically writes your commit messages",
          "It's required before every git add",
          "It deletes old branches for you",
        ],
        correctIndex: 0,
        explanation: "Frequent small merges are far easier to resolve than one big divergence.",
      },
    ],
  },
];
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/data/topics.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/gitgraphs/types.ts src/data/topics.ts src/data/topics.test.ts
git commit -m "feat: add topic content data (9 core Git topics with quizzes)"
```

---

### Task 4: Git graph diagram components

**Files:**
- Create: `src/components/gitgraphs/primitives.tsx`, `src/components/gitgraphs/DiagramRenderer.tsx`, `src/components/gitgraphs/DiagramRenderer.test.tsx`
- Test: `src/components/gitgraphs/DiagramRenderer.test.tsx`

**Interfaces:**
- Consumes: `DiagramKind` from `@/components/gitgraphs/types` (Task 3).
- Produces: `DiagramRenderer({ kind }: { kind: DiagramKind }): JSX.Element` from `@/components/gitgraphs/DiagramRenderer`. Task 8 (`TopicPage`) consumes this.

- [ ] **Step 1: Write the failing test**

Create `src/components/gitgraphs/DiagramRenderer.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { DiagramRenderer } from "./DiagramRenderer";
import type { DiagramKind } from "./types";

const allKinds: DiagramKind[] = [
  "init",
  "staging",
  "commit",
  "branch",
  "checkout",
  "mergeFastForward",
  "mergeThreeWay",
  "remoteClone",
  "remotePush",
  "remotePull",
];

describe("DiagramRenderer", () => {
  it.each(allKinds)("renders an svg for the %s diagram kind", (kind) => {
    const { container } = render(<DiagramRenderer kind={kind} />);
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/gitgraphs/DiagramRenderer.test.tsx`
Expected: FAIL — `DiagramRenderer.tsx` does not exist yet.

- [ ] **Step 3: Implement the shared SVG primitives**

Create `src/components/gitgraphs/primitives.tsx`:

```tsx
export interface GraphNode {
  id: string;
  x: number;
  y: number;
  label: string;
  highlight?: boolean;
}

export interface GraphEdgeSpec {
  from: string;
  to: string;
}

export interface RefLabel {
  nodeId: string;
  text: string;
  dy?: number;
}

interface CommitGraphProps {
  nodes: GraphNode[];
  edges: GraphEdgeSpec[];
  refs?: RefLabel[];
}

export function CommitGraph({ nodes, edges, refs = [] }: CommitGraphProps) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  return (
    <svg viewBox="0 0 320 160" className="w-full max-w-sm mx-auto" role="img" aria-label="Git commit graph">
      {edges.map((e) => {
        const from = byId[e.from];
        const to = byId[e.to];
        return (
          <line
            key={`${e.from}-${e.to}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            className="stroke-muted-foreground"
            strokeWidth={2}
          />
        );
      })}
      {nodes.map((n) => (
        <g key={n.id}>
          <circle
            cx={n.x}
            cy={n.y}
            r={14}
            className={n.highlight ? "fill-primary" : "fill-muted-foreground/40"}
          />
          <text x={n.x} y={n.y + 28} textAnchor="middle" className="fill-foreground text-[10px]">
            {n.label}
          </text>
        </g>
      ))}
      {refs.map((r) => {
        const node = byId[r.nodeId];
        return (
          <text
            key={r.text}
            x={node.x}
            y={node.y - 20 + (r.dy ?? 0)}
            textAnchor="middle"
            className="fill-primary text-[10px] font-semibold"
          >
            {r.text}
          </text>
        );
      })}
    </svg>
  );
}

export interface FlowBox {
  label: string;
  caption?: string;
}

export function BoxFlow({ boxes }: { boxes: FlowBox[] }) {
  const width = 320;
  const boxWidth = 90;
  const gap = (width - boxes.length * boxWidth) / (boxes.length + 1);
  return (
    <svg viewBox={`0 0 ${width} 120`} className="w-full max-w-sm mx-auto" role="img" aria-label="Git flow diagram">
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" className="fill-primary" />
        </marker>
      </defs>
      {boxes.map((box, i) => {
        const x = gap + i * (boxWidth + gap);
        return (
          <g key={box.label}>
            <rect x={x} y={30} width={boxWidth} height={50} rx={8} className="fill-muted stroke-primary" strokeWidth={2} />
            <text x={x + boxWidth / 2} y={60} textAnchor="middle" className="fill-foreground text-[11px] font-medium">
              {box.label}
            </text>
            {box.caption && (
              <text x={x + boxWidth / 2} y={95} textAnchor="middle" className="fill-muted-foreground text-[9px]">
                {box.caption}
              </text>
            )}
            {i < boxes.length - 1 && (
              <line
                x1={x + boxWidth}
                y1={55}
                x2={x + boxWidth + gap}
                y2={55}
                className="stroke-primary"
                strokeWidth={2}
                markerEnd="url(#arrow)"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 4: Implement `DiagramRenderer`**

Create `src/components/gitgraphs/DiagramRenderer.tsx`:

```tsx
import { BoxFlow, CommitGraph } from "./primitives";
import type { DiagramKind } from "./types";

export function DiagramRenderer({ kind }: { kind: DiagramKind }) {
  switch (kind) {
    case "init":
      return <BoxFlow boxes={[{ label: "Folder", caption: "no git" }, { label: ".git/", caption: "git init" }]} />;
    case "staging":
      return (
        <BoxFlow
          boxes={[
            { label: "Working Dir", caption: "edit files" },
            { label: "Staging Area", caption: "git add" },
            { label: "Repository", caption: "git commit" },
          ]}
        />
      );
    case "commit":
      return (
        <CommitGraph
          nodes={[
            { id: "a", x: 60, y: 80, label: "A" },
            { id: "b", x: 140, y: 80, label: "B" },
            { id: "c", x: 220, y: 80, label: "C", highlight: true },
          ]}
          edges={[{ from: "a", to: "b" }, { from: "b", to: "c" }]}
          refs={[{ nodeId: "c", text: "HEAD" }]}
        />
      );
    case "branch":
      return (
        <CommitGraph
          nodes={[
            { id: "a", x: 60, y: 80, label: "A" },
            { id: "b", x: 140, y: 80, label: "B" },
            { id: "f", x: 220, y: 40, label: "F", highlight: true },
          ]}
          edges={[{ from: "a", to: "b" }, { from: "b", to: "f" }]}
          refs={[{ nodeId: "b", text: "main" }, { nodeId: "f", text: "feature" }]}
        />
      );
    case "checkout":
      return (
        <CommitGraph
          nodes={[
            { id: "a", x: 60, y: 80, label: "A" },
            { id: "b", x: 140, y: 80, label: "B", highlight: true },
            { id: "f", x: 220, y: 40, label: "F" },
          ]}
          edges={[{ from: "a", to: "b" }, { from: "b", to: "f" }]}
          refs={[{ nodeId: "b", text: "HEAD -> main" }, { nodeId: "f", text: "feature" }]}
        />
      );
    case "mergeFastForward":
      return (
        <CommitGraph
          nodes={[
            { id: "a", x: 60, y: 80, label: "A" },
            { id: "b", x: 140, y: 80, label: "B" },
            { id: "f", x: 220, y: 80, label: "F", highlight: true },
          ]}
          edges={[{ from: "a", to: "b" }, { from: "b", to: "f" }]}
          refs={[{ nodeId: "f", text: "main (moved)" }]}
        />
      );
    case "mergeThreeWay":
      return (
        <CommitGraph
          nodes={[
            { id: "a", x: 60, y: 80, label: "A" },
            { id: "b", x: 130, y: 50, label: "B" },
            { id: "f", x: 130, y: 110, label: "F" },
            { id: "m", x: 220, y: 80, label: "M", highlight: true },
          ]}
          edges={[
            { from: "a", to: "b" },
            { from: "a", to: "f" },
            { from: "b", to: "m" },
            { from: "f", to: "m" },
          ]}
          refs={[{ nodeId: "m", text: "main" }]}
        />
      );
    case "remoteClone":
      return <BoxFlow boxes={[{ label: "Remote Repo", caption: "GitHub" }, { label: "Local Repo", caption: "git clone" }]} />;
    case "remotePush":
      return <BoxFlow boxes={[{ label: "Local Repo", caption: "your commits" }, { label: "Remote Repo", caption: "git push" }]} />;
    case "remotePull":
      return <BoxFlow boxes={[{ label: "Remote Repo", caption: "teammates' commits" }, { label: "Local Repo", caption: "git pull" }]} />;
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/components/gitgraphs/DiagramRenderer.test.tsx`
Expected: PASS (10 tests, one per diagram kind).

- [ ] **Step 6: Commit**

```bash
git add src/components/gitgraphs/primitives.tsx src/components/gitgraphs/DiagramRenderer.tsx src/components/gitgraphs/DiagramRenderer.test.tsx
git commit -m "feat: add SVG git-graph diagrams for each topic"
```

---

### Task 5: Quiz component with confetti

**Files:**
- Create: `src/components/Quiz.tsx`, `src/components/Quiz.test.tsx`
- Test: `src/components/Quiz.test.tsx`

**Interfaces:**
- Consumes: `QuizQuestion` type from `@/data/topics` (Task 3); shadcn `Button`, `RadioGroup`, `RadioGroupItem`, `Label` from `src/components/ui/*` (Task 1); `confetti` default export from `canvas-confetti`.
- Produces: `Quiz({ questions: QuizQuestion[]; onComplete: (score: number) => void }): JSX.Element` from `@/components/Quiz`. Task 8 (`TopicPage`) consumes this.

- [ ] **Step 1: Write the failing tests**

Create `src/components/Quiz.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Quiz } from "./Quiz";
import type { QuizQuestion } from "@/data/topics";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
import confetti from "canvas-confetti";

const questions: QuizQuestion[] = [
  {
    question: "Q1?",
    options: ["right", "wrong"],
    correctIndex: 0,
    explanation: "Because right is right.",
  },
  {
    question: "Q2?",
    options: ["wrong", "right"],
    correctIndex: 1,
    explanation: "Because right is right.",
  },
];

describe("Quiz", () => {
  beforeEach(() => {
    vi.mocked(confetti).mockClear();
  });

  it("shows correct feedback and fires confetti on a correct answer", async () => {
    const user = userEvent.setup();
    render(<Quiz questions={questions} onComplete={vi.fn()} />);

    await user.click(screen.getByLabelText("right"));
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(confetti).toHaveBeenCalledTimes(1);
  });

  it("shows incorrect feedback and does not fire confetti on a wrong answer", async () => {
    const user = userEvent.setup();
    render(<Quiz questions={questions} onComplete={vi.fn()} />);

    await user.click(screen.getByLabelText("wrong"));
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(screen.getByText("Not quite.")).toBeInTheDocument();
    expect(confetti).not.toHaveBeenCalled();
  });

  it("calls onComplete with the final score after the last question, with a bonus confetti burst on a perfect run", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<Quiz questions={questions} onComplete={onComplete} />);

    await user.click(screen.getByLabelText("right"));
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await user.click(screen.getByRole("button", { name: "Next question" }));

    await user.click(screen.getByLabelText("right"));
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await user.click(screen.getByRole("button", { name: "Finish" }));

    expect(onComplete).toHaveBeenCalledWith(2);
    expect(confetti).toHaveBeenCalledTimes(3);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/Quiz.test.tsx`
Expected: FAIL — `Quiz.tsx` does not exist yet.

- [ ] **Step 3: Implement `src/components/Quiz.tsx`**

```tsx
import { useState } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { QuizQuestion } from "@/data/topics";

interface QuizProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

export function Quiz({ questions, onComplete }: QuizProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const question = questions[index];
  const isCorrect = submitted && selected === question.correctIndex;
  const isLast = index === questions.length - 1;

  function handleSubmit() {
    if (selected === null) return;
    setSubmitted(true);
    if (selected === question.correctIndex) {
      setScore((s) => s + 1);
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 } });
    }
  }

  function handleNext() {
    if (isLast) {
      if (score === questions.length) {
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
      }
      onComplete(score);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setSubmitted(false);
  }

  return (
    <div className="space-y-4" data-testid="quiz">
      <p className="text-sm text-muted-foreground">
        Question {index + 1} of {questions.length}
      </p>
      <p className="font-medium">{question.question}</p>
      <RadioGroup
        value={selected === null ? undefined : String(selected)}
        onValueChange={(v) => !submitted && setSelected(Number(v))}
      >
        {question.options.map((option, i) => (
          <div key={option} className="flex items-center space-x-2">
            <RadioGroupItem value={String(i)} id={`option-${i}`} disabled={submitted} />
            <Label htmlFor={`option-${i}`}>{option}</Label>
          </div>
        ))}
      </RadioGroup>

      {!submitted ? (
        <Button onClick={handleSubmit} disabled={selected === null}>
          Submit
        </Button>
      ) : (
        <div className="space-y-2">
          <p className={isCorrect ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
            {isCorrect ? "Correct!" : "Not quite."}
          </p>
          <p className="text-sm text-muted-foreground">{question.explanation}</p>
          <Button onClick={handleNext}>{isLast ? "Finish" : "Next question"}</Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/Quiz.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Quiz.tsx src/components/Quiz.test.tsx
git commit -m "feat: add interactive quiz component with confetti feedback"
```

---

### Task 6: Sidebar and Header components

**Files:**
- Create: `src/components/Sidebar.tsx`, `src/components/Header.tsx`, `src/components/Sidebar.test.tsx`
- Test: `src/components/Sidebar.test.tsx`

**Interfaces:**
- Consumes: `topics` from `@/data/topics` (Task 3); `ProgressMap` type from `@/lib/progress` (Task 2); shadcn `Badge`, `Progress` (Task 1).
- Produces: `Sidebar({ progress: ProgressMap; topicsMastered: number }): JSX.Element` and `Header({ totalXp: number }): JSX.Element` from `@/components/Sidebar` and `@/components/Header`. Task 9 (`App`) consumes both.

- [ ] **Step 1: Write the failing test**

Create `src/components/Sidebar.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import type { ProgressMap } from "@/lib/progress";

describe("Sidebar", () => {
  it("shows a checkmark badge for completed topics and a score badge for in-progress ones", () => {
    const progress: ProgressMap = {
      commit: { completed: true, bestScore: 2, totalQuestions: 2 },
      branch: { completed: false, bestScore: 1, totalQuestions: 2 },
    };

    render(
      <MemoryRouter>
        <Sidebar progress={progress} topicsMastered={1} />
      </MemoryRouter>
    );

    expect(screen.getByText("git commit")).toBeInTheDocument();
    expect(screen.getByText("✓")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText("1 / 9 topics mastered")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/Sidebar.test.tsx`
Expected: FAIL — `Sidebar.tsx` does not exist yet.

- [ ] **Step 3: Implement `src/components/Header.tsx`**

```tsx
interface HeaderProps {
  totalXp: number;
}

export function Header({ totalXp }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <h1 className="text-lg font-semibold">Git Tutorial &amp; Quiz</h1>
      <p className="text-sm text-muted-foreground">⭐ {totalXp} XP</p>
    </header>
  );
}
```

- [ ] **Step 4: Implement `src/components/Sidebar.tsx`**

```tsx
import { NavLink } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { topics } from "@/data/topics";
import type { ProgressMap } from "@/lib/progress";

interface SidebarProps {
  progress: ProgressMap;
  topicsMastered: number;
}

export function Sidebar({ progress, topicsMastered }: SidebarProps) {
  const percent = Math.round((topicsMastered / topics.length) * 100);

  return (
    <nav className="w-64 shrink-0 border-r p-4 space-y-4" aria-label="Topics">
      <div>
        <p className="text-sm font-medium mb-1">Overall progress</p>
        <Progress value={percent} />
        <p className="text-xs text-muted-foreground mt-1">
          {topicsMastered} / {topics.length} topics mastered
        </p>
      </div>
      <ul className="space-y-1">
        {topics.map((topic) => {
          const p = progress[topic.id];
          return (
            <li key={topic.id}>
              <NavLink
                to={`/topic/${topic.id}`}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-muted ${
                    isActive ? "bg-muted font-medium" : ""
                  }`
                }
              >
                <span>{topic.title}</span>
                {p?.completed ? (
                  <Badge>✓</Badge>
                ) : p ? (
                  <Badge variant="secondary">
                    {p.bestScore}/{p.totalQuestions}
                  </Badge>
                ) : null}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/components/Sidebar.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add src/components/Sidebar.tsx src/components/Header.tsx src/components/Sidebar.test.tsx
git commit -m "feat: add sidebar navigation with per-topic progress badges"
```

---

### Task 7: Dashboard page

**Files:**
- Create: `src/pages/Dashboard.tsx`, `src/pages/Dashboard.test.tsx`
- Test: `src/pages/Dashboard.test.tsx`

**Interfaces:**
- Consumes: `topics` from `@/data/topics` (Task 3); `ProgressMap` from `@/lib/progress` (Task 2); shadcn `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `Button` (Task 1).
- Produces: `Dashboard({ progress: ProgressMap }): JSX.Element` from `@/pages/Dashboard`. Task 9 (`App`) consumes this as the `/` route element.

- [ ] **Step 1: Write the failing test**

Create `src/pages/Dashboard.test.tsx`:

```tsx
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
    expect(screen.getAllByRole("link", { name: "Start" })).toHaveLength(9);
  });

  it("shows Review for a completed topic", () => {
    render(
      <MemoryRouter>
        <Dashboard progress={{ commit: { completed: true, bestScore: 2, totalQuestions: 2 } }} />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Review" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/pages/Dashboard.test.tsx`
Expected: FAIL — `Dashboard.tsx` does not exist yet.

- [ ] **Step 3: Implement `src/pages/Dashboard.tsx`**

```tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { topics } from "@/data/topics";
import type { ProgressMap } from "@/lib/progress";

interface DashboardProps {
  progress: ProgressMap;
}

export function Dashboard({ progress }: DashboardProps) {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Choose a topic</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.map((topic) => {
          const p = progress[topic.id];
          const label = p?.completed ? "Review" : p ? "Continue" : "Start";
          return (
            <Card key={topic.id}>
              <CardHeader>
                <CardTitle>{topic.title}</CardTitle>
                <CardDescription>{topic.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant={p?.completed ? "secondary" : "default"}>
                  <Link to={`/topic/${topic.id}`}>{label}</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/pages/Dashboard.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.tsx src/pages/Dashboard.test.tsx
git commit -m "feat: add dashboard page listing all topics with progress"
```

---

### Task 8: Topic page

**Files:**
- Create: `src/pages/TopicPage.tsx`, `src/pages/TopicPage.test.tsx`
- Test: `src/pages/TopicPage.test.tsx`

**Interfaces:**
- Consumes: `topics` from `@/data/topics` (Task 3); `DiagramRenderer` from `@/components/gitgraphs/DiagramRenderer` (Task 4); `Quiz` from `@/components/Quiz` (Task 5); shadcn `Button` (Task 1); `useParams`, `useNavigate`, `Link` from `react-router-dom`.
- Produces: `TopicPage({ onQuizComplete: (topicId: string, score: number, totalQuestions: number) => void }): JSX.Element` from `@/pages/TopicPage`. Task 9 (`App`) consumes this as the `/topic/:id` route element.

- [ ] **Step 1: Write the failing test**

Create `src/pages/TopicPage.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
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

describe("TopicPage", () => {
  it("renders the topic's explanation, diagram, and quiz", () => {
    renderTopicPage();

    expect(screen.getByRole("heading", { name: "git init" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Git flow diagram" })).toBeInTheDocument();
    expect(screen.getByTestId("quiz")).toBeInTheDocument();
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
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/pages/TopicPage.test.tsx`
Expected: FAIL — `TopicPage.tsx` does not exist yet.

- [ ] **Step 3: Implement `src/pages/TopicPage.tsx`**

```tsx
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DiagramRenderer } from "@/components/gitgraphs/DiagramRenderer";
import { Quiz } from "@/components/Quiz";
import { topics } from "@/data/topics";

interface TopicPageProps {
  onQuizComplete: (topicId: string, score: number, totalQuestions: number) => void;
}

export function TopicPage({ onQuizComplete }: TopicPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const topic = topics.find((t) => t.id === id);

  if (!topic) {
    return (
      <div className="p-6">
        <p>Topic not found.</p>
        <Link to="/" className="underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{topic.title}</h2>
        {topic.explanation.split("\n\n").map((paragraph, i) => (
          <p key={i} className="mt-2 text-sm leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="flex flex-wrap gap-6 justify-center">
        {topic.diagrams.map((kind) => (
          <DiagramRenderer key={kind} kind={kind} />
        ))}
      </div>

      <div className="border-t pt-6">
        <h3 className="font-medium mb-3">Quiz</h3>
        <Quiz
          questions={topic.quiz}
          onComplete={(score) => onQuizComplete(topic.id, score, topic.quiz.length)}
        />
      </div>

      <Button variant="outline" onClick={() => navigate("/")}>
        Back to dashboard
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/pages/TopicPage.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/TopicPage.tsx src/pages/TopicPage.test.tsx
git commit -m "feat: add topic page combining explanation, diagram, and quiz"
```

---

### Task 9: App wiring, routing, and final verification

**Files:**
- Create: `src/App.test.tsx`
- Modify: `src/main.tsx`, `src/App.tsx`
- Delete: `src/App.css` (unused default Vite styling, replaced by Tailwind), default Vite assets in `src/assets/` if unused
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `useProgress`, `topics.length` (Task 2, 3); `Header`, `Sidebar` (Task 6); `Dashboard` (Task 7); `TopicPage` (Task 8); `Toaster`, `toast` from `@/components/ui/sonner` / `sonner` (Task 1).
- Produces: `App(): JSX.Element` from `@/App`, rendered inside `BrowserRouter` by `src/main.tsx`. Nothing downstream consumes this — it is the composition root.

- [ ] **Step 1: Write the failing test**

Create `src/App.test.tsx`:

```tsx
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

    await user.click(screen.getAllByRole("link", { name: "Start" })[0]);

    expect(screen.getByRole("heading", { name: "git init" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL — `App.tsx` still contains the default Vite counter demo, not this app's UI.

- [ ] **Step 3: Replace `src/App.tsx`**

```tsx
import { Routes, Route } from "react-router-dom";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/pages/Dashboard";
import { TopicPage } from "@/pages/TopicPage";
import { useProgress } from "@/lib/progress";
import { topics } from "@/data/topics";

export function App() {
  const { progress, recordResult, stats } = useProgress(topics.length);

  function handleQuizComplete(topicId: string, score: number, totalQuestions: number) {
    recordResult(topicId, score, totalQuestions);
    if (score === totalQuestions) {
      toast.success("Topic mastered! 🎉");
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header totalXp={stats.totalXp} />
      <div className="flex flex-1">
        <Sidebar progress={progress} topicsMastered={stats.topicsMastered} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard progress={progress} />} />
            <Route path="/topic/:id" element={<TopicPage onQuizComplete={handleQuizComplete} />} />
          </Routes>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
```

Delete `src/App.css` and remove its import if the scaffold's `App.tsx` had one (this new `App.tsx` has none). Remove any now-unused files under `src/assets/` left over from the default Vite template.

- [ ] **Step 4: Wire up `src/main.tsx`**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 6: Run the full automated test suite**

Run: `npx vitest run`
Expected: all tests across every task pass (progress, topics, DiagramRenderer, Quiz, Sidebar, Dashboard, TopicPage, App).

- [ ] **Step 7: Run a production build**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 8: Manual verification pass**

Run: `npm run dev`, open the app in a browser, and walk through the spec's verification checklist:

- Click through every topic in the sidebar in order; confirm tutorial text and diagram(s) render correctly for each.
- Answer at least one question per topic correctly and one incorrectly; confirm feedback styling, explanation text, small confetti burst on correct answers, and the larger confetti burst + "Topic mastered! 🎉" toast on a fully-correct topic.
- Reload the page mid-course; confirm sidebar badges and the overall progress bar still reflect prior answers.
- Clear `localStorage` (DevTools) and reload; confirm the app starts cleanly from a blank state with no errors.

Stop the dev server once verification is complete.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: wire up App composition root with routing and progress tracking"
```

---

## Post-plan

Once all 9 tasks are complete, the app is feature-complete per the spec. No further tasks are defined in this plan; any follow-up (e.g. adding rebase/stash topics) should go through a new brainstorming cycle.
