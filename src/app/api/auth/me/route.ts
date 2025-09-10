import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { firebaseAdmin } from "@/lib/firebase-admin";

export async function GET() {
  const jar = await cookies();
  const session = jar.get("session")?.value;
  if (!session) return NextResponse.json({ ok: true, user: null });
  try {
    const { adminAuth } = firebaseAdmin();
    const decoded = await adminAuth.verifySessionCookie(session, true);
    return NextResponse.json({ ok: true, user: decoded });
  } catch {
    return NextResponse.json({ ok: true, user: null });
  }
}

