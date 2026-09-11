import type { User } from "firebase/auth";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountDialog } from "@/components/AccountDialog";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

interface HeaderProps {
  totalXp: number;
  user: User | null;
  onSignOut: () => void;
  onMenuClick: () => void;
}

export function Header({ totalXp, user, onSignOut, onMenuClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between gap-2 border-b px-2 py-3 sm:px-6 sm:py-4">
      <div className="flex items-center gap-2 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={onMenuClick}
          aria-label="Open topics menu"
        >
          <MenuIcon />
        </Button>
        <h1 className="flex items-center gap-2 min-w-0 text-lg font-semibold">
          <Logo className="h-7 w-7 shrink-0" />
          <span className="truncate">Git Gud</span>
        </h1>
      </div>
      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        <p className="text-sm text-muted-foreground whitespace-nowrap">⭐ {totalXp} XP</p>
        <ThemeToggle />
        {user ? (
          <div className="flex items-center gap-2">
            <p className="hidden truncate text-sm text-muted-foreground sm:block sm:max-w-[10rem]">
              {user.email}
            </p>
            <Button variant="ghost" size="sm" onClick={onSignOut}>
              Sign out
            </Button>
          </div>
        ) : (
          <AccountDialog />
        )}
      </div>
    </header>
  );
}
