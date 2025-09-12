import { NextResponse } from "next/server";
import { firebaseAdmin } from "@/lib/firebase-admin";
import { getUserProfile } from "@/lib/user";

export async function POST(req: Request) {
  try {
    const { idToken, remember } = await req.json();
    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 400 });
    }

    const { adminAuth } = firebaseAdmin();
    const expiresIn = Math.min(
      // 14 days max
      14 * 24 * 60 * 60 * 1000,
      (remember ? 7 : 1) * 24 * 60 * 60 * 1000,
    );
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Ensure a user profile exists for this UID on login
    try {
      const decoded = await adminAuth.verifyIdToken(idToken, true).catch(() => null);
      if (decoded?.uid) {
        await getUserProfile(decoded.uid);
      }
    } catch (e) {
      // Non-fatal: profile bootstrap should not block session creation
      console.warn("Profile bootstrap failed", e);
    }

    const res = NextResponse.json({ ok: true });
    const isProd = process.env.NODE_ENV === "production";
    res.cookies.set("session", sessionCookie, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(expiresIn / 1000),
    });
    return res;
  } catch (e) {
    console.error("Error in /api/auth/session:", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

export async function GET() {
  // Simple status check
  return NextResponse.json({ ok: true });
}

