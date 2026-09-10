import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { renderWithInlineCode } from "./inline-code";

describe("renderWithInlineCode", () => {
  it("wraps backtick-delimited segments in <code> elements", () => {
    const { container, getByText } = render(<p>{renderWithInlineCode("Run `git init` now")}</p>);

    const code = getByText("git init");
    expect(code.tagName).toBe("CODE");
    expect(container.textContent).toBe("Run git init now");
    expect(container.textContent).not.toContain("`");
  });

  it("returns the plain text unchanged when there are no backticks", () => {
    const { container } = render(<p>{renderWithInlineCode("No code here")}</p>);
    expect(container.textContent).toBe("No code here");
  });
});
