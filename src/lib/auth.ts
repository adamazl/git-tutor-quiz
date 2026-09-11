import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export async function signUp(email: string, password: string): Promise<User> {
  if (!auth) throw new Error("Account creation isn't configured yet for this app.");
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signIn(email: string, password: string): Promise<User> {
  if (!auth) throw new Error("Account creation isn't configured yet for this app.");
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signOutUser(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(auth));

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, loading };
}
