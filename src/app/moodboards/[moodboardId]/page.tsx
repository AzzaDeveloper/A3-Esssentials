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
    <div className="px-4 md:px-8 lg:px-12 py-6 md:py-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="text-xs text-stone-500">
            <Link href="/moodboards" className="hover:underline">Moodboards</Link>
            <span className="mx-2">/</span>
            <span>{board.name}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold mt-1">{board.name}</h1>
          <p className="text-sm text-stone-400 mt-1">
            {board.type === "team" ? (board.teamName ? `${board.teamName} team` : "Team") : "Personal"} • Updated {new Date(board.updatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-400">
          <span>Drag background to pan • Scroll to zoom • Drag notes</span>
        </div>
      </div>

      <div className="mt-4">
        <BoardCanvas boardId={id} />
      </div>
    </div>
  );
}

