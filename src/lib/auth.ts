import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { deleteCloudProgress } from "@/lib/cloudProgress";

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

// Firebase requires a recent sign-in before it allows sensitive changes
// (password updates, account deletion), so re-prove the password first.
async function reauthenticate(user: User, currentPassword: string): Promise<void> {
  const credential = EmailAuthProvider.credential(user.email ?? "", currentPassword);
  await reauthenticateWithCredential(user, credential);
}

export async function changePassword(
  user: User,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await reauthenticate(user, currentPassword);
  await updatePassword(user, newPassword);
}

export async function deleteAccount(user: User, currentPassword: string): Promise<void> {
  await reauthenticate(user, currentPassword);
  // Clean up cloud data while still authenticated — Firestore rules
  // reject the delete once the account below is gone.
  await deleteCloudProgress(user.uid).catch(() => {});
  await deleteUser(user);
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
