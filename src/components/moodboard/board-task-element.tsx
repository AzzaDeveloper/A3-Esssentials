"use client";

import type { MoodboardElement } from "@/lib/types";
import { BOARD_TASK_DEFAULT_WIDTH } from "@/lib/moodboard-task";
import { TaskCard } from "@/components/task-card";

interface BoardTaskElementProps {
  element: MoodboardElement;
  onPointerDown: React.PointerEventHandler<HTMLDivElement>;
  onPointerMove: React.PointerEventHandler<HTMLDivElement>;
  onPointerUp: React.PointerEventHandler<HTMLDivElement>;
  onRemove: () => void;
}

export function BoardTaskElement({
  element,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onRemove,
}: BoardTaskElementProps) {
  return (
    <div
      data-elid={element.id}
      className="absolute pointer-events-auto cursor-grab active:cursor-grabbing"
      style={{
        left: element.x,
        top: element.y,
        width: element.w ?? BOARD_TASK_DEFAULT_WIDTH,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="absolute -right-2 -top-3 z-20" data-drag-stop>
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
    </div>
  );
}
