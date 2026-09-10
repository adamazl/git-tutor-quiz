import type { ReactNode } from "react";

/**
 * Renders a string that uses markdown-style backticks for inline code
 * (e.g. "Run `git init` now") as React nodes, wrapping the backtick-delimited
 * segments in <code> elements instead of showing literal backtick characters.
 */
export function renderWithInlineCode(text: string): ReactNode[] {
  return text.split("`").map((segment, i) =>
    i % 2 === 1 ? (
      <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]">
        {segment}
      </code>
    ) : (
      segment
    )
  );
}
