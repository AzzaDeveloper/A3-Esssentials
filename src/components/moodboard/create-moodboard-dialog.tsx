"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateMoodboardDialogProps {
  triggerClassName?: string;
}

export function CreateMoodboardDialog({ triggerClassName }: CreateMoodboardDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tab, setTab] = useState<"personal" | "team">("personal");
  const [isPending, startTransition] = useTransition();
  const [teamName, setTeamName] = useState("");
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [teamId, setTeamId] = useState<string>("");
  const [loadingTeams, setLoadingTeams] = useState(false);

  function addTag(value: string) {
    const v = value.trim();
    if (!v) return;
    setTags((t) => Array.from(new Set([...t, v.toLowerCase()])).slice(0, 6));
  }

  async function onCreate() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/moodboards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description: desc,
            type: tab,
            teamId: tab === "team" ? teamId || undefined : undefined,
            teamName: tab === "team" ? (teams.find((t) => t.id === teamId)?.name || teamName || undefined) : undefined,
            tags,
          }),
        });
        const json = await res.json();
        if (json?.ok) {
          setOpen(false);
          setName("");
          setDesc("");
          setTags([]);
          setTeamName("");
          setTeamId("");
          // Best-effort refresh; on App Router, this triggers a re-render
          if (typeof window !== "undefined") window.location.reload();
        }
      } catch (e) {
        // silent fail for design-first flow
      }
    });
  }

  // Load teams when dialog opens on team tab
  useEffect(() => {
    if (!open || tab !== "team") return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingTeams(true);
        const res = await fetch("/api/teams", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!cancelled && json?.ok && Array.isArray(json.items)) {
          const opts = json.items.map((x: any) => ({ id: String(x.id), name: String(x.name || "Unnamed") }));
          setTeams(opts);
          if (!teamId && opts.length) setTeamId(opts[0].id);
        }
      } catch {}
      finally {
        if (!cancelled) setLoadingTeams(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, tab]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={triggerClassName}>New Moodboard</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a moodboard</DialogTitle>
          <DialogDescription>
            Design-only flow. Choose type and basic details.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
            <TabsList className=" w-full">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
            </TabsList>
            <TabsContent value="personal" className="mt-4 text-sm text-stone-400">
              Private to you by default. You can invite collaborators later.
            </TabsContent>
            <TabsContent value="team" className="mt-4 space-y-3">
              <div className="text-sm text-stone-400">
                Visible to your team. Choose a team and visibility later.
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label>Team</Label>
                {teams.length > 0 ? (
                  <Select value={teamId} onValueChange={(v) => setTeamId(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={loadingTeams ? "Loading teams…" : "Select a team"} />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="teamName"
                    placeholder={loadingTeams ? "Loading teams…" : "Type team name"}
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid gap-3">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., Q4 Campaign Moodboard"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              placeholder="What’s this board for?"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label>Add tags</Label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type a tag and press Enter"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <Badge
                  key={t}
                  className="cursor-pointer select-none bg-stone-800 hover:bg-stone-700"
                  onClick={() => setTags((all) => all.filter((x) => x !== t))}
                  title="Click to remove"
                >
                  {t}
                </Badge>
              ))}
              {!tags.length && (
                <span className="text-xs text-stone-500">No tags yet</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-stone-500">Create a board and start collecting vibes.</span>
            <Button onClick={onCreate} disabled={isPending || !name.trim()}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CreateMoodboardDialog;
