"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { firebase } from "@/lib/firebase";
import {
  ref,
  onValue,
  push,
  update,
  remove,
  serverTimestamp,
} from "firebase/database";

export interface BoardElement {
  id: string;
  type: "note"; // placeholder type until task cards later
  x: number; // world coords (px)
  y: number; // world coords (px)
  w?: number;
  h?: number;
  text?: string;
  color?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface BoardCanvasProps {
  boardId: string;
}

export function BoardCanvas({ boardId }: BoardCanvasProps) {
  const { rtdb } = firebase();
  const [elements, setElements] = useState<BoardElement[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Live subscribe to elements (Realtime Database)
  useEffect(() => {
    const elementsRef = ref(rtdb, `moodboards/${boardId}/elements`);
    const unsub = onValue(elementsRef, (snapshot) => {
      const val = snapshot.val() as Record<string, any> | null;
      const rows: BoardElement[] = val
        ? Object.entries(val).map(([id, data]) => ({
            id,
            type: (data?.type as any) || "note",
            x: Number(data?.x ?? 0),
            y: Number(data?.y ?? 0),
            w: Number(data?.w ?? 160),
            h: Number(data?.h ?? 120),
            text: String(data?.text ?? ""),
            color: String(data?.color ?? "#fde68a"),
            createdAt: data?.createdAt,
            updatedAt: data?.updatedAt,
          }))
        : [];
      // sort by createdAt if available
      rows.sort((a, b) => {
        const av = typeof a.createdAt === "number" ? a.createdAt : 0;
        const bv = typeof b.createdAt === "number" ? b.createdAt : 0;
        return av - bv;
      });
      setElements(rows);
      setLoading(false);
    });
    return () => unsub();
  }, [rtdb, boardId]);

  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    // Zoom towards cursor position for nicer UX
    const delta = -e.deltaY;
    const zoomFactor = Math.exp(delta * 0.001);
    const prevScale = scale;
    const nextScale = Math.min(3, Math.max(0.25, prevScale * zoomFactor));
    if (nextScale === prevScale) return;

    // Adjust offset so the point under cursor stays in place
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const worldX = (cx - offset.x) / prevScale;
    const worldY = (cy - offset.y) / prevScale;

    const newOffsetX = cx - worldX * nextScale;
    const newOffsetY = cy - worldY * nextScale;
    setOffset({ x: newOffsetX, y: newOffsetY });
    setScale(nextScale);
  }, [scale, offset.x, offset.y]);

  const onBackgroundPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).dataset.elid) return; // element drag handled elsewhere
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isPanningRef.current = true;
    panStartRef.current = { x: e.clientX, y: e.clientY };
    panOriginRef.current = { ...offset };
  }, [offset]);

  const onBackgroundPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanningRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    setOffset({ x: panOriginRef.current.x + dx, y: panOriginRef.current.y + dy });
  }, []);

  const onBackgroundPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isPanningRef.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, []);

  const startElementDrag = useCallback((id: string, e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragIdRef.current = id;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    const el = elements.find((x) => x.id === id);
    elemStartRef.current = { x: el?.x ?? 0, y: el?.y ?? 0 };
  }, [elements]);

  const onElementPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const id = dragIdRef.current;
    if (!id) return;
    const dx = (e.clientX - dragStartRef.current.x) / scale;
    const dy = (e.clientY - dragStartRef.current.y) / scale;
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, x: Math.round(elemStartRef.current.x + dx), y: Math.round(elemStartRef.current.y + dy) } : el)));
  }, [scale]);

  const endElementDrag = useCallback(async (e: React.PointerEvent<HTMLDivElement>) => {
    const id = dragIdRef.current;
    if (!id) return;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    dragIdRef.current = null;
    const el = elements.find((x) => x.id === id);
    if (!el) return;
    try {
      await update(ref(rtdb, `moodboards/${boardId}/elements/${id}`), {
        x: el.x,
        y: el.y,
        updatedAt: serverTimestamp(),
      });
    } catch {}
  }, [rtdb, boardId, elements]);

  async function addNote(center?: { x: number; y: number }) {
    const world = center ?? { x: (-offset.x + (window.innerWidth / 2)) / scale, y: (-offset.y + (window.innerHeight / 2)) / scale };
    const payload = {
      type: "note",
      x: Math.round(world.x - 80),
      y: Math.round(world.y - 60),
      w: 160,
      h: 120,
      text: "New note",
      color: "#fde68a",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      await push(ref(rtdb, `moodboards/${boardId}/elements`), payload);
    } catch {}
  }

  function removeElement(id: string) {
    remove(ref(rtdb, `moodboards/${boardId}/elements/${id}`)).catch(() => {});
  }

  const transformStyle = useMemo(() => ({
    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
    transformOrigin: "0 0",
  }), [offset.x, offset.y, scale]);

  const gridStyle = useMemo<React.CSSProperties>(() => {
    const cell = 40; // px
    // Offset the two gradient layers separately: x for vertical lines, y for horizontal lines
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
      {/* Toolbar */}
      <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
        <button
          className="px-3 py-1.5 text-sm rounded-md bg-stone-800 text-stone-100 hover:bg-stone-700"
          onClick={() => addNote()}
        >
          Add Note
        </button>
        <div className="px-2 py-1 text-xs rounded bg-stone-900/80 text-stone-300 border border-stone-800">
          {Math.round(scale * 100)}%
        </div>
      </div>

      {/* Background for panning and zoom */}
      <div
        className="absolute inset-0 z-10"
        onWheel={onWheel}
        onPointerDown={onBackgroundPointerDown}
        onPointerMove={onBackgroundPointerMove}
        onPointerUp={onBackgroundPointerUp}
      >
        {/* Grid that pans with camera */}
        <div className="absolute inset-0" style={gridStyle} />

        <div className="absolute left-0 top-0 will-change-transform" style={transformStyle}>
          {/* Content area */}
          {elements.map((el) => (
            <div
              key={el.id}
              data-elid={el.id}
              className="absolute rounded-md shadow-md border border-black/10"
              style={{ left: el.x, top: el.y, width: el.w ?? 160, height: el.h ?? 120, backgroundColor: el.color ?? "#fde68a" }}
              onPointerDown={(e) => startElementDrag(el.id, e)}
              onPointerMove={onElementPointerMove}
              onPointerUp={endElementDrag}
            >
              <div className="flex items-center justify-between gap-2 px-2 py-1 text-[11px] text-stone-800/80">
                <span>Note</span>
                <button className="hover:text-red-600" onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}>×</button>
              </div>
              <div className="px-2 text-stone-900 text-sm leading-snug line-clamp-6">
                {el.text || ""}
              </div>
            </div>
          ))}

          {!elements.length && !loading && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-stone-400 text-sm">
              Board is empty. Use "Add Note" to place your first item.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BoardCanvas;
