"use client";

import { useEffect, useMemo, useState } from "react";
import { firebase } from "@/lib/firebase";
import { collection, limit as qlimit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import type { UserNotification } from "@/lib/types";

function toIso(v: any): string | undefined {
  if (!v) return undefined;
  // Firestore Timestamp has toDate
  if (typeof (v as any)?.toDate === "function") return (v as any).toDate().toISOString();
  if (typeof v === "string") return v;
  return undefined;
}

export function useUnreadNotifications(uid?: string | null) {
  const [hasUnread, setHasUnread] = useState(false);
  useEffect(() => {
    if (!uid) return;
    const { db } = firebase();
    const q = query(
      collection(db, "users", uid, "notifications"),
      where("readAt", "==", null),
      qlimit(1)
    );
    const unsub = onSnapshot(q, (snap) => {
      setHasUnread(!snap.empty);
    });
    return () => unsub();
  }, [uid]);
  return hasUnread;
}

export function useNotifications(uid?: string | null, take = 10, enabled = true) {
  const [items, setItems] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!uid || !enabled) return;
    const { db } = firebase();
    const q = query(
      collection(db, "users", uid, "notifications"),
      orderBy("createdAt", "desc"),
      qlimit(take)
    );
    setLoading(true);
    const unsub = onSnapshot(q, (snap) => {
      const next: UserNotification[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          type: data.type,
          title: data.title,
          body: data.body ?? undefined,
          level: data.level ?? "info",
          action: data.action ?? undefined,
          meta: data.meta ?? undefined,
          createdAt: toIso(data.createdAt) || new Date().toISOString(),
          readAt: toIso(data.readAt) ?? null,
        };
      });
      setItems(next);
      setLoading(false);
    });
    return () => unsub();
  }, [uid, take, enabled]);
  return { items, loading } as const;
}

