import { notFound, redirect } from "next/navigation";
import { currentUserServer } from "@/lib/auth-server";
import { firebaseAdmin } from "@/lib/firebase-admin";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
            <div className="flex flex-wrap gap-4">
              {memberProfiles.map((m) => (
                <div key={m.id} className="flex items-center gap-2 min-w-[12rem]">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={m.photoURL ?? undefined} alt={m.displayName} />
                    <AvatarFallback>{m.displayName.slice(0,1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <div className="text-foreground">{m.displayName}</div>
                    <div className="text-muted-foreground text-xs">{m.id === team.ownerId ? 'Owner' : 'Member'}</div>
                  </div>
                </div>
              ))}
              {team.memberCount > memberProfiles.length && (
                <div className="text-sm text-muted-foreground self-center">+{team.memberCount - memberProfiles.length} more…</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
