"use client";

import type { MoodboardElement } from "@/lib/types";
import { BOARD_TASK_DEFAULT_HEIGHT, BOARD_TASK_DEFAULT_WIDTH } from "@/lib/moodboard-task";
import { TaskCard } from "@/components/task-card";
import { Pencil } from "lucide-react";

interface BoardTaskElementProps {
  element: MoodboardElement;
  onPointerDown: React.PointerEventHandler<HTMLDivElement>;
  onPointerMove: React.PointerEventHandler<HTMLDivElement>;
  onPointerUp: React.PointerEventHandler<HTMLDivElement>;
  onResizePointerDown: React.PointerEventHandler<HTMLDivElement>;
  onResizePointerMove: React.PointerEventHandler<HTMLDivElement>;
  onResizePointerUp: React.PointerEventHandler<HTMLDivElement>;
  onEdit: () => void;
  onRemove: () => void;
  zIndex?: number;
}

export function BoardTaskElement({
  element,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onResizePointerDown,
  onResizePointerMove,
  onResizePointerUp,
  onEdit,
  onRemove,
  zIndex,
}: BoardTaskElementProps) {
  return (
    <div
      data-elid={element.id}
      className="absolute pointer-events-auto cursor-grab active:cursor-grabbing"
      style={{
        left: element.x,
        top: element.y,
        width: element.w ?? BOARD_TASK_DEFAULT_WIDTH,
        height: element.h ?? BOARD_TASK_DEFAULT_HEIGHT,
        zIndex,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="relative h-full w-full">
        <div className="absolute -right-2 -top-3 z-10 flex items-center gap-1" data-drag-stop>
          <button
            className="rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-slate-700 shadow hover:bg-white"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            onPointerDown={(event) => event.stopPropagation()}
            aria-label="Edit task"
          >
            <span className="inline-flex items-center gap-1">
              <Pencil className="h-3 w-3" />
              Edit
            </span>
          </button>
          <button
            className="rounded-full bg-stone-900/80 px-2 py-1 text-xs text-stone-200 shadow hover:bg-stone-800"
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            onPointerDown={(event) => event.stopPropagation()}
            aria-label="Remove task"
          >
            ×
          </button>
        </div>
        <TaskCard task={element.task} />
        <div
          className="absolute -bottom-2 -right-2 z-10 h-4 w-4 cursor-se-resize rounded-full border border-white bg-slate-900/80 shadow touch-none"
          data-drag-stop
          onPointerDown={(event) => {
            event.stopPropagation();
            onResizePointerDown(event);
          }}
          onPointerMove={onResizePointerMove}
          onPointerUp={(event) => {
            event.stopPropagation();
            onResizePointerUp(event);
          }}
        >
          <span className="absolute inset-1 translate-x-[1px] translate-y-[1px] rotate-45 border-b border-r border-white/60" />
        </div>
      </div>
    </div>
  );
}
