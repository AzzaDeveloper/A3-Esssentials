import { NextRequest, NextResponse } from "next/server";
import { currentUserServer } from "@/lib/auth-server";
import { markNotificationRead } from "@/lib/notifications";

export async function PATCH(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await currentUserServer();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

  await markNotificationRead(user.uid, id);
  return NextResponse.json({ ok: true });
}

