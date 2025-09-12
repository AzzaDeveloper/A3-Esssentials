import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import ProfileEditor from "@/components/profile-editor";
import { currentUserServer } from "@/lib/auth-server";
import { getUserProfile, suggestTagFrom } from "@/lib/user";
import { SiteNav } from "@/components/site-nav";
import { ProfileMenu } from "@/components/profile-menu";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ProfileSettingsPage() {
  const user = await currentUserServer();
  if (!user) redirect("/login");

  const profile = await getUserProfile(user.uid);
  if (!profile) redirect("/login");

  const suggested = !profile.tag ? suggestTagFrom(profile.displayName, profile.email) : null;

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      <SiteNav />
      <ProfileMenu />
      {/* Spacer so content is not under the floating taskbar/profile buttons */}
      <div className="container mx-auto px-4 pt-40 md:pt-48 pb-10">
        <Card className="bg-stone-900/70 border-stone-800">
          <CardHeader className="has-[data-slot=card-action]:grid grid-cols-[1fr_auto] items-start">
            <div>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription className="text-stone-400">Update your public information and tag</CardDescription>
            </div>
            <CardAction>
              <Button asChild variant="outline">
                <Link href={`/user/${profile.tag || profile.id}`}>Back to Profile</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ProfileEditor profile={profile} suggestedTag={suggested} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
