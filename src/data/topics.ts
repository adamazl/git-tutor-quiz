import type { DiagramKind } from "@/components/gitgraphs/types";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type TopicTier = "beginner" | "intermediate" | "advanced";

export interface Topic {
  id: string;
  title: string;
  summary: string;
  explanation: string;
  diagrams: DiagramKind[];
  quiz: QuizQuestion[];
  tier: TopicTier;
  /** Credits required to unlock this topic. Beginner topics are always free. */
  unlockCost?: number;
}

export const topics: Topic[] = [
  {
    id: "init",
    tier: "beginner",
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
    tier: "beginner",
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
    tier: "beginner",
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
    tier: "beginner",
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
    tier: "beginner",
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
    tier: "beginner",
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
    tier: "beginner",
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
    tier: "beginner",
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
    tier: "beginner",
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
  {
    id: "stash",
    tier: "intermediate",
    unlockCost: 30,
    title: "git stash",
    summary: "Set aside uncommitted changes temporarily without committing them.",
    explanation:
      "Sometimes you need to switch branches or pull in teammates' work, but your working directory is mid-edit and not ready for a commit. `git stash` shelves those uncommitted changes onto a stack and gives you a clean working directory again.\n\nWhen you're ready to pick the work back up, `git stash pop` reapplies the most recent stash and removes it from the stack. Nothing is lost — it's just parked out of the way.",
    diagrams: ["stash"],
    quiz: [
      {
        question: "What does `git stash` do to your uncommitted changes?",
        options: [
          "Shelves them on a stack and restores a clean working directory",
          "Permanently deletes them",
          "Commits them immediately",
          "Pushes them to the remote",
        ],
        correctIndex: 0,
        explanation: "Stashing sets changes aside without committing or discarding them.",
      },
      {
        question: "How do you bring back the most recently stashed changes?",
        options: ["`git stash pop`", "`git stash delete`", "`git checkout stash`", "`git pull stash`"],
        correctIndex: 0,
        explanation: "`git stash pop` reapplies the latest stash and removes it from the stack.",
      },
    ],
  },
  {
    id: "rebase",
    tier: "advanced",
    unlockCost: 50,
    title: "git rebase",
    summary: "Replay your branch's commits onto a new base for a cleaner, linear history.",
    explanation:
      "`git rebase <branch>` takes the commits unique to your current branch and replays them one by one on top of `<branch>`'s latest commit, instead of tying the two histories together with a merge commit. The result reads as if you'd started your work from that newer point all along.\n\nThis is powerful but rewrites commit history — the replayed commits get new hashes. Avoid rebasing commits that have already been pushed and shared, since anyone else working from the old commits will end up with a diverged, conflicting history.",
    diagrams: ["rebase"],
    quiz: [
      {
        question: "What does `git rebase main` do to your current branch's commits?",
        options: [
          "Replays them on top of main's latest commit, giving them new hashes",
          "Deletes them and starts over",
          "Merges main into your branch with a merge commit",
          "Pushes them directly to main",
        ],
        correctIndex: 0,
        explanation: "Rebase reapplies your commits on a new base rather than creating a merge commit.",
      },
      {
        question: "Why should you avoid rebasing commits you've already pushed and shared?",
        options: [
          "It rewrites their hashes, so collaborators working from the old commits get a diverged history",
          "It's not technically possible",
          "It automatically force-pushes for you",
          "It deletes the remote branch",
        ],
        correctIndex: 0,
        explanation: "Rebasing shared history creates two conflicting versions of the same commits.",
      },
    ],
  },
];
