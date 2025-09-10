"use client";
import { firebase } from "@/lib/firebase";

export async function createServerSessionFromUser(remember = true) {
  const { auth } = firebase();
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");
  const idToken = await user.getIdToken(true);
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, remember }),
  });
  if (!res.ok) throw new Error("Failed to create server session");
  return true;
}

export async function clearServerSession() {
  const res = await fetch("/api/auth/logout", { method: "POST" });
  if (!res.ok) throw new Error("Failed to clear session");
  return true;
}

