"use server";

import { getFirestore } from "firebase-admin/firestore";
import { firebaseAdmin } from "@/lib/firebase-admin";
import { currentUserServer } from "@/lib/auth-server";
import { createNotification } from "@/lib/notifications";
import { getUserProfile } from "@/lib/user";

export async function sendAdminNotification(formData: FormData) {
  const me = await currentUserServer();
  if (!me) return { ok: false, error: "unauthorized" } as const;
  const profile = await getUserProfile(me.uid);
  if (profile?.role !== "admin") return { ok: false, error: "forbidden" } as const;

  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim() || undefined;
  const scope = String(formData.get("scope") || "userIds"); // 'all' | 'userIds'
  const userIdsRaw = String(formData.get("userIds") || "");
  const type = String(formData.get("type") || "system");
  const level = (String(formData.get("level") || "info") as any);

  if (!title) return { ok: false, error: "missing_title" } as const;

  if (scope === "all") {
    const { app } = firebaseAdmin();
    const db = getFirestore(app);
    const snap = await db.collection("users").limit(200).get();
    const ids = snap.docs.map((d) => d.id);
    let created = 0;
    for (const uid of ids) {
      await createNotification(uid, { title, body, type, level });
      created += 1;
    }
    return { ok: true, created, scope: "all" } as const;
  }

  const userIds = userIdsRaw
    .split(/[,\n\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50); // cap to avoid abuse

  if (userIds.length === 0) return { ok: false, error: "no_recipients" } as const;

  let created = 0;
  for (const uid of userIds) {
    await createNotification(uid, { title, body, type, level });
    created += 1;
  }
  return { ok: true, created, scope: "userIds" } as const;
}

