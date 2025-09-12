import { notFound, redirect } from "next/navigation";
import { firebaseAdmin } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import type { UserProfile } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { currentUserServer } from "@/lib/auth-server";
import { SiteNav } from "@/components/site-nav";
import { ProfileMenu } from "@/components/profile-menu";

type PageProps = {
  params: Promise<{ username: string }> | { username: string };
};

function toInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
  return (first + last).toUpperCase();
}

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

type MatchKind = "tag" | "id" | "displayName";

async function findProfileByUsernameOrUid(username: string): Promise<{ profile: UserProfile; matched: MatchKind } | null> {
  const { app } = firebaseAdmin();
  const db = getFirestore(app);

  // 1) Prefer explicit tag field if present
  try {
    const handleSnap = await db
      .collection("users")
      .where("tag", "==", username)
      .limit(1)
      .get();
    if (!handleSnap.empty) {
      const doc = handleSnap.docs[0];
      const data = doc.data() as any;
      return { profile: normalizeProfile(doc.id, data), matched: "tag" };
    }
  } catch {}

  // 2) Try direct doc id (uid)
  try {
    const byId = await db.collection("users").doc(username).get();
    if (byId.exists) {
      return { profile: normalizeProfile(byId.id, byId.data()), matched: "id" };
    }
  } catch {}

  // 3) Fallback: exact displayName match
  try {
    const nameSnap = await db
      .collection("users")
      .where("displayName", "==", username)
      .limit(1)
      .get();
    if (!nameSnap.empty) {
      const doc = nameSnap.docs[0];
      const data = doc.data() as any;
      return { profile: normalizeProfile(doc.id, data), matched: "displayName" };
    }
  } catch {}

  return null;
}

function tsToIso(v: any): string | undefined {
  // Accept Firestore Timestamp or ISO/string
  if (!v) return undefined;
  try {
    if (typeof v?.toDate === "function") return v.toDate().toISOString();
    if (typeof v === "string") return v;
  } catch {}
  return undefined;
}

function normalizeProfile(id: string, data: any): UserProfile {
  return {
    id,
    email: data?.email ?? "",
    displayName: data?.displayName ?? "",
    photoURL: data?.photoURL ?? null,
    bio: data?.bio ?? "",
    preferences: { theme: data?.preferences?.theme ?? "system" },
    notificationState: {
      unreadCount: data?.notificationState?.unreadCount ?? 0,
      lastReadAt: tsToIso(data?.notificationState?.lastReadAt) ?? null,
    },
    role: (data?.role as any) ?? "user",
    createdAt: tsToIso(data?.createdAt) || new Date().toISOString(),
    updatedAt: tsToIso(data?.updatedAt) || new Date().toISOString(),
    schemaVersion: (data?.schemaVersion as number) ?? 1,
  };
}

export async function generateMetadata(props: PageProps) {
  const params = await props.params;
  const username = params.username;
  let title = `@${username} • Profile`;
  try {
    const found = await findProfileByUsernameOrUid(username);
    if (found?.profile?.displayName) title = `${found.profile.displayName} (@${username})`;
  } catch {}
  return { title };
}

export default async function UserProfilePage(props: PageProps) {
  const params = await props.params;
  const username = params.username;
  const found = await findProfileByUsernameOrUid(username);
  if (!found) return notFound();

  const { profile, matched } = found;

  // If accessed via uid or displayName, redirect to canonical /user/<tag>
  if (matched !== "tag" && profile.tag) {
    redirect(`/user/${profile.tag}`);
  }

  const joined = formatDate(profile.createdAt);
  const viewer = await currentUserServer();
  const canEdit = viewer?.uid === profile.id;

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      <SiteNav />
      <ProfileMenu />
      <div className="h-40 w-full bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 border-b border-stone-800" />
      <div className="container mx-auto px-4 -mt-12">
        <Card className="bg-stone-900/60 border-stone-800">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-20 border border-stone-800">
                {profile.photoURL ? (
                  <AvatarImage src={profile.photoURL} alt={profile.displayName || username} />
                ) : null}
                <AvatarFallback className="text-lg">
                  {toInitials(profile.displayName || username)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">
                  {profile.displayName || username}
                </CardTitle>
                <CardDescription className="text-stone-400">@{profile.tag || username}</CardDescription>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary" className="bg-stone-800 border-stone-700 text-stone-200">
                    {profile.role}
                  </Badge>
                  {joined ? (
                    <span className="text-stone-400 text-sm">Joined {joined}</span>
                  ) : null}
                </div>
              </div>
            </div>
            {canEdit ? (
              <CardAction>
                <Link href="/profile" className="text-sm text-stone-300 hover:text-white underline">Edit Profile</Link>
              </CardAction>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-[2fr_1fr]">
            <div>
              <h2 className="text-sm font-semibold text-stone-300 mb-2">About</h2>
              <p className="text-stone-200 leading-relaxed whitespace-pre-wrap min-h-10">
                {profile.bio || "No bio yet."}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-stone-300 mb-2">Stats</h3>
                <div className="text-stone-300 text-sm">Public profile • Read-only</div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-stone-300 mb-2">Links</h3>
                <div className="text-stone-400 text-sm">More coming soon</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
