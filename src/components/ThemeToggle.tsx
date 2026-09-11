import { useTheme } from "next-themes";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const THEMES = ["light", "dark", "system"] as const;

const THEME_ICONS = {
  light: SunIcon,
  dark: MoonIcon,
  system: MonitorIcon,
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const current = (theme as (typeof THEMES)[number]) ?? "system";
  const Icon = THEME_ICONS[current];

  function cycleTheme() {
    const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
    setTheme(next);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      aria-label={`Theme: ${current}. Click to switch to ${
        THEMES[(THEMES.indexOf(current) + 1) % THEMES.length]
      }.`}
    >
      <Icon />
    </Button>
  );
}
