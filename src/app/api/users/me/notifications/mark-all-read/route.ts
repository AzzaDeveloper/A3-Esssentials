import { NextResponse } from "next/server";
import { currentUserServer } from "@/lib/auth-server";
import { markAllNotificationsRead } from "@/lib/notifications";

export async function POST() {
  const user = await currentUserServer();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  await markAllNotificationsRead(user.uid);
  return NextResponse.json({ ok: true });
}

