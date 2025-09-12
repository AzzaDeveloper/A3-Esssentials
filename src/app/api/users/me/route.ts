import { NextResponse } from "next/server";
import { currentUserServer } from "@/lib/auth-server";
import { getUserProfile, upsertUserProfile } from "@/lib/user";
import { suggestTagFrom } from "@/lib/tag";
import type { UserProfile } from "@/lib/types";

export async function GET() {
  const user = await currentUserServer();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const profile = await getUserProfile(user.uid);
  // Provide a suggestion for users missing a tag (no mutation here)
  const suggestedTag = !profile?.tag ? suggestTagFrom(profile?.displayName, profile?.email) : undefined;
  return NextResponse.json({ ok: true, profile, suggestedTag });
}

export async function PATCH(req: Request) {
  const user = await currentUserServer();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as Partial<UserProfile>;

  // Whitelist minimal fields (profile + theme prefs + notifications)
  const patch: any = {};
  if (typeof body.displayName === "string") patch.displayName = body.displayName;
  if (typeof body.bio === "string") patch.bio = body.bio;
  if (typeof body.photoURL !== "undefined") patch.photoURL = body.photoURL;
  if (body.preferences && typeof body.preferences.theme === "string") {
    patch.preferences = { theme: body.preferences.theme };
  }
  // notification preferences removed; this route no longer updates them
  if (body.notificationState) {
    patch.notificationState = {};
    if (typeof body.notificationState.unreadCount === "number") patch.notificationState.unreadCount = body.notificationState.unreadCount;
    if (typeof body.notificationState.lastReadAt !== "undefined") patch.notificationState.lastReadAt = body.notificationState.lastReadAt;
  }

  const updated = await upsertUserProfile(user.uid, patch);
  return NextResponse.json({ ok: true, profile: updated });
}
