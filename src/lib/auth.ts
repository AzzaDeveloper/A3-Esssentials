import { firebase } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  type User,
} from "firebase/auth";

export async function signInEmail(email: string, password: string) {
  const { auth } = firebase();
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpEmail(
  email: string,
  password: string,
  displayName?: string,
) {
  const { auth } = firebase();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }
  return cred;
}

export async function signOutUser() {
  const { auth } = firebase();
  return signOut(auth);
}

export function currentUser(): User | null {
  const { auth } = firebase();
  return auth.currentUser;
}

export async function signInWithGooglePopup() {
  const { auth } = firebase();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopup(auth, provider);
}

export async function signInWithGoogleRedirect() {
  const { auth } = firebase();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithRedirect(auth, provider);
}
