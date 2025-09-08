"use client";
import { useEffect, useState } from "react";
import { firebase } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

export function useAuth() {
  const { auth } = firebase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, [auth]);

  return { user, loading };
}

