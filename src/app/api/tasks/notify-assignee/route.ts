import { NextRequest, NextResponse } from "next/server";
import { currentUserServer } from "@/lib/auth-server";
import { firebaseAdmin } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { createNotification } from "@/lib/notifications";

function sanitize(value: unknown, max = 120) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export async function POST(req: NextRequest) {
  const viewer = await currentUserServer();
  if (!viewer) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const assigneeId = sanitize(payload?.assigneeId);
  const taskTitle = sanitize(payload?.taskTitle, 160) || "New task";
  const boardId = sanitize(payload?.boardId, 80) || undefined;
  const taskId = sanitize(payload?.taskId, 160) || undefined;
  const teamId = sanitize(payload?.teamId, 120) || undefined;

  if (!assigneeId) {
    return NextResponse.json({ ok: false, error: "missing_assignee" }, { status: 400 });
  }

  if (assigneeId === viewer.uid) {
    return NextResponse.json({ ok: true, skipped: "self" });
  }

  let teamName: string | undefined;
  if (teamId) {
    try {
      const { app } = firebaseAdmin();
      const db = getFirestore(app);
      const teamSnap = await db.collection("teams").doc(teamId).get();
      if (!teamSnap.exists) {
        return NextResponse.json({ ok: false, error: "team_not_found" }, { status: 404 });
      }
      const data = teamSnap.data() as any;
      const members: string[] = Array.isArray(data?.members) ? data.members : [];
      if (!members.includes(viewer.uid) || !members.includes(assigneeId)) {
        return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
      }
      teamName = typeof data?.name === "string" ? data.name : undefined;
    } catch (error) {
      console.error("notify-assignee:team-check", error);
      return NextResponse.json({ ok: false, error: "team_check_failed" }, { status: 500 });
    }
  }

  try {
    const bodyParts: string[] = [];
    if (teamName) bodyParts.push(`Team: ${teamName}`);
    if (boardId) bodyParts.push(`Board: ${boardId}`);
    const body = bodyParts.length ? bodyParts.join(" • ") : undefined;

    await createNotification(assigneeId, {
      type: "task",
      title: `New task assigned: ${taskTitle}`,
      body,
      level: "info",
      meta: {
        boardId,
        taskId,
        createdBy: viewer.uid,
      },
    });
  } catch (error) {
    console.error("notify-assignee:createNotification", error);
    return NextResponse.json({ ok: false, error: "notify_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

