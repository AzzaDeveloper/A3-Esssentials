import { notFound } from "next/navigation";
import { getMoodboardById } from "@/lib/moodboards";
import BoardCanvas from "@/components/moodboard/board-canvas";
import Link from "next/link";

interface PageProps {
  params: { moodboardId: string };
}

export default async function MoodboardDetailPage({ params }: PageProps) {
  const id = params.moodboardId;
  const board = await getMoodboardById(id);
  if (!board) return notFound();

  return (
    <div className="fixed inset-0">
      <BoardCanvas boardId={id} />
      {/* Overlay header */}
      <div className="pointer-events-none absolute left-4 top-16 z-10">
        <div className="rounded-md bg-stone-900/70 backdrop-blur border border-stone-800 px-3 py-2">
          <div className="text-[11px] text-stone-400">
            <Link href="/moodboards" className="hover:underline pointer-events-auto">Moodboards</Link>
            <span className="mx-2">/</span>
            <span>{board.name}</span>
          </div>
          <div className="text-sm font-medium text-stone-100 mt-0.5">{board.name}</div>
          <div className="text-[11px] text-stone-500">
            {board.type === "team" ? (board.teamName ? `${board.teamName} team` : "Team") : "Personal"} • Updated {new Date(board.updatedAt).toLocaleString()}
          </div>
        </div>
      </div>
      {/* Overlay hint */}
      <div className="pointer-events-none absolute right-4 top-4 z-10">
        <div className="rounded-md bg-stone-900/70 backdrop-blur border border-stone-800 px-3 py-2 text-[11px] text-stone-300">
          Drag background to pan • Scroll to zoom • Drag notes
        </div>
      </div>
    </div>
  );
}
