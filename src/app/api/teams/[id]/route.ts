import { NextRequest, NextResponse } from "next/server";
import { firebaseAdmin } from "@/lib/firebase-admin";
import { currentUserServer } from "@/lib/auth-server";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  firebaseAdmin();
  const me = await currentUserServer();
  if (!me) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  const db = getFirestore();
  const ref = db.collection("teams").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  const x = snap.data() as any;

  const members: string[] = Array.isArray(x.members) ? x.members : [];
  const isMember = members.includes(me.uid);
  const isPublic = !!x.isPublic;
  if (!isMember && !isPublic) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    team: {
      id: snap.id,
      name: x.name ?? "",
      description: x.description ?? "",
      ownerId: x.ownerId,
      members,
      memberCount: x.memberCount ?? members.length,
      isPublic,
      createdAt: (x.createdAt as Timestamp)?.toDate().toISOString(),
      updatedAt: (x.updatedAt as Timestamp)?.toDate().toISOString(),
      viewer: { id: me.uid, role: x.ownerId === me.uid ? "Owner" : (isMember ? "Member" : "Guest") },
    },
  });
}

