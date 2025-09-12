import { NextResponse } from "next/server";
import { listMoodboards, createMoodboard } from "@/lib/moodboards";

export async function GET() {
  const items = await listMoodboards();
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  // Minimal validation
  const created = await createMoodboard({
    name: body?.name,
    type: body?.type === "team" ? "team" : "personal",
    ownerName: body?.ownerName,
    teamId: body?.teamId,
    teamName: body?.teamName,
    tags: Array.isArray(body?.tags) ? body.tags.slice(0, 8) : [],
    participants: Array.isArray(body?.participants) ? body.participants : [],
    previewUrls: Array.isArray(body?.previewUrls) ? body.previewUrls.slice(0, 8) : [],
  });
  return NextResponse.json({ ok: true, item: created });
}
