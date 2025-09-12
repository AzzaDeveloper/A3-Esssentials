import { NextResponse } from "next/server";
import { listMoodboardsForUser, createMoodboardForUser } from "@/lib/moodboards";
import { currentUserServer } from "@/lib/auth-server";
import { getFirestore } from "firebase-admin/firestore";
import { firebaseAdmin } from "@/lib/firebase-admin";

export async function GET() {
  const me = await currentUserServer();
  if (!me) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const items = await listMoodboardsForUser(me.uid);
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  const me = await currentUserServer();
  if (!me) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const type = body?.type === "team" ? "team" : "personal";

  // If team board, verify membership before creation
  if (type === "team") {
    const teamId = String(body?.teamId || "").trim();
    if (!teamId) return NextResponse.json({ ok: false, error: "team_required" }, { status: 400 });
    try {
      firebaseAdmin();
      const db = getFirestore();
      const teamDoc = await db.collection("teams").doc(teamId).get();
      if (!teamDoc.exists) return NextResponse.json({ ok: false, error: "team_not_found" }, { status: 404 });
      const members: string[] = teamDoc.data()?.members ?? [];
      if (!members.includes(me.uid)) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    } catch {}
  }

  const created = await createMoodboardForUser(me.uid, {
    name: body?.name,
    type,
    ownerName: body?.ownerName,
    teamId: body?.teamId,
    teamName: body?.teamName,
    tags: Array.isArray(body?.tags) ? body.tags.slice(0, 8) : [],
    participants: Array.isArray(body?.participants) ? body.participants : [],
    previewUrls: Array.isArray(body?.previewUrls) ? body.previewUrls.slice(0, 8) : [],
  });
  return NextResponse.json({ ok: true, item: created });
}
