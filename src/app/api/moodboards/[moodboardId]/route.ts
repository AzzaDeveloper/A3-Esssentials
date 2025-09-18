import { NextResponse, type NextRequest } from "next/server";
import { currentUserServer } from "@/lib/auth-server";
import { deleteMoodboardForUser } from "@/lib/moodboards";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ moodboardId: string }> },
) {
  const me = await currentUserServer();
  if (!me) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { moodboardId: boardId } = await context.params;
  if (!boardId) {
    return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  }

  const result = await deleteMoodboardForUser(me.uid, boardId);

  if (result === "not_found") {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  if (result === "forbidden") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
