import { currentUserServer } from "@/lib/auth-server";
import { listNotifications } from "@/lib/notifications";
import Link from "next/link";
import { ProfileMenu } from "@/components/profile-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function NotificationsPage() {
  const user = await currentUserServer();
  if (!user) {
    return (
      <div className="min-h-screen bg-stone-950 text-white">
        <ProfileMenu />
        <div className="max-w-2xl mx-auto p-6">
          <p className="text-stone-300">Please <Link href="/login" className="text-cyan-300 underline">sign in</Link> to view notifications.</p>
        </div>
      </div>
    );
  }
  const items = await listNotifications(user.uid, { limit: 50 });
  function levelBadge(level?: string) {
    if (!level) return null;
    const cls =
      level === "success"
        ? "bg-emerald-600/25 text-emerald-200 border-emerald-700/60"
        : level === "warning"
          ? "bg-amber-600/25 text-amber-200 border-amber-700/60"
          : level === "error"
            ? "bg-red-600/25 text-red-200 border-red-700/60"
            : "bg-stone-700/40 text-stone-200 border-stone-600/60"; // info/default
    return (
      <Badge variant="outline" className={cn("text-xs capitalize", cls)}>
        {level}
      </Badge>
    );
  }

  function levelBar(level?: string) {
    const cls =
      level === "success"
        ? "from-emerald-500 to-green-500"
        : level === "warning"
          ? "from-amber-500 to-orange-500"
          : level === "error"
            ? "from-rose-500 to-red-500"
            : "from-sky-500 to-cyan-500"; // info/default
    return <span className={cn("absolute left-0 top-0 h-full w-1.5 rounded-l-sm bg-gradient-to-b", cls)} />
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white relative overflow-hidden">
      {/* subtle gradient/backdrop to match profile menu */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-900/60 via-stone-950 to-stone-950" />
      <div className="absolute top-24 left-10 w-40 h-40 bg-stone-800/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-stone-700/25 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-1/3 w-28 h-28 bg-stone-600/20 rounded-full blur-2xl" />

      <ProfileMenu />
      <div className="relative z-10 max-w-2xl mx-auto p-6 space-y-4">
        <h1 className="text-xl font-semibold text-white">Notifications</h1>
        {items.length === 0 ? (
          <Card className="bg-stone-900/60 border-stone-700/50">
            <CardHeader>
              <CardTitle className="text-white">You're all caught up</CardTitle>
              <CardDescription className="text-stone-400">No notifications yet.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card className="bg-stone-900/60 border-stone-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white">Recent</CardTitle>
            </CardHeader>
            <Separator className="opacity-40" />
            <CardContent className="p-0">
              {items.map((n, i) => (
                <div key={n.id} className="relative p-4 overflow-hidden">
                  <div className="relative flex items-start justify-between gap-3 pl-3">
                    {levelBar(n.level)}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate text-white">{n.title}</p>
                        {levelBadge(n.level)}
                        {!n.readAt && (
                          <Badge className="text-xs bg-gradient-to-r from-pink-500 to-violet-500 text-white border-0">New</Badge>
                        )}
                      </div>
                      {n.body && <p className="text-stone-300 mt-1 text-sm">{n.body}</p>}
                      <p className="text-stone-500 text-xs mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  {i < items.length - 1 && <Separator className="my-2 opacity-20" />}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
