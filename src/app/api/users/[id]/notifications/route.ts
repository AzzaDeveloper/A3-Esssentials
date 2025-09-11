import { NextResponse } from "next/server";
import { currentUserServer } from "@/lib/auth-server";
import { createNotification } from "@/lib/notifications";
import { getUserProfile } from "@/lib/user";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await currentUserServer();
  if (!me) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const targetUid = params.id;
  if (!targetUid) return NextResponse.json({ ok: false, error: "missing_user" }, { status: 400 });

  // Allow users to notify themselves; others require admin role
  if (me.uid !== targetUid) {
    const myProfile = await getUserProfile(me.uid);
    if (myProfile?.role !== "admin") {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 }); }

  const title = body?.title as string | undefined;
  const text = body?.body as string | undefined;
  const type = (body?.type as string | undefined) || "system";
  const level = (body?.level as string | undefined) || "info";
  const action = body?.action as { label: string; href: string } | undefined;
  const meta = body?.meta as Record<string, any> | undefined;

  if (!title || typeof title !== "string") {
    return NextResponse.json({ ok: false, error: "missing_title" }, { status: 400 });
  }

  const created = await createNotification(targetUid, {
    type,
    title,
    body: text,
    level: level as any,
    action,
    meta,
  });

  return NextResponse.json({ ok: true, notification: created });
}

