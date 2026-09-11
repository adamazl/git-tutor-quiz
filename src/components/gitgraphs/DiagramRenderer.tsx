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
    case "rebase":
      return (
        <CommitGraph
          nodes={[
            { id: "a", x: 60, y: 80, label: "A" },
            { id: "b", x: 140, y: 80, label: "B" },
            { id: "f", x: 220, y: 80, label: "F'", highlight: true },
          ]}
          edges={[{ from: "a", to: "b" }, { from: "b", to: "f" }]}
          refs={[{ nodeId: "b", text: "main" }, { nodeId: "f", text: "feature" }]}
        />
      );
    case "stash":
      return (
        <BoxFlow
          boxes={[
            { label: "Working Dir", caption: "uncommitted changes" },
            { label: "Stash", caption: "git stash" },
          ]}
        />
      );
  }
}
