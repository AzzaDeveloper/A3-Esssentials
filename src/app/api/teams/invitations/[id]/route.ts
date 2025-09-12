import { NextRequest, NextResponse } from "next/server";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { firebaseAdmin } from "@/lib/firebase-admin";
import { currentUserServer } from "@/lib/auth-server";
import { getUserProfile } from "@/lib/user";
import type { UserRole } from "@/lib/types";
import { createNotification } from "@/lib/notifications";

function roleMaxTeams(role: UserRole | undefined): number | null {
  switch (role) {
    case "paid2":
      return 10;
    case "paid1":
      return 3;
    case "admin":
      return null; // unlimited
    case "user":
    default:
      return 1;
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  firebaseAdmin();
  const me = await currentUserServer();
  if (!me) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  const db = getFirestore();

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 }); }
  const action = String(body?.action || "").trim(); // "accept" | "decline"
  if (!["accept", "decline"].includes(action)) return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });

  const inviteRef = db.collection("team_invitations").doc(id);
  const inviteSnap = await inviteRef.get();
  if (!inviteSnap.exists) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  const invite = inviteSnap.data() as any;

  if (invite.inviteeId !== me.uid) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  if (invite.status !== "pending") return NextResponse.json({ ok: false, error: "not_pending" }, { status: 400 });

  const teamRef = db.collection("teams").doc(invite.teamId);
  const teamSnap = await teamRef.get();
  if (!teamSnap.exists) return NextResponse.json({ ok: false, error: "team_not_found" }, { status: 404 });
  const team = teamSnap.data() as any;

  if (action === "decline") {
    await inviteRef.set({ status: "declined" }, { merge: true });
    // Optional: notify inviter
    try {
    await createNotification(invite.inviterId, {
      type: "team_invite",
      title: `Invitation declined`,
      body: `An invitation to ${team.name || "your team"} was declined.`,
      level: "info",
      meta: { teamId: invite.teamId, invitationId: id, action: "decline" },
    });
    } catch {}
    return NextResponse.json({ ok: true, status: "declined" });
  }

  // accept
  // Check invitee's max teams based on role
  const profile = await getUserProfile(me.uid).catch(() => null);
  const maxTeams = roleMaxTeams(profile?.role as UserRole | undefined);
  if (typeof maxTeams === "number") {
    const currentTeams = await db
      .collection("teams")
      .where("members", "array-contains", me.uid)
      .limit(maxTeams + 1)
      .get();
    if (currentTeams.size >= maxTeams) {
      return NextResponse.json({ ok: false, error: "limit_reached" }, { status: 403 });
    }
  }

  const now = Timestamp.now();
  let joined = false;
  await db.runTransaction(async (trx) => {
    const tSnap = await trx.get(teamRef);
    if (!tSnap.exists) throw new Error("team_not_found");
    const t = tSnap.data() as any;
    const members: string[] = Array.isArray(t.members) ? t.members : [];
    if (!members.includes(me.uid)) {
      const nextMembers = Array.from(new Set([...members, me.uid]));
      trx.update(teamRef, { members: nextMembers, memberCount: nextMembers.length, updatedAt: now });
      joined = true;
    }
    trx.update(inviteRef, { status: "accepted" });
  });

  // Notify inviter and owner
  try {
    await createNotification(invite.inviterId, {
      type: "team_invite",
      title: `Invitation accepted`,
      body: `${profile?.displayName || "A user"} joined ${team.name || "your team"}`,
      level: "success",
      meta: { teamId: invite.teamId, invitationId: id, action: "accept" },
    });
    if (team.ownerId && team.ownerId !== invite.inviterId) {
      await createNotification(team.ownerId, {
        type: "team_member",
        title: `New team member`,
        body: `${profile?.displayName || "A user"} joined ${team.name || "your team"}`,
        level: "info",
        meta: { teamId: invite.teamId, invitationId: id },
      });
    }
  } catch {}

  return NextResponse.json({ ok: true, status: "accepted", joined });
}
