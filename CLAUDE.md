# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — typecheck (`tsc -b`) then production build
- `npm run lint` — run Oxlint
- `npm run preview` — preview the production build
- `npm test` — run the full Vitest suite once (not watch mode)
- `npx vitest run src/lib/auth.test.ts` — run a single test file
- `npx vitest` — run in watch mode

Tests use `jsdom` + React Testing Library; global test APIs (`describe`/`it`/`expect`) are enabled via `globals: true` in `vite.config.ts`, and `src/test/setup.ts` is loaded before each run. Every non-trivial module has a co-located `*.test.ts(x)` file — follow that convention for new modules.

## Architecture

Git Gud is a client-side-only (no custom backend) gamified Git tutorial: static lesson content paired with multiple-choice quizzes, confetti on success, and optional cloud-synced progress. Stack: Vite + React 19 + TypeScript + Tailwind v4 + react-router-dom, shadcn/ui components (`src/components/ui`, style `base-nova`, see `components.json`) with `@/` aliased to `src/`.

### Content model
`src/data/topics.ts` is the single source of truth for all lesson content: a static array of `Topic` objects (id, title, explanation text, one or more `DiagramKind`s, and a `quiz: QuizQuestion[]`). `TopicPage` looks up a topic by the `:id` route param and renders its explanation, diagrams, and `Quiz` in sequence — adding a topic means adding an entry here, nothing else needs to change structurally.

### Diagrams
`src/components/gitgraphs/` renders the small illustrative SVGs. `DiagramRenderer` is a switch over `DiagramKind` (`types.ts`) that composes the two generic primitives in `primitives.tsx`: `BoxFlow` (linear box-to-box flow, e.g. working dir → staging → repo) and `CommitGraph` (nodes/edges/refs, e.g. commit history, branches, merges). New diagrams are usually a new `DiagramKind` case built from these primitives rather than a bespoke component.

### Progress and auth
Three modules work together and should be understood as a unit:
- `src/lib/auth.ts` — Firebase Auth wrapper (`useAuth`, sign in/up/out, change password, delete account). All operations no-op or throw a friendly error when Firebase isn't configured (see below).
- `src/lib/cloudProgress.ts` — Firestore reads/writes of a user's progress map (`users/{uid}` doc), plus `mergeProgressMaps` for reconciling local in-session state with what's stored in the cloud on sign-in.
- `src/lib/progress.ts` — `useProgress(totalTopics, user)` hook holding the actual `ProgressMap` React state, recording quiz results, and computing overall stats (topics mastered, total XP).

Progress is **cloud-only, not `localStorage`** (this was changed post-launch — see git history "Drop localStorage progress"; the design doc under `docs/superpowers/specs/` still describes the original `localStorage` plan and is out of date on this point). Signed-out play updates in-memory state for the current tab only and is lost on reload; signed-in users get their progress loaded from and saved to Firestore on every quiz completion.

### Firebase configuration is optional
`src/lib/firebase.ts` only calls `initializeApp`/`getAuth`/`getFirestore` when `VITE_FIREBASE_*` env vars are present (`firebaseConfigured`); otherwise `auth`/`db` stay `null` and every caller in `auth.ts`/`cloudProgress.ts` guards on that. This lets the app run fully anonymously (quizzes and diagrams work, no account features) without any env setup. Required vars are listed in `.env.example`; the GitHub Pages deploy workflow (`.github/workflows/deploy.yml`) injects them from repo secrets at build time.

### Routing
Two routes only: `/` → `Dashboard` (topic list/progress overview), `/topic/:id` → `TopicPage`. Both live under `App.tsx`, which owns the `useAuth`/`useProgress` state and passes callbacks down.

### Deployment
Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages. `vite.config.ts` sets `base: "/gitgud/"` to match the Pages subpath — keep this in sync if the repo/Pages path changes.
