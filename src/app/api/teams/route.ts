import { NextResponse } from "next/server";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { firebaseAdmin } from "@/lib/firebase-admin";
import { currentUserServer } from "@/lib/auth-server";

const MAX_TEAMS_PER_USER = 10;

export async function GET() {
  firebaseAdmin();
  const user = await currentUserServer();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const uid = user.uid;
  const db = getFirestore();

  const snap = await db
    .collection("teams")
    .where("members", "array-contains", uid)
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  const items = snap.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id,
      name: x.name ?? "",
      description: x.description ?? "",
      ownerId: x.ownerId,
      members: x.members ?? [],
      memberCount: x.memberCount ?? (x.members?.length ?? 0),
      isPublic: x.isPublic ?? false,
      createdAt: (x.createdAt as Timestamp)?.toDate().toISOString(),
      updatedAt: (x.updatedAt as Timestamp)?.toDate().toISOString(),
    };
  });

  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  firebaseAdmin();
  const user = await currentUserServer();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const uid = user.uid;
  const db = getFirestore();

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  const description = String(body?.description ?? "").trim();

  if (!name) return NextResponse.json({ ok: false, error: "name_required" }, { status: 400 });
  if (name.length > 120) return NextResponse.json({ ok: false, error: "name_too_long" }, { status: 400 });
  if (description.length > 500) return NextResponse.json({ ok: false, error: "desc_too_long" }, { status: 400 });

  // enforce per-user team limit
  const currentTeams = await db
    .collection("teams")
    .where("members", "array-contains", uid)
    .limit(MAX_TEAMS_PER_USER + 1)
    .get();
  if (currentTeams.size >= MAX_TEAMS_PER_USER) {
    return NextResponse.json({ ok: false, error: "limit_reached" }, { status: 403 });
  }

  const now = Timestamp.now();
  const ref = await db.collection("teams").add({
    name,
    description,
    ownerId: uid,
    members: [uid],
    memberCount: 1,
    isPublic: false,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ ok: true, id: ref.id });
}

