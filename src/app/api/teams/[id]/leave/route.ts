import { NextRequest, NextResponse } from "next/server";
import { firebaseAdmin } from "@/lib/firebase-admin";
import { currentUserServer } from "@/lib/auth-server";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  firebaseAdmin();
  const me = await currentUserServer();
  if (!me) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

  const db = getFirestore();
  const teamRef = db.collection("teams").doc(id);
  const teamSnap = await teamRef.get();
  if (!teamSnap.exists) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  const team = teamSnap.data() as any;
  const members: string[] = Array.isArray(team.members) ? team.members : [];
  if (!members.includes(me.uid)) return NextResponse.json({ ok: false, error: "not_member" }, { status: 400 });

  const isOwner = team.ownerId === me.uid;
  if (isOwner && members.length > 1) {
    return NextResponse.json({ ok: false, error: "owner_cannot_leave_with_members" }, { status: 400 });
  }

  const now = Timestamp.now();
  if (isOwner && members.length === 1) {
    // Sole owner + only member: delete team
    await teamRef.delete();
    return NextResponse.json({ ok: true, deleted: true });
  }

  const nextMembers = members.filter((m) => m !== me.uid);
  await teamRef.set({ members: nextMembers, memberCount: nextMembers.length, updatedAt: now }, { merge: true });
  return NextResponse.json({ ok: true, left: true });
}

