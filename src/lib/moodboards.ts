import { firebaseAdmin } from "@/lib/firebase-admin";
import type { Moodboard } from "@/lib/types";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const COLLECTION = "moodboards" as const;

function sampleBoards(): Moodboard[] {
  const now = new Date();
  return [
    {
      id: "mb1",
      name: "Q4 Campaign",
      type: "team",
      ownerName: "Alex",
      teamName: "Marketing",
      tags: ["campaign", "warm", "retro"],
      updatedAt: new Date(now.getTime() - 36 * 3600_000).toISOString(),
      coverUrl: null,
      facets: { focus: 0.2, energy: 0.6, social: 0.1, calm: -0.1 },
      participants: [
        { id: "u1", name: "Alex", avatarUrl: "/avatars/1.png" },
        { id: "u2", name: "Sam", avatarUrl: "/avatars/2.png" },
        { id: "u3", name: "Riley", avatarUrl: "/avatars/3.png" },
      ],
      previewUrls: [
        "https://picsum.photos/seed/q4a/64",
        "https://picsum.photos/seed/q4b/64",
        "https://picsum.photos/seed/q4c/64",
        "https://picsum.photos/seed/q4d/64",
      ],
    },
    {
      id: "mb2",
      name: "Design Inspirations",
      type: "personal",
      ownerName: "You",
      tags: ["inspo", "ui", "motion"],
      updatedAt: new Date(now.getTime() - 6 * 3600_000).toISOString(),
      coverUrl: null,
      facets: { focus: 0.5, energy: 0.1, social: -0.2, calm: 0.3 },
      participants: [
        { id: "u0", name: "You", avatarUrl: "/avatars/you.png" },
      ],
      previewUrls: [
        "https://picsum.photos/seed/inspo1/64",
        "https://picsum.photos/seed/inspo2/64",
        "https://picsum.photos/seed/inspo3/64",
      ],
    },
    {
      id: "mb3",
      name: "Team Offsite Vibes",
      type: "team",
      ownerName: "Riley",
      teamName: "People Ops",
      tags: ["nature", "calm", "blue"],
      updatedAt: new Date(now.getTime() - 5 * 24 * 3600_000).toISOString(),
      coverUrl: null,
      facets: { focus: -0.1, energy: 0.3, social: 0.7, calm: 0.4 },
      participants: [
        { id: "u3", name: "Riley", avatarUrl: "/avatars/3.png" },
        { id: "u4", name: "Pat", avatarUrl: "/avatars/4.png" },
      ],
      previewUrls: [
        "https://picsum.photos/seed/off1/64",
        "https://picsum.photos/seed/off2/64",
      ],
    },
  ];
}

function toIso(v: any): string | undefined {
  if (!v) return undefined;
  if (typeof v?.toDate === "function") return v.toDate().toISOString();
  if (typeof v === "string") return v;
  return undefined;
}

export async function listMoodboards(): Promise<Moodboard[]> {
  try {
    const { app } = firebaseAdmin();
    const db = getFirestore(app);
    const qs = await db
      .collection(COLLECTION)
      .orderBy("updatedAt", "desc")
      .limit(50)
      .get();
    return qs.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        name: data.name,
        type: data.type,
        ownerName: data.ownerName,
        teamId: data.teamId ?? undefined,
        teamName: data.teamName ?? undefined,
        tags: data.tags ?? [],
        updatedAt: toIso(data.updatedAt) || new Date().toISOString(),
        coverUrl: data.coverUrl ?? null,
        facets: data.facets ?? {},
        participants: data.participants ?? [],
        previewUrls: data.previewUrls ?? [],
      } satisfies Moodboard;
    });
  } catch (e) {
    // Fallback to static samples if admin not configured
    return sampleBoards();
  }
}

export async function getMoodboardById(id: string): Promise<Moodboard | null> {
  if (!id) return null;
  try {
    const { app } = firebaseAdmin();
    const db = getFirestore(app);
    const ref = db.collection(COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;
    const data = snap.data() as any;
    return {
      id: snap.id,
      name: data.name,
      type: data.type,
      ownerName: data.ownerName,
      teamId: data.teamId ?? undefined,
      teamName: data.teamName ?? undefined,
      tags: data.tags ?? [],
      updatedAt: toIso(data.updatedAt) || new Date().toISOString(),
      coverUrl: data.coverUrl ?? null,
      facets: data.facets ?? {},
      participants: data.participants ?? [],
      previewUrls: data.previewUrls ?? [],
    } satisfies Moodboard;
  } catch (e) {
    // Fallback: search in sample boards by id
    const found = sampleBoards().find((b) => b.id === id);
    return found ?? null;
  }
}

export async function createMoodboard(input: Partial<Moodboard>): Promise<Moodboard> {
  const now = Timestamp.now();
  const base = {
    name: input.name ?? "Untitled Board",
    type: input.type ?? "personal",
    ownerName: input.ownerName ?? "You",
    teamId: input.teamId ?? null,
    teamName: input.teamName ?? null,
    tags: input.tags ?? [],
    updatedAt: now,
    coverUrl: input.coverUrl ?? null,
    facets: input.facets ?? {},
    participants: input.participants ?? [],
    previewUrls: input.previewUrls ?? [],
  };

  try {
    const { app } = firebaseAdmin();
    const db = getFirestore(app);
    const ref = await db.collection(COLLECTION).add(base);
    return {
      id: ref.id,
      name: base.name,
      type: base.type,
      ownerName: base.ownerName,
      teamId: base.teamId ?? undefined,
      teamName: base.teamName ?? undefined,
      tags: base.tags,
      updatedAt: new Date().toISOString(),
      coverUrl: base.coverUrl,
      facets: base.facets,
      participants: base.participants,
      previewUrls: base.previewUrls,
    } as unknown as Moodboard;
  } catch (e) {
    // In fallback mode, just return a fake id (not persisted)
    return {
      id: `local_${Math.random().toString(36).slice(2, 8)}`,
      name: base.name,
      type: base.type,
      ownerName: base.ownerName,
      teamId: base.teamId ?? undefined,
      teamName: base.teamName ?? undefined,
      tags: base.tags,
      updatedAt: new Date().toISOString(),
      coverUrl: base.coverUrl,
      facets: base.facets,
      participants: base.participants,
      previewUrls: base.previewUrls,
    } as Moodboard;
  }
}
