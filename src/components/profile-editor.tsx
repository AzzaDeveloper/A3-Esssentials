"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { UserProfile } from "@/lib/types";

type Props = {
  profile: UserProfile;
  suggestedTag?: string | null;
};

export default function ProfileEditor({ profile, suggestedTag }: Props) {
  const [displayName, setDisplayName] = useState(profile.displayName || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [photoURL, setPhotoURL] = useState(profile.photoURL || "");
  const [tag, setTag] = useState(profile.tag || "");
  const [claiming, startClaim] = useTransition();
  const [saving, startSave] = useTransition();
  const [message, setMessage] = useState<string>("");

  async function saveProfile() {
    setMessage("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio, photoURL: photoURL || null }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setMessage("Profile saved");
    } catch {
      setMessage("Failed to save profile");
    }
  }

  async function claimTag() {
    setMessage("");
    const raw = tag || suggestedTag || "";
    if (!raw) { setMessage("Enter a tag to claim"); return; }
    try {
      const res = await fetch("/api/users/me/tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: raw }),
      });
      if (res.status === 409) { setMessage("Tag is taken"); return; }
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setTag(json?.profile?.tag || raw);
      setMessage("Tag claimed");
    } catch {
      setMessage("Failed to claim tag");
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <Label htmlFor="displayName">Display Name</Label>
          <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={5} />
        </div>
        <div>
          <Label htmlFor="photo">Photo URL</Label>
          <Input id="photo" value={photoURL || ""} onChange={(e) => setPhotoURL(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <div>
              <Label htmlFor="tag">Public Tag</Label>
              <Input
                id="tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder={suggestedTag || "your-tag"}
              />
            </div>
            <Button
              type="button"
              onClick={() => startClaim(claimTag)}
              disabled={claiming}
            >
              {claiming ? "Claiming…" : (profile.tag ? "Update Tag" : "Claim Tag")}
            </Button>
          </div>
          <p className="text-xs text-stone-400">Your public URL will be /user/&lt;tag&gt;.</p>
        </div>
      </section>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={() => startSave(saveProfile)} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
        {message ? <span className="text-sm text-stone-300">{message}</span> : null}
      </div>
    </div>
  );
}

