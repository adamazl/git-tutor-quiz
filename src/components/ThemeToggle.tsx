import { useTheme } from "next-themes";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const THEMES = ["light", "dark", "system"] as const;

const THEME_ICONS = {
  light: SunIcon,
  dark: MoonIcon,
  system: MonitorIcon,
};

const THEME_LABELS = {
  light: "Light theme",
  dark: "Dark theme",
  system: "Match device setting",
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const current = (theme as (typeof THEMES)[number]) ?? "system";
  const Icon = THEME_ICONS[current];
  const label = THEME_LABELS[current];

  function cycleTheme() {
    const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
    setTheme(next);
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon" onClick={cycleTheme} aria-label={label} />
        }
      >
        <Icon />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
