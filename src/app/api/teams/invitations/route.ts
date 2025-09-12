import { NextResponse } from "next/server";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { firebaseAdmin } from "@/lib/firebase-admin";
import { currentUserServer } from "@/lib/auth-server";
import { createNotification } from "@/lib/notifications";
import { getUserProfile } from "@/lib/user";

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

// Create an invitation (member -> invitee). Also sends a notification to invitee.
export async function POST(req: Request) {
  firebaseAdmin();
  const me = await currentUserServer();
  if (!me) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getFirestore();

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 }); }
  const teamId = String(body?.teamId || "").trim();
  const inviteeId = String(body?.inviteeId || "").trim();
  if (!teamId || !inviteeId) return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  if (inviteeId === me.uid) return NextResponse.json({ ok: false, error: "cannot_invite_self" }, { status: 400 });

  // Validate inviter is a team member
  const teamRef = db.collection("teams").doc(teamId);
  const teamSnap = await teamRef.get();
  if (!teamSnap.exists) return NextResponse.json({ ok: false, error: "team_not_found" }, { status: 404 });
  const team = teamSnap.data() as any;
  const members: string[] = Array.isArray(team.members) ? team.members : [];
  if (!members.includes(me.uid)) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  // If already a member, no need to invite
  if (members.includes(inviteeId)) return NextResponse.json({ ok: false, error: "already_member" }, { status: 409 });

  // Check for existing pending invite
  const existing = await db
    .collection("team_invitations")
    .where("teamId", "==", teamId)
    .where("inviteeId", "==", inviteeId)
    .where("status", "==", "pending")
    .limit(1)
    .get();
  if (!existing.empty) {
    const doc = existing.docs[0];
    return NextResponse.json({ ok: true, id: doc.id, status: "already_invited" });
  }

  const now = Timestamp.now();
  const inviteRef = await db.collection("team_invitations").add({
    teamId,
    inviteeId,
    inviterId: me.uid,
    status: "pending",
    createdAt: now,
  });

  // Send notification to invitee
  try {
    const inviter = await getUserProfile(me.uid).catch(() => null);
    const title = `Team invitation: ${team.name || "A team"}`;
    const bodyText = inviter?.displayName ? `${inviter.displayName} invited you to join ${team.name || "a team"}` : `You were invited to join ${team.name || "a team"}`;
    await createNotification(inviteeId, {
      type: "team_invite",
      title,
      body: bodyText,
      level: "info",
      action: { label: "Review", href: "/teams" },
      meta: { teamId, invitationId: inviteRef.id },
    });
  } catch (e) {
    // Non-fatal: invitation still created
    console.warn("Failed to send invite notification", e);
  }

  return NextResponse.json({ ok: true, id: inviteRef.id });
}

