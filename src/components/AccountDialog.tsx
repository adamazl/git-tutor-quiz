import { useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp } from "@/lib/auth";
import { friendlyAuthError } from "@/lib/authErrors";
import { firebaseConfigured } from "@/lib/firebase";

type Mode = "sign-up" | "log-in";

const COPY: Record<Mode, { title: string; description: string; submit: string }> = {
  "sign-up": {
    title: "Create your account",
    description: "Save your quiz progress and pick up where you left off on any device.",
    submit: "Sign up",
  },
  "log-in": {
    title: "Welcome back",
    description: "Log in to load your saved progress.",
    submit: "Log in",
  },
};

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

  function handleModeChange(nextMode: Mode) {
    if (nextMode === mode) return;
    setMode(nextMode);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
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
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const copy = COPY[mode];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <span className="sm:hidden">Sign in</span>
        <span className="hidden sm:inline">Sign in to save progress</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <div
          role="tablist"
          aria-label="Account mode"
          className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "sign-up"}
            onClick={() => handleModeChange("sign-up")}
            className={`rounded-md py-1.5 text-sm font-medium transition-colors ${
              mode === "sign-up"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign up
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "log-in"}
            onClick={() => handleModeChange("log-in")}
            className={`rounded-md py-1.5 text-sm font-medium transition-colors ${
              mode === "log-in"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Log in
          </button>
        </div>
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
            <Button type="submit" disabled={submitting} className="w-full">
              {copy.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
