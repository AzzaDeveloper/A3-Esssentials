import { NextResponse } from "next/server";
import { currentUserServer } from "@/lib/auth-server";
import { markNotificationRead } from "@/lib/notifications";

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const user = await currentUserServer();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { id } = params;
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

  await markNotificationRead(user.uid, id);
  return NextResponse.json({ ok: true });
}

