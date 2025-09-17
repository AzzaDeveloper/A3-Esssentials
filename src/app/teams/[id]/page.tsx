import { notFound, redirect } from "next/navigation";
import { currentUserServer } from "@/lib/auth-server";
import { firebaseAdmin } from "@/lib/firebase-admin";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamMembersGrid } from "@/components/team-members-grid";

type RoleMap = Record<string, string[]>;

function normalizeRoleMap(value: unknown): RoleMap {
  if (!value || typeof value !== "object") return {};
  const entries = Object.entries(value as Record<string, unknown>);
  const result: RoleMap = {};
  for (const [key, raw] of entries) {
    if (!key) continue;
    if (Array.isArray(raw)) {
      result[key] = raw.filter((v) => typeof v === "string" && v.trim().length > 0) as string[];
      continue;
    }
    if (typeof raw === "string") {
      result[key] = [raw];
    }
  }
  return result;
}

function toIso(v: any): string | undefined {
  if (!v) return undefined;
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v?.toDate === "function") return v.toDate().toISOString();
  if (typeof v === "string") return v;
  return undefined;
}

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await currentUserServer();
  if (!me) redirect("/login");

  const { app } = firebaseAdmin();
  const db = getFirestore(app);

  const ref = db.collection("teams").doc(id);
  const snap = await ref.get();
  if (!snap.exists) notFound();
  const x = snap.data() as any;
  const members: string[] = Array.isArray(x.members) ? x.members : [];
  const isMember = members.includes(me.uid);
  const isPublic = !!x.isPublic;
  if (!isMember && !isPublic) notFound();

  const roleMap = normalizeRoleMap(x.role);
  const teamRoleMap = normalizeRoleMap(x.teamRole);

  const team = {
    id: snap.id,
    name: x.name ?? "",
    description: x.description ?? "",
    ownerId: x.ownerId as string,
    members,
    memberCount: (x.memberCount as number) ?? members.length,
    isPublic,
    createdAt: toIso(x.createdAt) || new Date().toISOString(),
    updatedAt: toIso(x.updatedAt) || new Date().toISOString(),
  };

  // Load a small set of member profiles to display
  const memberProfiles = await Promise.all(
    members.slice(0, 12).map(async (uid) => {
      const u = await db.collection("users").doc(uid).get();
      const d = (u.data() as any) || {};
      return {
        id: uid,
        displayName: d.displayName || d.email?.split("@")[0] || "User",
        photoURL: d.photoURL || null,
        tag: (d.tag as string | null) ?? null,
        bio: (d.bio as string | null) ?? null,
        summary: (d.bio as string | null) ?? d.jobTitle ?? d.title ?? null,
        email: (d.email as string | null) ?? null,
        roles: roleMap[uid] ?? [],
        teamRoles: teamRoleMap[uid] ?? [],
      };
    })
  );

  const myRole = team.ownerId === me.uid ? "Owner" : (isMember ? "Member" : "Guest");

  return (
    <div className="min-h-screen bg-stone-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-stone-900/60 via-stone-950 to-stone-950" />
      <div className="relative mx-auto max-w-5xl px-6 py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{team.name}</h1>
          {team.description && <p className="text-muted-foreground">{team.description}</p>}
          <div className="text-sm text-muted-foreground">Members: {team.memberCount} • Your role: {myRole}</div>
        </div>

        <Card className="bg-stone-900/60 border-stone-700/50">
          <CardHeader>
            <CardTitle className="text-base">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <TeamMembersGrid
              teamId={team.id}
              members={memberProfiles}
              canManageRoles={team.ownerId === me.uid}
              viewerId={me.uid}
            />
            {team.memberCount > memberProfiles.length && (
              <div className="mt-4 text-sm text-muted-foreground">+{team.memberCount - memberProfiles.length} more…</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
