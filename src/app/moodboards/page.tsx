import { Moodboard } from "@/lib/types";
import { CreateMoodboardDialog } from "@/components/moodboard/create-moodboard-dialog";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { listMoodboards } from "@/lib/moodboards";
import { MoodboardsView } from "@/components/moodboard/moodboards-view";


export default async function MoodboardsPage() {
  const boards: Moodboard[] = await listMoodboards();
  return (
    <div className="px-4 md:px-8 lg:px-12 py-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Moodboards</h1>
          <p className="text-sm text-stone-400 mt-1">
            View and manage personal and team moodboards.
          </p>
        </div>
        <CreateMoodboardDialog triggerClassName="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600" />
      </div>

      <Separator className="my-6" />

      <MoodboardsView boards={boards} createDialog={<CreateMoodboardDialog />} />
    </div>
  );
}
