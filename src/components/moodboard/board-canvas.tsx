"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BoardTaskElement } from "@/components/moodboard/board-task-element";
import { firebase } from "@/lib/firebase";
import type { MoodboardElement } from "@/lib/types";
import {
  BOARD_TASK_DEFAULT_HEIGHT,
  BOARD_TASK_DEFAULT_WIDTH,
  createDefaultMoodboardTask,
  moodboardElementComparator,
  normalizeElementSnapshot,
} from "@/lib/moodboard-task";
import {
  get,
  onValue,
  push,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
} from "firebase/database";
import { AlertTriangle } from "lucide-react";

interface BoardCanvasProps {
  boardId: string;
}

export function BoardCanvas({ boardId }: BoardCanvasProps) {
  const { rtdb } = firebase();
  const [elements, setElements] = useState<MoodboardElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [metaWarning, setMetaWarning] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Camera transform
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOriginRef = useRef({ x: 0, y: 0 });

  // Element drag
  const dragIdRef = useRef<string | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const elemStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const elementsRef = ref(rtdb, `moodboards/${boardId}/elements`);
    const unsubscribe = onValue(
      elementsRef,
      (snapshot) => {
        const value = snapshot.val() as Record<string, unknown> | null;
        const nextElements: MoodboardElement[] = [];
        const migrations: Promise<unknown>[] = [];

        if (value) {
        for (const [id, data] of Object.entries(value)) {
          const { element, requiresMigration, clearLegacyText } = normalizeElementSnapshot(boardId, id, data);
          nextElements.push(element);

          if (requiresMigration || clearLegacyText) {
            const elementRef = ref(rtdb, `moodboards/${boardId}/elements/${id}`);
            const payload: Record<string, unknown> = {
              type: "task",
              x: element.x,
              y: element.y,
              w: element.w ?? BOARD_TASK_DEFAULT_WIDTH,
              h: element.h ?? BOARD_TASK_DEFAULT_HEIGHT,
              task: element.task,
              updatedAt: serverTimestamp(),
            };

            if (typeof (data as any)?.color === "string") {
              payload.color = (data as any).color;
            }
            if (clearLegacyText && typeof (data as any)?.text !== "undefined") {
              payload.text = null;
            }

            migrations.push(update(elementRef, payload));
          }
        }
      }

      nextElements.sort(moodboardElementComparator);
      setElements(nextElements);
      setLoading(false);
      setConnectionError(null);

      if (migrations.length) {
        void Promise.allSettled(migrations);
      }
      },
      (error) => {
        console.error("board-canvas:onValue", error);
        setConnectionError("Realtime connection lost. Please refresh or check Firebase configuration.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [boardId, rtdb]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const metaSnap = await get(ref(rtdb, `moodboards/${boardId}/meta`));
        if (cancelled) return;
        if (!metaSnap.exists()) {
          setMetaWarning("Realtime sync for this moodboard isn't initialized. Tasks and notes may not persist.");
        } else {
          setMetaWarning(null);
        }
        setConnectionError((prev) => (prev && prev.startsWith("Unable to reach") ? null : prev));
      } catch (error) {
        if (cancelled) return;
        console.error("board-canvas:meta-check", error);
        setConnectionError("Unable to reach Firebase Realtime Database. Changes won't be saved.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [boardId, rtdb]);

  const onWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
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
  }, [offset.x, offset.y, scale]);

  const onBackgroundPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).dataset.elid) return;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    isPanningRef.current = true;
    panStartRef.current = { x: event.clientX, y: event.clientY };
    panOriginRef.current = { ...offset };
  }, [offset]);

  const onBackgroundPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanningRef.current) return;
    const dx = event.clientX - panStartRef.current.x;
    const dy = event.clientY - panStartRef.current.y;
    setOffset({ x: panOriginRef.current.x + dx, y: panOriginRef.current.y + dy });
  }, []);

  const onBackgroundPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    isPanningRef.current = false;
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
  }, []);

  const startElementDrag = useCallback((id: string, event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, [data-drag-stop]")) return;
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    dragIdRef.current = id;
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    const element = elements.find((entry) => entry.id === id);
    elemStartRef.current = { x: element?.x ?? 0, y: element?.y ?? 0 };
  }, [elements]);

  const onElementPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const id = dragIdRef.current;
    if (!id) return;
    const dx = (event.clientX - dragStartRef.current.x) / scale;
    const dy = (event.clientY - dragStartRef.current.y) / scale;
    setElements((previous) =>
      previous.map((element) =>
        element.id === id
          ? { ...element, x: Math.round(elemStartRef.current.x + dx), y: Math.round(elemStartRef.current.y + dy) }
          : element,
      ),
    );
  }, [scale]);

  const endElementDrag = useCallback(async (event: React.PointerEvent<HTMLDivElement>) => {
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
    } catch {}
  }, [boardId, elements, rtdb]);

  const addTask = useCallback(async (center?: { x: number; y: number }) => {
    const world = center ?? {
      x: (-offset.x + window.innerWidth / 2) / scale,
      y: (-offset.y + window.innerHeight / 2) / scale,
    };
    const elementsRef = ref(rtdb, `moodboards/${boardId}/elements`);
    const newRef = push(elementsRef);
    const elementId = newRef.key ?? `task-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const task = createDefaultMoodboardTask(elementId, boardId, nowIso);
    const payload = {
      type: "task" as const,
      x: Math.round(world.x - BOARD_TASK_DEFAULT_WIDTH / 2),
      y: Math.round(world.y - BOARD_TASK_DEFAULT_HEIGHT / 2),
      w: BOARD_TASK_DEFAULT_WIDTH,
      h: BOARD_TASK_DEFAULT_HEIGHT,
      task,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      await set(newRef, payload);
    } catch (error) {
      console.error('board-canvas:addTask', error);
    }
  }, [boardId, offset.x, offset.y, rtdb, scale]);

  const removeElement = useCallback((id: string) => {
    remove(ref(rtdb, `moodboards/${boardId}/elements/${id}`)).catch(() => {});
  }, [boardId, rtdb]);

  const transformStyle = useMemo(() => ({
    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
    transformOrigin: "0 0",
  }), [offset.x, offset.y, scale]);

  const gridStyle = useMemo<React.CSSProperties>(() => {
    const cell = 40;
    return {
      backgroundImage:
        "linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px)," +
        "linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)",
      backgroundSize: `${cell}px ${cell}px, ${cell}px ${cell}px`,
      backgroundPosition: `${offset.x}px 0px, 0px ${offset.y}px`,
    } as React.CSSProperties;
  }, [offset.x, offset.y]);

  return (
    <div className="relative w-screen h-screen bg-gray-500 overflow-hidden select-none">
      <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
        <button
          className="px-3 py-1.5 text-sm rounded-md bg-stone-800 text-stone-100 hover:bg-stone-700"
          onClick={() => addTask()}
        >
          Add Task
        </button>
        <div className="px-2 py-1 text-xs rounded bg-stone-900/80 text-stone-300 border border-stone-800">
          {Math.round(scale * 100)}%
        </div>
      </div>

      {(metaWarning || connectionError) && (
        <div className="absolute left-3 top-14 z-30 max-w-sm rounded-md border border-amber-400/40 bg-amber-900/80 px-3 py-2 text-xs text-amber-100 backdrop-blur">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{connectionError ?? metaWarning}</span>
          </div>
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
              onRemove={() => removeElement(element.id)}
            />
          ))}

          {!elements.length && !loading && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-stone-400 text-sm">
              Board is empty. Use "Add Task" to place your first card.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BoardCanvas;
