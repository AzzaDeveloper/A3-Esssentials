"use client";

import { Button } from "@/components/ui/button";
import {
  CreateTaskDialog,
  type ManualTaskFormState,
} from "@/components/tasks/create-task-dialog";
import Link from "next/link";
import type { TeamMemberContext } from "@/lib/types";

interface BoardCanvasControlsProps {
  isPersonalBoard: boolean;
  isTeamBoard: boolean;
  teamId?: string | null;
  hasRoster: boolean;
  scale: number;
  isOffline: boolean;
  teamMembers: TeamMemberContext[];
  onManualCreate: (draft: ManualTaskFormState) => Promise<void>;
  onQuickDrop: () => void;
  onOpenRoster: () => void;
}

export function BoardCanvasControls({
  isPersonalBoard,
  isTeamBoard,
  teamId = null,
  hasRoster,
  scale,
  isOffline,
  teamMembers,
  onManualCreate,
  onQuickDrop,
  onOpenRoster,
}: BoardCanvasControlsProps) {
  return (
    <>
      <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
        <CreateTaskDialog
          triggerLabel="Add Task"
          triggerClassName="border border-slate-300 bg-slate-900 text-white shadow-sm hover:bg-slate-800"
          isPersonalBoard={isPersonalBoard}
          onManualCreate={onManualCreate}
          teamMembers={teamMembers}
        />
        <Button
          variant="outline"
          className="border border-slate-300 bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-200"
          onClick={onQuickDrop}
        >
          Quick Drop
        </Button>
        {isTeamBoard && teamId ? (
          <Button
            variant="outline"
            className="border border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-100"
            asChild
          >
            <Link href={`/teams/${teamId}`}>View Team</Link>
          </Button>
        ) : null}
        <div className="rounded-md border border-slate-200 bg-white/90 px-2 py-1 text-xs font-medium text-slate-600 shadow-sm">
          {Math.round(scale * 100)}%
        </div>
      </div>

      {isTeamBoard ? (
        <div className="absolute right-3 top-16 z-30 flex items-center gap-2">
          <Button
            variant="outline"
            className="border border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-100"
            onClick={onOpenRoster}
            disabled={!hasRoster}
          >
            Team roster
          </Button>
        </div>
      ) : null}

      {isOffline && (
        <div className="absolute left-3 top-14 z-30 max-w-sm rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 shadow-sm">
          Connection lost. Changes will sync once we reconnect.
        </div>
      )}
    </>
  );
}

export default BoardCanvasControls;
