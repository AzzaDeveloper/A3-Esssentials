import { NextResponse } from "next/server";
import { currentUserServer } from "@/lib/auth-server";
import { getUserProfile } from "@/lib/user";
import { getFirestore } from "firebase-admin/firestore";
import { firebaseAdmin } from "@/lib/firebase-admin";
import { createNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  const me = await currentUserServer();
  if (!me) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const profile = await getUserProfile(me.uid);
  if (profile?.role !== "admin") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 }); }

  const title = body?.title as string | undefined;
  const text = body?.body as string | undefined;
  const type = (body?.type as string | undefined) || "system";
  const level = (body?.level as string | undefined) || "info";
  const action = body?.action as { label: string; href: string } | undefined;
  const meta = body?.meta as Record<string, any> | undefined;
  const userIds = (body?.userIds as string[] | undefined) || [];
  const all = !!body?.all;

  if (!title) return NextResponse.json({ ok: false, error: "missing_title" }, { status: 400 });

  let recipients: string[] = [];
  if (all) {
    const { app } = firebaseAdmin();
    const db = getFirestore(app);
    const snap = await db.collection("users").limit(200).get();
    recipients = snap.docs.map((d) => d.id);
  } else {
    recipients = Array.isArray(userIds) ? userIds.filter(Boolean).slice(0, 200) : [];
  }

  if (recipients.length === 0) return NextResponse.json({ ok: false, error: "no_recipients" }, { status: 400 });

  let created = 0;
  for (const uid of recipients) {
    await createNotification(uid, { title, body: text, type, level: level as any, action, meta });
    created += 1;
  }
  return NextResponse.json({ ok: true, created, recipients: created });
}
