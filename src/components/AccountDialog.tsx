import { useState } from "react";
import { FirebaseError } from "firebase/app";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp } from "@/lib/auth";
import { firebaseConfigured } from "@/lib/firebase";

type Mode = "sign-up" | "log-in";

const ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "That email already has an account. Try logging in instead.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/user-not-found": "No account found with that email.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/invalid-email": "That doesn't look like a valid email address.",
};

function friendlyError(error: unknown): string {
  if (error instanceof FirebaseError) {
    return ERROR_MESSAGES[error.code] ?? "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

export function AccountDialog() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("sign-up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setEmail("");
    setPassword("");
    setError(null);
    setSubmitting(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) resetForm();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!firebaseConfigured) {
      setError("Account creation isn't configured yet for this app.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "sign-up") {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      handleOpenChange(false);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <span className="sm:hidden">Sign in</span>
        <span className="hidden sm:inline">Sign in to save progress</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "sign-up" ? "Create an account" : "Log in"}</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="account-email">Email</Label>
            <Input
              id="account-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="account-password">Password</Label>
            <Input
              id="account-password"
              type="password"
              autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMode(mode === "sign-up" ? "log-in" : "sign-up")}
            >
              {mode === "sign-up" ? "Have an account? Log in" : "Need an account? Sign up"}
            </Button>
            <Button type="submit" disabled={submitting}>
              {mode === "sign-up" ? "Sign up" : "Log in"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
