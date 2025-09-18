"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Moodboard } from "@/lib/types";
import { MoodboardCard } from "@/components/moodboard/moodboard-card";
import { firebase } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

type TabKey = "all" | "personal" | "team" | "recent";

interface MoodboardsViewProps {
  boards: Moodboard[];
  createDialog?: React.ReactNode;
}

export function MoodboardsView({ boards, createDialog }: MoodboardsViewProps) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Moodboard[]>(boards);
  const [participantsByBoard, setParticipantsByBoard] = useState<Record<string, Moodboard["participants"]>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setItems(boards);
  }, [boards]);

  // Load team participants for team moodboards to drive avatar images
  useEffect(() => {
    const teamBoards = items.filter((b) => b.type === "team" && b.teamId);
    if (!teamBoards.length) return;
    const { db } = firebase();

    const run = async () => {
      await Promise.all(
        teamBoards.map(async (b) => {
          if (!b.teamId || participantsByBoard[b.id]) return;
          try {
            const teamSnap = await getDoc(doc(db, "teams", b.teamId));
            const tdata: any = teamSnap.exists() ? teamSnap.data() : null;
            const memberIds: string[] = Array.isArray(tdata?.members) ? tdata.members.slice(0, 4) : [];
            if (memberIds.length === 0) return;
            const rows: NonNullable<Moodboard["participants"]> = [];
            await Promise.all(
              memberIds.map(async (uid) => {
                try {
                  const uSnap = await getDoc(doc(db, "users", uid));
                  const u: any = uSnap.exists() ? uSnap.data() : {};
                  rows.push({ id: uid, name: String(u.displayName || u.email || "User"), avatarUrl: (u.photoURL as string | null) ?? null });
                } catch {}
              }),
            );
            if (rows.length) {
              setParticipantsByBoard((prev) => ({ ...prev, [b.id]: rows }));
            }
          } catch {}
        }),
      );
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let list = items;
    if (tab === "personal") list = list.filter((b) => b.type === "personal");
    if (tab === "team") list = list.filter((b) => b.type === "team");
    if (tab === "recent") list = list.filter((b) => new Date(b.updatedAt).getTime() >= weekAgo);
    if (q) {
      list = list.filter((b) => {
        const hay = [b.name, b.teamName, b.ownerName, ...(b.tags ?? [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [items, tab, query]);

  const handleDelete = useCallback(
    async (board: Moodboard) => {
      if (typeof window !== "undefined") {
        const confirmed = window.confirm(`Delete the moodboard "${board.name}"? This cannot be undone.`);
        if (!confirmed) return;
      }

      setDeletingId(board.id);
      try {
        const res = await fetch(`/api/moodboards/${board.id}`, { method: "DELETE" });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.error || "Failed to delete moodboard");
        }
        setItems((previous) => previous.filter((item) => item.id !== board.id));
        setParticipantsByBoard((previous) => {
          const next = { ...previous };
          delete next[board.id];
          return next;
        });
        router.refresh();
      } catch (error) {
        console.error("delete moodboard", error);
        if (typeof window !== "undefined") {
          window.alert("Unable to delete the moodboard. Please try again.");
        }
      } finally {
        setDeletingId(null);
      }
    },
    [router],
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full md:w-auto">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2 w-full md:max-w-sm">
          <Input
            placeholder="Search moodboards..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search moodboards"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
        {filtered.map((b) => (
          <Link key={b.id} href={`/moodboards/${b.id}`} className="no-underline">
            <MoodboardCard
              board={{ ...b, participants: participantsByBoard[b.id] ?? b.participants }}
              onDelete={() => handleDelete(b)}
              deleting={deletingId === b.id}
            />
          </Link>
        ))}
        {createDialog && (
          <div className="rounded-lg border border-dashed border-stone-800 bg-stone-950/30 p-6 flex flex-col items-center justify-center text-center hover:border-stone-700 transition-colors">
            <div className="text-stone-300 font-medium mb-2">Create a new moodboard</div>
            <p className="text-sm text-stone-500 mb-4">Start from a blank board or a template.</p>
            {createDialog}
          </div>
        )}
      </div>

      {!filtered.length && (
        <div className="text-sm text-stone-500 mt-6">No moodboards match your filters.</div>
      )}
    </div>
  );
}

export default MoodboardsView;
