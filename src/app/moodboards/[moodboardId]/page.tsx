import { notFound } from "next/navigation";
import { getMoodboardById } from "@/lib/moodboards";
import BoardCanvas from "@/components/moodboard/board-canvas";
import Link from "next/link";

interface PageProps {
  params: { moodboardId: string };
}

export default async function MoodboardDetailPage({ params }: PageProps) {
  const { moodboardId } = await params
  const board = await getMoodboardById(moodboardId);
  if (!board) return notFound();

  return (
    <div className="fixed inset-0">
      <BoardCanvas
        boardId={moodboardId}
        isPersonal={board.type !== "team"}
        teamId={board.type === "team" ? board.teamId ?? null : null}
      />
      {/* Overlay header */}
      <div className="pointer-events-none absolute left-4 top-16 z-10">
        <div className="rounded-xl bg-gradient-to-r from-white/95 via-white/90 to-slate-100/90 backdrop-blur-md border border-slate-200/80 shadow-xl px-4 py-3">
          <div className="text-[11px] text-slate-500">
            <Link href="/moodboards" className="hover:underline font-medium text-slate-600 pointer-events-auto">Moodboards</Link>
            <span className="mx-2 text-slate-400">/</span>
            <span className="font-medium text-slate-600">{board.name}</span>
          </div>
          <div className="text-sm font-semibold text-slate-900 mt-1">{board.name}</div>
          <div className="text-[11px] text-slate-500">
            {board.type === "team" ? (board.teamName ? `${board.teamName} team` : "Team") : "Personal"} • Updated {new Date(board.updatedAt).toLocaleString()}
          </div>
        </div>
      </div>
      {/* Overlay hint */}
      <div className="pointer-events-none absolute right-4 top-4 z-10">
        <div className="rounded-xl bg-gradient-to-r from-white/90 via-white/85 to-slate-100/85 backdrop-blur-md border border-slate-200/70 shadow-xl px-4 py-2 text-[11px] text-slate-600">
          Drag background to pan • Scroll to zoom • Drag notes
        </div>
      </div>
    </div>
  );
}
