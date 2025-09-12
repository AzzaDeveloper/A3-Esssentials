import { NextResponse } from "next/server";
import { currentUserServer } from "@/lib/auth-server";
import { listNotifications } from "@/lib/notifications";

export async function GET(req: Request) {
  const user = await currentUserServer();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") || 20);
  const unreadOnly = searchParams.get("unreadOnly") === "true" || searchParams.get("unread") === "true";

  const items = await listNotifications(user.uid, { limit, unreadOnly });
  return NextResponse.json({ ok: true, items });
}

