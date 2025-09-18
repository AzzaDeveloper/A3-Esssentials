"use client";

import {
  type CSSProperties,
  type PointerEvent,
  type RefObject,
  type WheelEvent,
} from "react";
import { BoardTaskElement } from "@/components/moodboard/board-task-element";
import { BoardCursors } from "@/components/moodboard/board-cursors";
import type { MoodboardElement, TeamMemberContext } from "@/lib/types";

interface BoardInteractiveSurfaceProps {
  boardId: string;
  canvasRef: RefObject<HTMLDivElement | null>;
  gridStyle: CSSProperties;
  transformStyle: CSSProperties;
  renderedElements: MoodboardElement[];
  zIndices: Record<string, number>;
  offset: { x: number; y: number };
  scale: number;
  viewerId?: string | null;
  viewerName?: string | null;
  viewerTag?: string | null;
  teamMembers: TeamMemberContext[];
  isBoardEmpty: boolean;
  onWheel: (event: WheelEvent<HTMLDivElement>) => void;
  onBackgroundPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onBackgroundPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onBackgroundPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  onElementPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onElementPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  onResizePointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onResizePointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  onElementPointerDown: (id: string, event: PointerEvent<HTMLDivElement>) => void;
  onResizePointerDown: (id: string, event: PointerEvent<HTMLDivElement>) => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}

export function BoardInteractiveSurface({
  boardId,
  canvasRef,
  gridStyle,
  transformStyle,
  renderedElements,
  zIndices,
  offset,
  scale,
  viewerId,
  viewerName,
  viewerTag,
  teamMembers,
  isBoardEmpty,
  onWheel,
  onBackgroundPointerDown,
  onBackgroundPointerMove,
  onBackgroundPointerUp,
  onElementPointerMove,
  onElementPointerUp,
  onResizePointerMove,
  onResizePointerUp,
  onElementPointerDown,
  onResizePointerDown,
  onEdit,
  onRemove,
}: BoardInteractiveSurfaceProps) {
  return (
    <div
      className="absolute inset-0 z-10"
      onWheel={onWheel}
      onPointerDown={onBackgroundPointerDown}
      onPointerMove={onBackgroundPointerMove}
      onPointerUp={onBackgroundPointerUp}
      ref={canvasRef}
    >
      <BoardCursors
        boardId={boardId}
        containerRef={canvasRef}
        offset={offset}
        scale={scale}
        viewerId={viewerId}
        viewerName={viewerName}
        viewerTag={viewerTag}
        teamMembers={teamMembers}
      />

      <div className="absolute inset-0" style={gridStyle} />

      <div className="absolute left-0 top-0 will-change-transform" style={transformStyle}>
        {renderedElements.map((element) => (
          <BoardTaskElement
            key={element.id}
            element={element}
            onPointerDown={(event) => onElementPointerDown(element.id, event)}
            onPointerMove={onElementPointerMove}
            onPointerUp={onElementPointerUp}
            onResizePointerDown={(event) => onResizePointerDown(element.id, event)}
            onResizePointerMove={onResizePointerMove}
            onResizePointerUp={onResizePointerUp}
            onEdit={() => onEdit(element.id)}
            onRemove={() => onRemove(element.id)}
            zIndex={zIndices[element.id] ?? 0}
          />
        ))}

        {isBoardEmpty && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-slate-400">
            Board is empty. Use "Add Task" or "Quick Drop" to place your first card.
          </div>
        )}
      </div>
    </div>
  );
}

export default BoardInteractiveSurface;
