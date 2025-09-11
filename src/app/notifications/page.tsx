import { currentUserServer } from "@/lib/auth-server";
import { listNotifications } from "@/lib/notifications";
import Link from "next/link";
import { ProfileMenu } from "@/components/profile-menu";

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
  return (
    <div className="min-h-screen bg-stone-950 text-white">
      <ProfileMenu />
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <h1 className="text-white text-xl font-semibold">Notifications</h1>
        {items.length === 0 && (
          <p className="text-stone-400">No notifications yet.</p>
        )}
        <div className="space-y-3">
          {items.map((n) => (
            <div key={n.id} className="p-4 rounded-md bg-stone-900/70 border border-stone-700/50">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-medium">{n.title}</p>
                  {n.body && <p className="text-stone-300 mt-1">{n.body}</p>}
                  <p className="text-stone-500 text-xs mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {n.readAt && <span className="text-stone-500 text-xs">Read</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
