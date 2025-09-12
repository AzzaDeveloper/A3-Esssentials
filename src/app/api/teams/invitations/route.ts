import { NextResponse } from "next/server";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { firebaseAdmin } from "@/lib/firebase-admin";
import { currentUserServer } from "@/lib/auth-server";

export async function GET() {
  firebaseAdmin();
  const user = await currentUserServer();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const uid = user.uid;
  const db = getFirestore();

  const snap = await db
    .collection("team_invitations")
    .where("inviteeId", "==", uid)
    .where("status", "==", "pending")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  const items = snap.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id,
      teamId: x.teamId,
      inviteeId: x.inviteeId,
      inviterId: x.inviterId,
      status: x.status,
      createdAt: (x.createdAt as Timestamp)?.toDate().toISOString(),
    };
  });

  return NextResponse.json({ ok: true, items });
}

