import { ProfileMenu } from "@/components/profile-menu";
import { currentUserServer } from "@/lib/auth-server";
import { getUserProfile } from "@/lib/user";
import { sendAdminNotification } from "@/app/(actions)/admin";

export default async function AdminPage() {
  const me = await currentUserServer();
  const profile = me ? await getUserProfile(me.uid) : null;
  const isAdmin = profile?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-stone-950 text-white">
        <ProfileMenu />
        <div className="max-w-3xl mx-auto p-6">
          <h1 className="text-xl font-semibold mb-2">Admin</h1>
          <p className="text-stone-400">You must be an admin to view this page.</p>
        </div>
      </div>
    );
  }

  async function action(formData: FormData) {
    "use server";
    await sendAdminNotification(formData);
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      <ProfileMenu />
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

        <form action={action} className="space-y-4 bg-stone-900/50 border border-stone-700/50 rounded-lg p-4">
          <h2 className="text-lg font-semibold">Push Notification</h2>
          <div className="grid gap-2">
            <label className="text-sm text-stone-300">Title</label>
            <input name="title" required className="bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-stone-600" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-stone-300">Body</label>
            <textarea name="body" rows={3} className="bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-stone-600" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm text-stone-300">Type</label>
              <input name="type" defaultValue="system" className="bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-stone-600" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm text-stone-300">Level</label>
              <select name="level" defaultValue="info" className="bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-stone-600">
                <option value="info">info</option>
                <option value="success">success</option>
                <option value="warning">warning</option>
                <option value="error">error</option>
              </select>
            </div>
          </div>

          <fieldset className="grid gap-2">
            <legend className="text-sm text-stone-300">Recipients</legend>
            <div className="flex items-center gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="scope" value="userIds" defaultChecked /> Specific users
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="scope" value="all" /> Everyone (first 200 users)
              </label>
            </div>
            <textarea name="userIds" placeholder="UIDs separated by comma, space or newline" rows={3} className="bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-stone-600" />
          </fieldset>

          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 rounded bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white border-0">Send</button>
          </div>
        </form>
      </div>
    </div>
  );
}
