import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { firebaseAdmin } from "@/lib/firebase-admin";

export async function POST() {
  const jar = await cookies();
  const session = jar.get("session")?.value;
  try {
    if (session) {
      const { adminAuth } = firebaseAdmin();
      const decoded = await adminAuth.verifySessionCookie(session, true).catch(() => null);
      if (decoded) {
        await adminAuth.revokeRefreshTokens(decoded.uid);
      }
    }
  } catch {
    // ignore
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", "", { path: "/", maxAge: 0 });
  return res;
}

