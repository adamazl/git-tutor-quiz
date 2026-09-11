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

    expect(screen.getByRole("button", { name: "Match device setting" })).toBeInTheDocument();
  });

  it("cycles light -> dark -> system on repeated clicks", async () => {
    const user = userEvent.setup();
    renderToggle();

    await user.click(screen.getByRole("button", { name: "Match device setting" }));
    expect(screen.getByRole("button", { name: "Light theme" })).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    await user.click(screen.getByRole("button", { name: "Light theme" }));
    expect(screen.getByRole("button", { name: "Dark theme" })).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    await user.click(screen.getByRole("button", { name: "Dark theme" }));
    expect(screen.getByRole("button", { name: "Match device setting" })).toBeInTheDocument();
  });

  it("shows a tooltip describing the current theme on hover", async () => {
    const user = userEvent.setup();
    renderToggle();

    await user.hover(screen.getByRole("button", { name: "Match device setting" }));

    expect(await screen.findByText("Match device setting")).toBeInTheDocument();
  });
});
