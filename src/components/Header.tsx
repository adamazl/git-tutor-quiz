import type { User } from "firebase/auth";
import { MenuIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AccountDialog } from "@/components/AccountDialog";
import { AccountMenu } from "@/components/AccountMenu";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

interface HeaderProps {
  totalXp: number;
  credits: number;
  user: User | null;
  onSignOut: () => void;
  onResetProgress: () => void;
  onMenuClick: () => void;
}

export function Header({ totalXp, credits, user, onSignOut, onResetProgress, onMenuClick }: HeaderProps) {
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
        <h1 className="min-w-0 text-lg font-semibold">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <Logo className="h-7 w-7 shrink-0" />
            <span className="truncate">Git Gud</span>
          </Link>
        </h1>
      </div>
      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        <p className="text-sm text-muted-foreground whitespace-nowrap">⭐ {totalXp} XP</p>
        <p className="text-sm text-muted-foreground whitespace-nowrap">🪙 {credits}</p>
        <ThemeToggle />
        {user ? (
          <AccountMenu user={user} onSignOut={onSignOut} onResetProgress={onResetProgress} />
        ) : (
          <AccountDialog />
        )}
      </div>
    </header>
  );
}
