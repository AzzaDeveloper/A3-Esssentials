import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { firebaseAdmin } from "@/lib/firebase-admin";
import type { UserNotification } from "@/lib/types";

export type NewNotification = Omit<UserNotification, "id" | "createdAt" | "readAt"> & {
  readAt?: string | null;
};

function nowIso() {
  return new Date().toISOString();
}

function toIso(v: any): string | undefined {
  if (!v) return undefined;
  if (typeof v?.toDate === "function") return v.toDate().toISOString();
  if (typeof v === "string") return v;
  return undefined;
}

const collectionRef = (db: FirebaseFirestore.Firestore, uid: string) => db.collection("users").doc(uid).collection("notifications");

export async function createNotification(uid: string, input: NewNotification): Promise<UserNotification> {
  const { app } = firebaseAdmin();
  const db = getFirestore(app);
  const col = collectionRef(db, uid);
  const createdAt = Timestamp.now();
  const doc = col.doc();
  await doc.set({
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    level: input.level ?? "info",
    action: input.action ?? null,
    meta: input.meta ?? null,
    createdAt,
    readAt: input.readAt ? Timestamp.fromDate(new Date(input.readAt)) : null,
  });

  return {
    id: doc.id,
    type: input.type,
    title: input.title,
    body: input.body,
    level: input.level ?? "info",
    action: input.action,
    meta: input.meta ?? undefined,
    createdAt: nowIso(),
    readAt: input.readAt ?? null,
  };
}

export async function listNotifications(uid: string, opts?: { limit?: number; unreadOnly?: boolean }) {
  const { app } = firebaseAdmin();
  const db = getFirestore(app);
  let q = collectionRef(db, uid).orderBy("createdAt", "desc");
  if (opts?.unreadOnly) {
    q = q.where("readAt", "==", null);
  }
  if (opts?.limit) q = q.limit(opts.limit);
  const snap = await q.get();
  const items: UserNotification[] = snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      type: data.type,
      title: data.title,
      body: data.body ?? undefined,
      level: data.level ?? "info",
      action: data.action ?? undefined,
      meta: data.meta ?? undefined,
      createdAt: toIso(data.createdAt) || nowIso(),
      readAt: toIso(data.readAt) ?? null,
    };
  });
  return items;
}

export async function markNotificationRead(uid: string, id: string) {
  const { app } = firebaseAdmin();
  const db = getFirestore(app);
  const ref = collectionRef(db, uid).doc(id);
  await ref.set({ readAt: Timestamp.now() }, { merge: true });
}

export async function markAllNotificationsRead(uid: string) {
  const { app } = firebaseAdmin();
  const db = getFirestore(app);
  const col = collectionRef(db, uid);
  const snap = await col.where("readAt", "==", null).get();
  const batch = db.batch();
  snap.forEach((doc) => {
    batch.set(doc.ref, { readAt: Timestamp.now() }, { merge: true });
  });
  await batch.commit();
}
