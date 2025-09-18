"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { firebase } from "@/lib/firebase";
import type { TeamMemberContext } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  onDisconnect,
  onValue,
  ref,
  remove,
  set,
  type DatabaseReference,
} from "firebase/database";

interface BoardCursorsProps {
  boardId: string;
  containerRef: RefObject<HTMLDivElement | null>;
  offset: { x: number; y: number };
  scale: number;
  viewerId?: string | null;
  viewerName?: string | null;
  viewerTag?: string | null;
  teamMembers: TeamMemberContext[];
}

interface CursorPresencePayload {
  x?: number;
  y?: number;
  tag?: string | null;
  name?: string | null;
  color?: string | null;
  updatedAt?: number;
}

interface CursorRenderState {
  id: string;
  tag?: string;
  name?: string;
  color: string;
  worldX: number;
  worldY: number;
  targetX: number;
  targetY: number;
  lastUpdate: number;
}

const BROADCAST_INTERVAL = 180;
const KEEP_ALIVE_INTERVAL = 3_000;
const INTERPOLATION_MS = 160;
const CURSOR_COLORS = [
  "#f97316",
  "#0ea5e9",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
  "#22d3ee",
  "#facc15",
  "#6366f1",
];

function colorForId(id: string) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

function safeNumber(value: unknown, fallback = 0) {
  const result = Number(value);
  return Number.isFinite(result) ? result : fallback;
}

export function BoardCursors({
  boardId,
  containerRef,
  offset,
  scale,
  viewerId,
  viewerName,
  viewerTag,
  teamMembers,
}: BoardCursorsProps) {
  const { rtdb } = firebase();
  const [cursors, setCursors] = useState<CursorRenderState[]>([]);

  const pointerStateRef = useRef({
    worldX: 0,
    worldY: 0,
    active: false,
    dirty: false,
    lastSentAt: 0,
  });

  const transformRef = useRef({ offset, scale });
  useEffect(() => {
    transformRef.current = { offset, scale };
  }, [offset, scale]);

  const memberLookup = useMemo(() => {
    const map = new Map<string, TeamMemberContext>();
    for (const entry of teamMembers) {
      if (entry.id) {
        map.set(entry.id, entry);
      }
    }
    return map;
  }, [teamMembers]);

  const presenceRef = useMemo<DatabaseReference | null>(() => {
    if (!viewerId) return null;
    return ref(rtdb, `moodboards/${boardId}/presence/cursors/${viewerId}`);
  }, [boardId, rtdb, viewerId]);

  useEffect(() => {
    if (!presenceRef) return undefined;
    const disconnect = onDisconnect(presenceRef);
    disconnect.remove().catch(() => {});
    return () => {
      disconnect.cancel().catch(() => {});
      remove(presenceRef).catch(() => {});
    };
  }, [presenceRef]);

  useEffect(() => {
    if (!presenceRef || !containerRef.current) return undefined;
    const element = containerRef.current;

    const handlePointerMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const { offset: currentOffset, scale: currentScale } =
        transformRef.current;
      const worldX =
        (event.clientX - rect.left - currentOffset.x) / currentScale;
      const worldY =
        (event.clientY - rect.top - currentOffset.y) / currentScale;
      pointerStateRef.current.worldX = worldX;
      pointerStateRef.current.worldY = worldY;
      pointerStateRef.current.active = true;
      pointerStateRef.current.dirty = true;
    };

    const handlePointerLeave = () => {
      pointerStateRef.current.active = false;
      pointerStateRef.current.dirty = false;
      pointerStateRef.current.lastSentAt = 0;
      remove(presenceRef).catch(() => {});
    };

    element.addEventListener("pointerdown", handlePointerMove);
    element.addEventListener("pointermove", handlePointerMove);
    element.addEventListener("pointerenter", handlePointerMove);
    element.addEventListener("pointerleave", handlePointerLeave);
    element.addEventListener("pointercancel", handlePointerLeave);
    element.addEventListener("pointerup", handlePointerLeave);

    return () => {
      element.removeEventListener("pointerdown", handlePointerMove);
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerenter", handlePointerMove);
      element.removeEventListener("pointerleave", handlePointerLeave);
      element.removeEventListener("pointercancel", handlePointerLeave);
      element.removeEventListener("pointerup", handlePointerLeave);
    };
  }, [containerRef, presenceRef]);

  useEffect(() => {
    if (!presenceRef) return undefined;

    const intervalId = window.setInterval(() => {
      const pointer = pointerStateRef.current;
      if (!pointer.active) return;

      const now = Date.now();
      if (!pointer.dirty && now - pointer.lastSentAt < KEEP_ALIVE_INTERVAL) {
        return;
      }

      pointer.dirty = false;
      pointer.lastSentAt = now;

      void set(presenceRef, {
        x: pointer.worldX,
        y: pointer.worldY,
        tag: viewerTag ?? null,
        name: viewerName ?? null,
        color: colorForId(viewerId ?? ""),
        updatedAt: now,
      } satisfies CursorPresencePayload);
    }, BROADCAST_INTERVAL);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [presenceRef, viewerId, viewerName, viewerTag]);

  const remoteCursorsRef = useRef<Map<string, CursorRenderState>>(new Map());

  useEffect(() => {
    const cursorsRef = ref(rtdb, `moodboards/${boardId}/presence/cursors`);
    const unsubscribe = onValue(cursorsRef, (snapshot) => {
      const value = snapshot.val() as Record<
        string,
        CursorPresencePayload
      > | null;
      const nextState = remoteCursorsRef.current;
      const seen = new Set<string>();
      const now = Date.now();

      if (value) {
        for (const [id, payload] of Object.entries(value)) {
          if (!payload || id === viewerId) continue;
          const targetX = safeNumber(payload.x);
          const targetY = safeNumber(payload.y);
          const member = memberLookup.get(id);
          const tag = payload.tag ?? member?.tag ?? undefined;
          const name = payload.name ?? member?.name ?? undefined;
          const color =
            typeof payload.color === "string" && payload.color.trim()
              ? payload.color
              : colorForId(id);
          const existing = nextState.get(id);
          if (existing) {
            existing.targetX = targetX;
            existing.targetY = targetY;
            existing.tag = tag;
            existing.name = name;
            existing.color = color;
            existing.lastUpdate = now;
          } else {
            nextState.set(id, {
              id,
              tag,
              name,
              color,
              worldX: targetX,
              worldY: targetY,
              targetX,
              targetY,
              lastUpdate: now,
            });
          }
          seen.add(id);
        }
      }

      for (const id of Array.from(nextState.keys())) {
        if (!seen.has(id)) {
          nextState.delete(id);
        }
      }

      setCursors(Array.from(nextState.values()).map((entry) => ({ ...entry })));
    });

    return () => unsubscribe();
  }, [boardId, memberLookup, rtdb, viewerId]);

  useEffect(() => {
    let raf = 0;
    let previous = performance.now();

    const step = (timestamp: number) => {
      const delta = timestamp - previous;
      previous = timestamp;
      const entries = remoteCursorsRef.current;
      let changed = false;

      entries.forEach((cursor) => {
        const diffX = cursor.targetX - cursor.worldX;
        const diffY = cursor.targetY - cursor.worldY;
        if (Math.abs(diffX) < 0.5 && Math.abs(diffY) < 0.5) {
          cursor.worldX = cursor.targetX;
          cursor.worldY = cursor.targetY;
          return;
        }
        const factor = Math.min(1, delta / INTERPOLATION_MS);
        cursor.worldX += diffX * factor;
        cursor.worldY += diffY * factor;
        changed = true;
      });

      if (changed) {
        setCursors(Array.from(entries.values()).map((entry) => ({ ...entry })));
      }

      raf = window.requestAnimationFrame(step);
    };

    raf = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  if (!viewerId) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {cursors.map((cursor) => {
        const screenX = cursor.worldX * scale + offset.x;
        const screenY = cursor.worldY * scale + offset.y;
        const label = cursor.tag ? `@${cursor.tag}` : cursor.name ?? "Guest";
        return (
          <div
            key={cursor.id}
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{ transform: `translate(${screenX}px, ${screenY}px)` }}
          >
            <div className="flex flex-col items-center gap-1 text-xs font-medium text-slate-800">
              <div
                className="rounded-full px-2 py-1 shadow-sm"
                style={{ backgroundColor: cursor.color, color: "white" }}
              >
                {label}
              </div>
              <div
                className={cn(
                  "h-3 w-3 -translate-y-1 rounded-full border-2 border-white shadow-sm"
                )}
                style={{ backgroundColor: cursor.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default BoardCursors;
