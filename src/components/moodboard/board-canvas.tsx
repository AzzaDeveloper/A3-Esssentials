"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type WheelEvent,
} from "react";
import { BoardTaskElement } from "@/components/moodboard/board-task-element";
import { Button } from "@/components/ui/button";
import { CreateTaskDialog, type ManualTaskFormState } from "@/components/tasks/create-task-dialog";
import { TaskEditorDialog } from "@/components/moodboard/task-editor-dialog";
import { firebase } from "@/lib/firebase";
import type { MoodboardElement, MoodboardTask } from "@/lib/types";
import {
  BOARD_TASK_DEFAULT_HEIGHT,
  BOARD_TASK_DEFAULT_WIDTH,
  BOARD_TASK_MAX_HEIGHT,
  BOARD_TASK_MAX_WIDTH,
  BOARD_TASK_MIN_HEIGHT,
  BOARD_TASK_MIN_WIDTH,
  createDefaultMoodboardTask,
} from "@/lib/moodboard-task";
import {
  normalizeDateInput,
  normalizeEnergy,
  normalizeManualMoods,
  normalizeManualTags,
  normalizeManualTeamMembers,
  normalizeOptionalDate,
  normalizePriority,
  normalizeUrgency,
} from "@/lib/moodboard-normalize";
import { onValue, push, ref, remove, serverTimestamp, set, update } from "firebase/database";

interface BoardCanvasProps {
  boardId: string;
  isPersonal?: boolean;
}

function toElementPosition(world: { x: number; y: number }) {
  return {
    x: Math.round(world.x - BOARD_TASK_DEFAULT_WIDTH / 2),
    y: Math.round(world.y - BOARD_TASK_DEFAULT_HEIGHT / 2),
  };
}

export function BoardCanvas({ boardId, isPersonal = false }: BoardCanvasProps) {
  const { rtdb } = firebase();
  const [elements, setElements] = useState<MoodboardElement[]>([]);
  const [isOffline, setIsOffline] = useState(false);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOriginRef = useRef({ x: 0, y: 0 });

  const dragIdRef = useRef<string | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const elemStartRef = useRef({ x: 0, y: 0 });
  const resizeIdRef = useRef<string | null>(null);
  const resizeStartRef = useRef({ x: 0, y: 0 });
  const sizeStartRef = useRef({ w: BOARD_TASK_DEFAULT_WIDTH, h: BOARD_TASK_DEFAULT_HEIGHT });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const elementsRef = ref(rtdb, `moodboards/${boardId}/elements`);
    const unsubscribe = onValue(
      elementsRef,
      (snapshot) => {
        const value = snapshot.val() as Record<string, any> | null;
        if (!value) {
          setElements([]);
          setIsOffline(false);
          return;
        }

        const nextElements: MoodboardElement[] = [];
        for (const [id, raw] of Object.entries(value)) {
          if (!raw || typeof raw !== "object" || raw.type !== "task" || !raw.task) {
            continue;
          }

          const xValue = Number((raw as any).x);
          const yValue = Number((raw as any).y);
          const widthValue = Number((raw as any).w);
          const heightValue = Number((raw as any).h);

          const normalizedWidth = Number.isFinite(widthValue) ? widthValue : BOARD_TASK_DEFAULT_WIDTH;
          const normalizedHeight = Number.isFinite(heightValue) ? heightValue : BOARD_TASK_DEFAULT_HEIGHT;

          const element: MoodboardElement = {
            id,
            type: "task",
            x: Number.isFinite(xValue) ? xValue : 0,
            y: Number.isFinite(yValue) ? yValue : 0,
            w: Math.min(BOARD_TASK_MAX_WIDTH, Math.max(BOARD_TASK_MIN_WIDTH, normalizedWidth)),
            h: Math.min(BOARD_TASK_MAX_HEIGHT, Math.max(BOARD_TASK_MIN_HEIGHT, normalizedHeight)),
            task: raw.task as MoodboardTask,
            color: typeof (raw as any).color === "string" ? (raw as any).color : undefined,
            createdAt: (raw as any).createdAt,
            updatedAt: (raw as any).updatedAt,
          };

          nextElements.push(element);
        }

        setElements(nextElements);
        setIsOffline(false);
      },
      (error) => {
        console.error("board-canvas:onValue", error);
        setIsOffline(true);
      },
    );

    return () => unsubscribe();
  }, [boardId, rtdb]);

  const resolveWorldPosition = useCallback(
    (center?: { x: number; y: number }) => {
      if (center) return center;
      if (typeof window === "undefined") return { x: 0, y: 0 };
      return {
        x: (-offset.x + window.innerWidth / 2) / scale,
        y: (-offset.y + window.innerHeight / 2) / scale,
      };
    },
    [offset.x, offset.y, scale],
  );

  const onWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      const delta = -event.deltaY;
      const zoomFactor = Math.exp(delta * 0.001);
      const previousScale = scale;
      const nextScale = Math.min(3, Math.max(0.25, previousScale * zoomFactor));
      if (nextScale === previousScale) return;

      const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
      const cx = event.clientX - rect.left;
      const cy = event.clientY - rect.top;
      const worldX = (cx - offset.x) / previousScale;
      const worldY = (cy - offset.y) / previousScale;

      setOffset({ x: cx - worldX * nextScale, y: cy - worldY * nextScale });
      setScale(nextScale);
    },
    [offset.x, offset.y, scale],
  );

  const onBackgroundPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).dataset.elid) return;
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      isPanningRef.current = true;
      panStartRef.current = { x: event.clientX, y: event.clientY };
      panOriginRef.current = { ...offset };
    },
    [offset],
  );

  const onBackgroundPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!isPanningRef.current) return;
    const dx = event.clientX - panStartRef.current.x;
    const dy = event.clientY - panStartRef.current.y;
    setOffset({ x: panOriginRef.current.x + dx, y: panOriginRef.current.y + dy });
  }, []);

  const onBackgroundPointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    isPanningRef.current = false;
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
  }, []);

  const startElementDrag = useCallback(
    (id: string, event: PointerEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      if (target.closest("button, a, input, textarea, select, [data-drag-stop]")) return;
      if (resizeIdRef.current) return;
      event.stopPropagation();
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      dragIdRef.current = id;
      dragStartRef.current = { x: event.clientX, y: event.clientY };
      const element = elements.find((entry) => entry.id === id);
      elemStartRef.current = { x: element?.x ?? 0, y: element?.y ?? 0 };
    },
    [elements],
  );

  const onElementPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (resizeIdRef.current) {
        const id = resizeIdRef.current;
        const dx = (event.clientX - resizeStartRef.current.x) / scale;
        const dy = (event.clientY - resizeStartRef.current.y) / scale;
        setElements((previous) =>
          previous.map((element) => {
            if (element.id !== id) return element;
            const baseWidth = sizeStartRef.current.w ?? BOARD_TASK_DEFAULT_WIDTH;
            const baseHeight = sizeStartRef.current.h ?? BOARD_TASK_DEFAULT_HEIGHT;
            const nextWidth = Math.round(
              Math.min(BOARD_TASK_MAX_WIDTH, Math.max(BOARD_TASK_MIN_WIDTH, baseWidth + dx)),
            );
            const nextHeight = Math.round(
              Math.min(BOARD_TASK_MAX_HEIGHT, Math.max(BOARD_TASK_MIN_HEIGHT, baseHeight + dy)),
            );
            return { ...element, w: nextWidth, h: nextHeight };
          }),
        );
        return;
      }

      const id = dragIdRef.current;
      if (!id) return;
      const dx = (event.clientX - dragStartRef.current.x) / scale;
      const dy = (event.clientY - dragStartRef.current.y) / scale;
      const nextX = Math.round(elemStartRef.current.x + dx);
      const nextY = Math.round(elemStartRef.current.y + dy);
      setElements((previous) =>
        previous.map((element) => (element.id === id ? { ...element, x: nextX, y: nextY } : element)),
      );
    },
    [scale],
  );

  const endElementDrag = useCallback(
    async (event: PointerEvent<HTMLDivElement>) => {
      const id = dragIdRef.current;
      if (!id) return;
      (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
      dragIdRef.current = null;
      const element = elements.find((entry) => entry.id === id);
      if (!element) return;
      try {
        await update(ref(rtdb, `moodboards/${boardId}/elements/${id}`), {
          x: element.x,
          y: element.y,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("board-canvas:endElementDrag", error);
      }
    },
    [boardId, elements, rtdb],
  );

  const startElementResize = useCallback(
    (id: string, event: PointerEvent<HTMLDivElement>) => {
      const element = elements.find((entry) => entry.id === id);
      if (!element) return;
      event.stopPropagation();
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      resizeIdRef.current = id;
      resizeStartRef.current = { x: event.clientX, y: event.clientY };
      sizeStartRef.current = {
        w: element.w ?? BOARD_TASK_DEFAULT_WIDTH,
        h: element.h ?? BOARD_TASK_DEFAULT_HEIGHT,
      };
    },
    [elements],
  );

  const endElementResize = useCallback(
    async (event: PointerEvent<HTMLDivElement>) => {
      const id = resizeIdRef.current;
      if (!id) return;
      (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
      resizeIdRef.current = null;
      const element = elements.find((entry) => entry.id === id);
      if (!element) return;
      try {
        await update(ref(rtdb, `moodboards/${boardId}/elements/${id}`), {
          w: element.w ?? BOARD_TASK_DEFAULT_WIDTH,
          h: element.h ?? BOARD_TASK_DEFAULT_HEIGHT,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("board-canvas:endElementResize", error);
      }
    },
    [boardId, elements, rtdb],
  );

  const addTask = useCallback(
    async (center?: { x: number; y: number }) => {
      const world = resolveWorldPosition(center);
      const position = toElementPosition(world);
      const elementsRef = ref(rtdb, `moodboards/${boardId}/elements`);
      const newRef = push(elementsRef);
      const elementId = newRef.key ?? `task-${Date.now()}`;
      const nowIso = new Date().toISOString();
      const task = createDefaultMoodboardTask(elementId, boardId, nowIso);
      const payload = {
        type: "task" as const,
        x: position.x,
        y: position.y,
        w: BOARD_TASK_DEFAULT_WIDTH,
        h: BOARD_TASK_DEFAULT_HEIGHT,
        task,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      try {
        await set(newRef, payload);
      } catch (error) {
        console.error("board-canvas:addTask", error);
      }
    },
    [boardId, resolveWorldPosition, rtdb],
  );

  const handleManualCreate = useCallback(
    async (draft: ManualTaskFormState) => {
      const world = resolveWorldPosition();
      const position = toElementPosition(world);
      const elementsRef = ref(rtdb, `moodboards/${boardId}/elements`);
      const newRef = push(elementsRef);
      const elementId = newRef.key ?? `task-${Date.now()}`;
      const nowIso = new Date().toISOString();
      const createdAtIso = normalizeDateInput(draft.createdAt, nowIso);
      const updatedAtIso = normalizeDateInput(draft.updatedAt, createdAtIso);
      const dueDateIso = normalizeOptionalDate(draft.dueDate);
      const task: MoodboardTask = {
        id: elementId,
        title: draft.title.trim() || "New task",
        description: draft.description.trim(),
        tags: normalizeManualTags(draft.tags),
        priority: normalizePriority(draft.priority),
        assigneeId: draft.assigneeId.trim() ? draft.assigneeId.trim() : null,
        ...(dueDateIso ? { dueDate: dueDateIso } : {}),
        moods: normalizeManualMoods(draft.moods),
        urgency: normalizeUrgency(draft.urgency),
        energy: normalizeEnergy(draft.energy),
        teamMembers: normalizeManualTeamMembers(draft.teamMembers),
        boardId,
        boardElementId: elementId,
        createdAt: createdAtIso,
        updatedAt: updatedAtIso,
      };

      const payload = {
        type: "task" as const,
        x: position.x,
        y: position.y,
        w: BOARD_TASK_DEFAULT_WIDTH,
        h: BOARD_TASK_DEFAULT_HEIGHT,
        task,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        await set(newRef, payload);
      } catch (error) {
        console.error("board-canvas:onManualCreate", error);
      }
    },
    [boardId, resolveWorldPosition, rtdb],
  );

  const removeElement = useCallback(
    (id: string) => {
      remove(ref(rtdb, `moodboards/${boardId}/elements/${id}`)).catch(() => {});
    },
    [boardId, rtdb],
  );

  const transformStyle = useMemo(() => ({
    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
    transformOrigin: "0 0",
  }), [offset.x, offset.y, scale]);

  const gridStyle = useMemo<CSSProperties>(() => {
    const cell = 40;
    return {
      backgroundImage:
        "linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px)," +
        "linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)",
      backgroundSize: `${cell}px ${cell}px, ${cell}px ${cell}px`,
      backgroundPosition: `${offset.x}px 0px, 0px ${offset.y}px`,
    } satisfies CSSProperties;
  }, [offset.x, offset.y]);

  const editingElement = useMemo(
    () => (editingId ? elements.find((entry) => entry.id === editingId) ?? null : null),
    [editingId, elements],
  );

  const handleTaskUpdate = useCallback(
    async (updatedTask: MoodboardTask) => {
      if (!editingId) return;
      setElements((previous) =>
        previous.map((element) =>
          element.id === editingId
            ? {
                ...element,
                task: updatedTask,
              }
            : element,
        ),
      );
      try {
        await update(ref(rtdb, `moodboards/${boardId}/elements/${editingId}`), {
          task: updatedTask,
          updatedAt: serverTimestamp(),
        });
        setEditingId(null);
      } catch (error) {
        console.error("board-canvas:handleTaskUpdate", error);
        throw error;
      }
    },
    [boardId, editingId, rtdb],
  );

  return (
    <>
      <div className="relative h-screen w-screen select-none overflow-hidden bg-white">
      <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
        <CreateTaskDialog
          triggerLabel="Add Task"
          triggerClassName="border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
          isPersonalBoard={isPersonal}
          onManualCreate={handleManualCreate}
        />
        <Button
          variant="outline"
          className="border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          onClick={() => addTask()}
        >
          Quick Drop
        </Button>
        <div className="rounded-md border border-slate-200 bg-white/90 px-2 py-1 text-xs font-medium text-slate-600 shadow-sm">
          {Math.round(scale * 100)}%
        </div>
      </div>

      {isOffline && (
        <div className="absolute left-3 top-14 z-30 max-w-sm rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 shadow-sm">
          Connection lost. Changes will sync once we reconnect.
        </div>
      )}

      <div
        className="absolute inset-0 z-10"
        onWheel={onWheel}
        onPointerDown={onBackgroundPointerDown}
        onPointerMove={onBackgroundPointerMove}
        onPointerUp={onBackgroundPointerUp}
      >
        <div className="absolute inset-0" style={gridStyle} />

        <div className="absolute left-0 top-0 will-change-transform" style={transformStyle}>
          {elements.map((element) => (
            <BoardTaskElement
              key={element.id}
              element={element}
              onPointerDown={(event) => startElementDrag(element.id, event)}
              onPointerMove={onElementPointerMove}
              onPointerUp={endElementDrag}
              onResizePointerDown={(event) => startElementResize(element.id, event)}
              onResizePointerMove={onElementPointerMove}
              onResizePointerUp={endElementResize}
              onEdit={() => setEditingId(element.id)}
              onRemove={() => removeElement(element.id)}
            />
          ))}

          {!elements.length && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-slate-400">
              Board is empty. Use "Add Task" or "Quick Drop" to place your first card.
            </div>
          )}
        </div>
      </div>

      </div>

      <TaskEditorDialog
        open={Boolean(editingId)}
        task={editingElement?.task ?? null}
        onOpenChange={(next) => {
          if (!next) {
            setEditingId(null);
          }
        }}
        onSubmit={handleTaskUpdate}
        isPersonalBoard={isPersonal}
      />
    </>
  );
}

export default BoardCanvas;
