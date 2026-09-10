# Git Tutorial & Quiz App — Design Spec

Date: 2026-09-10
Status: Approved for implementation

## Purpose

A gamified, self-paced web app that teaches beginner software developers
the core Git commands and concepts through short tutorials paired with
multiple-choice quizzes. Correct answers trigger confetti celebrations;
progress persists across visits.

## Audience & Scope

- **Audience:** beginner software developers with little/no prior Git
  experience.
- **Topics covered (Core set):** `init`, `add`, `commit`, `branch`,
  `checkout`, `merge` (including fast-forward vs. three-way merge),
  `pull`, `push`, `clone`.
- **Out of scope (for this iteration):** rebase, stash, reset, cherry-pick,
  conflict resolution exercises, command fill-in/typing exercises, visual
  branch-diagram interpretation questions, backend/auth, multi-user
  accounts.

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS
- shadcn/ui components: `Card`, `Button`, `Progress`, `Badge`,
  `Separator`, `Dialog`, `RadioGroup`, `Toast`
- `canvas-confetti` for celebration effects
- `react-router-dom` for topic routing
- No backend — fully client-side, state persisted via `localStorage`

## Architecture

### Content model (`src/data/topics.ts`)

Each topic is a typed object:

```ts
interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string; // shown after answering
}

interface Topic {
  id: string;           // slug, e.g. "commit"
  title: string;
  summary: string;      // one-line teaser for sidebar/dashboard
  explanation: string;  // tutorial body (markdown-ish, rendered as JSX)
  diagram: DiagramKind; // which GitGraph component to render
  quiz: QuizQuestion[]; // 2-4 questions
}
```

Topics array is static, ordered by suggested learning sequence
(init → add → commit → branch → checkout → merge → pull → push → clone).

### Components

- `src/components/gitgraphs/*.tsx` — small SVG components visualizing
  commit history, branch creation, fast-forward merge vs. three-way
  merge, and remote push/pull/clone flows. Purely illustrative, no
  interaction required.
- `src/components/Quiz.tsx` — renders one question at a time from a
  topic's quiz array. Uses shadcn `RadioGroup` for answer choices.
  On submit: shows correct/incorrect styling, a short explanation, and
  (if correct) fires a small `canvas-confetti` burst. "Next question"
  advances; retries are unlimited and non-punitive. On finishing all
  questions in a topic, records topic completion + score and fires a
  larger confetti burst plus a completion toast.
- `src/components/Sidebar.tsx` — lists all topics with a completion
  badge (✓ or "x/y correct"), plus an overall progress bar at the top
  computed from `useProgress()`.
- `src/components/Header.tsx` — app title, overall XP/"topics mastered"
  count.
- `src/lib/progress.ts` — `useProgress()` hook wrapping `localStorage`
  reads/writes. Stores, per topic id: `{ completed: boolean, bestScore:
  number, totalQuestions: number }`. Exposes helpers to record a quiz
  result and compute overall stats (topics mastered, total XP).
- `src/pages/Dashboard.tsx` — landing page: grid/list of topic cards
  with summary + progress, overall stats banner, "Start"/"Review" CTA
  per topic.
- `src/pages/TopicPage.tsx` — renders a topic's explanation, its
  diagram, then the `Quiz` component. Route: `/topic/:id`.

### Routing

- `/` → Dashboard
- `/topic/:id` → TopicPage

### Gamification rules

- Small confetti burst (`canvas-confetti` default preset, short
  duration) on each individual correct answer.
- Larger multi-burst confetti + toast ("Topic mastered! 🎉") when a
  user finishes all questions in a topic's quiz with all-correct
  answers on the current attempt.
- No penalty for wrong answers — user sees the correct answer and
  explanation, can retry the question immediately.
- Overall progress bar and "topics mastered" count give a sense of
  advancement across the whole course.

### Persistence

- `localStorage` key (e.g. `git-tutor-progress`) holding a JSON map of
  topic id → progress record, as described above. Read on app load via
  `useProgress()`; written on every quiz completion event. No
  versioning/migration needed for v1 (single flat schema).

## Testing / Verification Plan

Given this is a UI/content-heavy app, verification is primarily manual:

- `npm run dev`, click through every topic in order, verify tutorial
  text and diagram render correctly.
- Answer each quiz question both correctly and incorrectly at least
  once; verify feedback styling, explanation text, and confetti firing
  behavior (small burst on correct answer, large burst + toast on full
  topic completion).
- Reload the page mid-course and confirm progress (badges, overall bar)
  persists correctly from `localStorage`.
- Clear `localStorage` and confirm the app starts cleanly from a blank
  state.
- `npm run build` to confirm a clean production build with no
  TypeScript errors.

Unit tests are not planned for v1 given the small, static content
surface; this can be revisited if the content model grows.
