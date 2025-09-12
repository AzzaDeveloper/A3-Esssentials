import { NextResponse } from "next/server";
import { currentUserServer } from "@/lib/auth-server";
import { claimUserTag, normalizeTag, isValidTag } from "@/lib/user";

export async function POST(req: Request) {
  const user = await currentUserServer();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const rawTag = String(body?.tag || "");
  const tag = normalizeTag(rawTag);
  if (!isValidTag(tag)) {
    return NextResponse.json({ ok: false, error: "invalid_tag" }, { status: 400 });
  }

  try {
    const profile = await claimUserTag(user.uid, tag);
    return NextResponse.json({ ok: true, profile });
  } catch (e: any) {
    if (String(e?.message) === "tag_taken") {
      return NextResponse.json({ ok: false, error: "tag_taken" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "unknown" }, { status: 500 });
  }
}

