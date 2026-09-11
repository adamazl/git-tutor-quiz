import type { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { AccountDialog } from "@/components/AccountDialog";

interface HeaderProps {
  totalXp: number;
  user: User | null;
  onSignOut: () => void;
}

export function Header({ totalXp, user, onSignOut }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <h1 className="text-lg font-semibold">Git Gud</h1>
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground">⭐ {totalXp} XP</p>
        {user ? (
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">{user.email}</p>
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
