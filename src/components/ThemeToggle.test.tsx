import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("defaults to following the device setting", () => {
    renderToggle();

    expect(screen.getByRole("button", { name: /^Theme: system\./ })).toBeInTheDocument();
  });

  it("cycles light -> dark -> system on repeated clicks", async () => {
    const user = userEvent.setup();
    renderToggle();

    await user.click(screen.getByRole("button", { name: /^Theme: system\./ }));
    expect(screen.getByRole("button", { name: /^Theme: light\./ })).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    await user.click(screen.getByRole("button", { name: /^Theme: light\./ }));
    expect(screen.getByRole("button", { name: /^Theme: dark\./ })).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    await user.click(screen.getByRole("button", { name: /^Theme: dark\./ }));
    expect(screen.getByRole("button", { name: /^Theme: system\./ })).toBeInTheDocument();
  });
});
