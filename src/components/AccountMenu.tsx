import { useState, type FormEvent } from "react";
import type { User } from "firebase/auth";
import { KeyIcon, LogOutIcon, RotateCcwIcon, Trash2Icon, UserIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword, deleteAccount } from "@/lib/auth";
import { friendlyAuthError } from "@/lib/authErrors";

type ActiveDialog = "password" | "reset" | "delete" | null;

interface AccountMenuProps {
  user: User;
  onSignOut: () => void;
  onResetProgress: () => void;
}

export function AccountMenu({ user, onSignOut, onResetProgress }: AccountMenuProps) {
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);

  function handleSignOut() {
    onSignOut();
    toast.success("Signed out. Log back in to load your saved progress.");
  }

  function handleResetProgress() {
    onResetProgress();
    setActiveDialog(null);
    toast.success("Progress reset.");
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Account menu"
          className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Avatar>
            <AvatarFallback>
              <UserIcon className="size-4" />
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setActiveDialog("password")}>
            <KeyIcon /> Change password
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveDialog("reset")}>
            <RotateCcwIcon /> Reset progress
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setActiveDialog("delete")}>
            <Trash2Icon /> Delete account
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOutIcon /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangePasswordDialog
        user={user}
        open={activeDialog === "password"}
        onOpenChange={(open) => setActiveDialog(open ? "password" : null)}
      />
      <ResetProgressDialog
        open={activeDialog === "reset"}
        onOpenChange={(open) => setActiveDialog(open ? "reset" : null)}
        onConfirm={handleResetProgress}
      />
      <DeleteAccountDialog
        user={user}
        open={activeDialog === "delete"}
        onOpenChange={(open) => setActiveDialog(open ? "delete" : null)}
      />
    </>
  );
}

interface DialogVisibilityProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ChangePasswordDialog({
  user,
  open,
  onOpenChange,
}: DialogVisibilityProps & { user: User }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setCurrentPassword("");
      setNewPassword("");
      setError(null);
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await changePassword(user, currentPassword, newPassword);
      toast.success("Password updated.");
      handleOpenChange(false);
    } catch (err) {
      setError(friendlyAuthError(err));
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              Update password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetProgressDialog({
  open,
  onOpenChange,
  onConfirm,
}: DialogVisibilityProps & { onConfirm: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset progress?</DialogTitle>
          <DialogDescription>
            This clears every topic&apos;s saved progress for your account. This can&apos;t be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton>
          <Button variant="destructive" onClick={onConfirm}>
            Reset progress
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteAccountDialog({ user, open, onOpenChange }: DialogVisibilityProps & { user: User }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setPassword("");
      setError(null);
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await deleteAccount(user, password);
      toast.success("Account deleted.");
      handleOpenChange(false);
    } catch (err) {
      setError(friendlyAuthError(err));
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete account</DialogTitle>
          <DialogDescription>
            This permanently deletes your account and your saved progress. This can&apos;t be
            undone. Enter your password to confirm.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="delete-account-password">Password</Label>
            <Input
              id="delete-account-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={submitting}>
              Delete account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
