import { cookies } from "next/headers";
import { firebaseAdmin } from "@/lib/firebase-admin";

export async function verifySessionCookie(sessionCookie: string, checkRevocation = true) {
  const { adminAuth } = firebaseAdmin();
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, checkRevocation);
    return decoded;
  } catch {
    return null;
  }
}

export async function currentUserServer() {
  const jar = await cookies();
  const session = jar.get("session")?.value;
  if (!session) return null;
  return verifySessionCookie(session, true);
}

