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
  "rebase",
  "stash",
];

describe("DiagramRenderer", () => {
  it.each(allKinds)("renders an svg for the %s diagram kind", (kind) => {
    const { container } = render(<DiagramRenderer kind={kind} />);
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
