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
import { BoardInteractiveSurface } from "@/components/moodboard/board-interactive-surface";
import { BoardCanvasControls } from "@/components/moodboard/board-canvas-controls";
import { BoardRosterDialog } from "@/components/moodboard/board-roster-dialog";
import { TaskEditorDialog } from "@/components/moodboard/task-editor-dialog";
import { type ManualTaskFormState } from "@/components/tasks/create-task-dialog";
import { firebase } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type {
  MoodboardElement,
  MoodboardTask,
  TeamMemberContext,
} from "@/lib/types";
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
import {
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
  type DatabaseReference,
} from "firebase/database";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
  type Firestore,
} from "firebase/firestore";

interface BoardCanvasProps {
  boardId: string;
  isPersonal?: boolean;
  teamId?: string | null;
}

interface TeamMemberOption extends TeamMemberContext {
  displayName: string;
}

function normalizeRoleMap(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== "object") return {};
  const result: Record<string, string[]> = {};
  for (const [memberId, raw] of Object.entries(
    value as Record<string, unknown>
  )) {
    if (!memberId) continue;
    if (Array.isArray(raw)) {
      const roles = raw.filter(
        (role) => typeof role === "string" && role.trim().length > 0
      );
      if (roles.length) result[memberId] = roles as string[];
      continue;
    }
    if (typeof raw === "string" && raw.trim().length) {
      result[memberId] = [raw.trim()];
    }
  }
  return result;
}

function toElementPosition(world: { x: number; y: number }) {
  return {
    x: Math.round(world.x - BOARD_TASK_DEFAULT_WIDTH / 2),
    y: Math.round(world.y - BOARD_TASK_DEFAULT_HEIGHT / 2),
  };
}

const POSITION_BROADCAST_INTERVAL = 180;
const POSITION_KEEP_ALIVE_MS = 3_000;
const ELEMENT_INTERPOLATION_MS = 160;

interface ElementPresencePayload {
  elementId?: string;
  userId?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  updatedAt?: number;
}

interface RemoteElementInterpolant {
  worldX: number;
  worldY: number;
  targetX: number;
  targetY: number;
  w?: number;
  h?: number;
}

function mapInterpolantsToOverrides(
  source: Map<string, RemoteElementInterpolant>,
): Record<string, { x: number; y: number; w?: number; h?: number }> {
  const result: Record<string, { x: number; y: number; w?: number; h?: number }> = {};
  source.forEach((entry, id) => {
    result[id] = {
      x: entry.worldX,
      y: entry.worldY,
      ...(entry.w !== undefined ? { w: entry.w } : {}),
      ...(entry.h !== undefined ? { h: entry.h } : {}),
    };
  });
  return result;
}

export function BoardCanvas({
  boardId,
  isPersonal = false,
  teamId = null,
}: BoardCanvasProps) {
  const { rtdb } = firebase();
  const { user } = useAuth();
  const [elements, setElements] = useState<MoodboardElement[]>([]);
  const [isOffline, setIsOffline] = useState(false);

  const [scale, setScale] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOriginRef = useRef({ x: 0, y: 0 });

  const dragIdRef = useRef<string | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const elemStartRef = useRef({ x: 0, y: 0 });
  const resizeIdRef = useRef<string | null>(null);
  const resizeStartRef = useRef({ x: 0, y: 0 });
  const sizeStartRef = useRef({
    w: BOARD_TASK_DEFAULT_WIDTH,
    h: BOARD_TASK_DEFAULT_HEIGHT,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([]);
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const zIndexCounterRef = useRef(0);
  const [zIndexMap, setZIndexMap] = useState<Record<string, number>>({});

  const [remoteElementTargets, setRemoteElementTargets] = useState<
    Record<string, { x: number; y: number; w?: number; h?: number }>
  >({});
  const [smoothedElementOverrides, setSmoothedElementOverrides] = useState<
    Record<string, { x: number; y: number; w?: number; h?: number }>
  >({});
  const remoteElementInterpolantsRef = useRef<
    Map<string, RemoteElementInterpolant>
  >(new Map());
  const dragPresenceRef = useRef<{
    active: boolean;
    dirty: boolean;
    elementId: string;
    x: number;
    y: number;
    w: number;
    h: number;
    lastSentAt: number;
  }>({
    active: false,
    dirty: false,
    elementId: "",
    x: 0,
    y: 0,
    w: BOARD_TASK_DEFAULT_WIDTH,
    h: BOARD_TASK_DEFAULT_HEIGHT,
    lastSentAt: 0,
  });

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
          if (
            !raw ||
            typeof raw !== "object" ||
            raw.type !== "task" ||
            !raw.task
          ) {
            continue;
          }

          const xValue = Number((raw as any).x);
          const yValue = Number((raw as any).y);
          const widthValue = Number((raw as any).w);
          const heightValue = Number((raw as any).h);

          const normalizedWidth = Number.isFinite(widthValue)
            ? widthValue
            : BOARD_TASK_DEFAULT_WIDTH;
          const normalizedHeight = Number.isFinite(heightValue)
            ? heightValue
            : BOARD_TASK_DEFAULT_HEIGHT;

          const element: MoodboardElement = {
            id,
            type: "task",
            x: Number.isFinite(xValue) ? xValue : 0,
            y: Number.isFinite(yValue) ? yValue : 0,
            w: Math.min(
              BOARD_TASK_MAX_WIDTH,
              Math.max(BOARD_TASK_MIN_WIDTH, normalizedWidth)
            ),
            h: Math.min(
              BOARD_TASK_MAX_HEIGHT,
              Math.max(BOARD_TASK_MIN_HEIGHT, normalizedHeight)
            ),
            task: raw.task as MoodboardTask,
            color:
              typeof (raw as any).color === "string"
                ? (raw as any).color
                : undefined,
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
      }
    );

    return () => unsubscribe();
  }, [boardId, rtdb]);

  useEffect(() => {
    setZIndexMap((previous) => {
      const next = { ...previous };
      let changed = false;
      for (const element of elements) {
        if (next[element.id] === undefined) {
          zIndexCounterRef.current += 1;
          next[element.id] = zIndexCounterRef.current;
          changed = true;
        }
      }
      for (const key of Object.keys(next)) {
        if (!elements.some((element) => element.id === key)) {
          delete next[key];
          changed = true;
        }
      }
      return changed ? next : previous;
    });
  }, [elements]);

  const bringElementToFront = useCallback((id: string) => {
    setZIndexMap((previous) => {
      const nextValue = zIndexCounterRef.current + 1;
      zIndexCounterRef.current = nextValue;
      if (previous[id] === nextValue) {
        return previous;
      }
      return { ...previous, [id]: nextValue };
    });
  }, []);

  useEffect(() => {
    if (isPersonal || !teamId) {
      setTeamMembers([]);
      return;
    }

    let cancelled = false;
    const { db } = firebase();

    const load = async () => {
      try {
        const teamSnap = await getDoc(doc(db, "teams", teamId));
        if (!teamSnap.exists()) {
          if (!cancelled) setTeamMembers([]);
          return;
        }

        const teamData = teamSnap.data() as any;
        const memberIds: string[] = Array.isArray(teamData?.members)
          ? teamData.members
          : [];
        if (!memberIds.length) {
          if (!cancelled) setTeamMembers([]);
          return;
        }

        const roleMap = normalizeRoleMap(teamData?.role);
        const teamRoleMap = normalizeRoleMap(teamData?.teamRole);
        const mergedRoles: Record<string, string[]> = {};
        for (const [memberId, roles] of Object.entries(roleMap)) {
          if (!Array.isArray(roles)) continue;
          mergedRoles[memberId] = Array.from(
            new Set([...(mergedRoles[memberId] ?? []), ...roles])
          );
        }
        for (const [memberId, roles] of Object.entries(teamRoleMap)) {
          if (!Array.isArray(roles)) continue;
          mergedRoles[memberId] = Array.from(
            new Set([...(mergedRoles[memberId] ?? []), ...roles])
          );
        }

        const memberRows = await Promise.all(
          memberIds.map(async (memberId) => {
            try {
              const userSnap = await getDoc(doc(db, "users", memberId));
              const userData: any = userSnap.exists() ? userSnap.data() : {};
              const userTag = await fetchUserTag(db, memberId);
              const displayName = String(
                userData.displayName ||
                  userData.name ||
                  userData.email ||
                  userData.handle ||
                  "Member"
              );
              return {
                id: memberId,
                name: displayName,
                displayName,
                roles: mergedRoles[memberId] ?? [],
                email:
                  typeof userData.email === "string"
                    ? userData.email
                    : undefined,
                tag: userTag,
              } satisfies TeamMemberOption;
            } catch (error) {
              console.error("board-canvas:loadMember", error);
              return {
                id: memberId,
                name: memberId,
                displayName: memberId,
                roles: mergedRoles[memberId] ?? [],
                email: undefined,
                tag: undefined,
              } satisfies TeamMemberOption;
            }
          })
        );

        if (!cancelled) {
          const sorted = memberRows.sort((a, b) =>
            a.displayName.localeCompare(b.displayName)
          );
          setTeamMembers(sorted);
        }
      } catch (error) {
        console.error("board-canvas:loadTeamMembers", error);
        if (!cancelled) setTeamMembers([]);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [isPersonal, teamId]);

  const resolveWorldPosition = useCallback(
    (center?: { x: number; y: number }) => {
      if (center) return center;
      if (typeof window === "undefined") return { x: 0, y: 0 };
      return {
        x: (-offset.x + window.innerWidth / 2) / scale,
        y: (-offset.y + window.innerHeight / 2) / scale,
      };
    },
    [offset.x, offset.y, scale]
  );

  const onWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      const delta = -event.deltaY;
      const zoomFactor = Math.exp(delta * 0.001);
      const previousScale = scale;
      const nextScale = Math.min(3, Math.max(0.25, previousScale * zoomFactor));
      if (nextScale === previousScale) return;

      const rect = (
        event.currentTarget as HTMLDivElement
      ).getBoundingClientRect();
      const cx = event.clientX - rect.left;
      const cy = event.clientY - rect.top;
      const worldX = (cx - offset.x) / previousScale;
      const worldY = (cy - offset.y) / previousScale;

      setOffset({ x: cx - worldX * nextScale, y: cy - worldY * nextScale });
      setScale(nextScale);
    },
    [offset.x, offset.y, scale]
  );

  const onBackgroundPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).dataset.elid) return;
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      isPanningRef.current = true;
      panStartRef.current = { x: event.clientX, y: event.clientY };
      panOriginRef.current = { ...offset };
    },
    [offset]
  );

  const onBackgroundPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!isPanningRef.current) return;
      const dx = event.clientX - panStartRef.current.x;
      const dy = event.clientY - panStartRef.current.y;
      setOffset({
        x: panOriginRef.current.x + dx,
        y: panOriginRef.current.y + dy,
      });
    },
    []
  );

  const onBackgroundPointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      isPanningRef.current = false;
      (event.currentTarget as HTMLElement).releasePointerCapture?.(
        event.pointerId
      );
    },
    []
  );

  const startElementDrag = useCallback(
    (id: string, event: PointerEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      if (
        target.closest("button, a, input, textarea, select, [data-drag-stop]")
      )
        return;
      if (resizeIdRef.current) return;
      event.stopPropagation();
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      dragIdRef.current = id;
      dragStartRef.current = { x: event.clientX, y: event.clientY };
      const element = elements.find((entry) => entry.id === id);
      elemStartRef.current = { x: element?.x ?? 0, y: element?.y ?? 0 };
      bringElementToFront(id);
      const initialX = element?.x ?? elemStartRef.current.x;
      const initialY = element?.y ?? elemStartRef.current.y;
      dragPresenceRef.current.elementId = id;
      dragPresenceRef.current.x = initialX;
      dragPresenceRef.current.y = initialY;
      dragPresenceRef.current.w = element?.w ?? BOARD_TASK_DEFAULT_WIDTH;
      dragPresenceRef.current.h = element?.h ?? BOARD_TASK_DEFAULT_HEIGHT;
      dragPresenceRef.current.active = true;
      dragPresenceRef.current.dirty = true;
      dragPresenceRef.current.lastSentAt = 0;
    },
    [bringElementToFront, elements]
  );

  const onElementPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (resizeIdRef.current) {
        const id = resizeIdRef.current;
        const dx = (event.clientX - resizeStartRef.current.x) / scale;
        const dy = (event.clientY - resizeStartRef.current.y) / scale;
        const baseWidth = sizeStartRef.current.w ?? BOARD_TASK_DEFAULT_WIDTH;
        const baseHeight = sizeStartRef.current.h ?? BOARD_TASK_DEFAULT_HEIGHT;
        const nextWidth = Math.round(
          Math.min(
            BOARD_TASK_MAX_WIDTH,
            Math.max(BOARD_TASK_MIN_WIDTH, baseWidth + dx)
          )
        );
        const nextHeight = Math.round(
          Math.min(
            BOARD_TASK_MAX_HEIGHT,
            Math.max(BOARD_TASK_MIN_HEIGHT, baseHeight + dy)
          )
        );
        setElements((previous) =>
          previous.map((element) =>
            element.id === id
              ? { ...element, w: nextWidth, h: nextHeight }
              : element
          )
        );
        dragPresenceRef.current.w = nextWidth;
        dragPresenceRef.current.h = nextHeight;
        dragPresenceRef.current.dirty = true;
        return;
      }

      const id = dragIdRef.current;
      if (!id) return;
      const dx = (event.clientX - dragStartRef.current.x) / scale;
      const dy = (event.clientY - dragStartRef.current.y) / scale;
      const nextX = Math.round(elemStartRef.current.x + dx);
      const nextY = Math.round(elemStartRef.current.y + dy);
      setElements((previous) =>
        previous.map((element) =>
          element.id === id ? { ...element, x: nextX, y: nextY } : element
        )
      );
      dragPresenceRef.current.x = nextX;
      dragPresenceRef.current.y = nextY;
      dragPresenceRef.current.dirty = true;
    },
    [scale]
  );
  const viewerId = user?.uid ?? null;
  const viewerName = user?.displayName ?? user?.email ?? null;

  const elementPresenceRef = useMemo<DatabaseReference | null>(() => {
    if (!viewerId) return null;
    return ref(
      rtdb,
      ["moodboards", boardId, "presence", "elements", viewerId].join("/")
    );
  }, [boardId, rtdb, viewerId]);

  const endElementDrag = useCallback(
    async (event: PointerEvent<HTMLDivElement>) => {
      const id = dragIdRef.current;
      if (!id) return;
      (event.currentTarget as HTMLElement).releasePointerCapture?.(
        event.pointerId
      );
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
      dragPresenceRef.current.active = false;
      dragPresenceRef.current.elementId = "";
      dragPresenceRef.current.dirty = false;
      dragPresenceRef.current.lastSentAt = 0;
      dragPresenceRef.current.x = element.x;
      dragPresenceRef.current.y = element.y;
      dragPresenceRef.current.w = element.w ?? BOARD_TASK_DEFAULT_WIDTH;
      dragPresenceRef.current.h = element.h ?? BOARD_TASK_DEFAULT_HEIGHT;
      if (elementPresenceRef) {
        remove(elementPresenceRef).catch(() => {});
      }
    },
    [boardId, elementPresenceRef, elements, rtdb]
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
      bringElementToFront(id);
      dragPresenceRef.current.elementId = id;
      dragPresenceRef.current.x = element.x ?? 0;
      dragPresenceRef.current.y = element.y ?? 0;
      dragPresenceRef.current.w = element.w ?? BOARD_TASK_DEFAULT_WIDTH;
      dragPresenceRef.current.h = element.h ?? BOARD_TASK_DEFAULT_HEIGHT;
      dragPresenceRef.current.active = true;
      dragPresenceRef.current.dirty = true;
      dragPresenceRef.current.lastSentAt = 0;
    },
    [bringElementToFront, elements]
  );

  const endElementResize = useCallback(
    async (event: PointerEvent<HTMLDivElement>) => {
      const id = resizeIdRef.current;
      if (!id) return;
      (event.currentTarget as HTMLElement).releasePointerCapture?.(
        event.pointerId
      );
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
      dragPresenceRef.current.active = false;
      dragPresenceRef.current.elementId = "";
      dragPresenceRef.current.dirty = false;
      dragPresenceRef.current.lastSentAt = 0;
      dragPresenceRef.current.x = element.x;
      dragPresenceRef.current.y = element.y;
      dragPresenceRef.current.w = element.w ?? BOARD_TASK_DEFAULT_WIDTH;
      dragPresenceRef.current.h = element.h ?? BOARD_TASK_DEFAULT_HEIGHT;
      if (elementPresenceRef) {
        remove(elementPresenceRef).catch(() => {});
      }
    },
    [boardId, elementPresenceRef, elements, rtdb]
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
    [boardId, resolveWorldPosition, rtdb]
  );

  const sendAssigneeNotification = useCallback(
    async (task: MoodboardTask) => {
      const assigneeId = task.assigneeId;
      if (!assigneeId) return;
      const viewerId = user?.uid;
      if (viewerId && assigneeId === viewerId) return;

      try {
        await fetch("/api/tasks/notify-assignee", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assigneeId,
            taskTitle: task.title,
            taskId: task.id,
            boardId,
            teamId: teamId ?? undefined,
          }),
        });
      } catch (error) {
        console.error("board-canvas:notifyAssignee", error);
      }
    },
    [boardId, teamId, user?.uid]
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
        if (task.assigneeId) {
          void sendAssigneeNotification(task);
        }
      } catch (error) {
        console.error("board-canvas:onManualCreate", error);
      }
    },
    [boardId, resolveWorldPosition, rtdb, sendAssigneeNotification]
  );

  const removeElement = useCallback(
    (id: string) => {
      remove(ref(rtdb, `moodboards/${boardId}/elements/${id}`)).catch(() => {});
    },
    [boardId, rtdb]
  );

  const transformStyle = useMemo(
    () => ({
      transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
      transformOrigin: "0 0",
    }),
    [offset.x, offset.y, scale]
  );

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

  const renderedElements = useMemo(() => {
    const mapped = elements.map((element) => {
      const override = smoothedElementOverrides[element.id];
      if (!override) return element;
      const width =
        override.w === undefined
          ? element.w ?? BOARD_TASK_DEFAULT_WIDTH
          : Math.min(
              BOARD_TASK_MAX_WIDTH,
              Math.max(BOARD_TASK_MIN_WIDTH, override.w)
            );
      const height =
        override.h === undefined
          ? element.h ?? BOARD_TASK_DEFAULT_HEIGHT
          : Math.min(
              BOARD_TASK_MAX_HEIGHT,
              Math.max(BOARD_TASK_MIN_HEIGHT, override.h)
            );
      return {
        ...element,
        x: override.x,
        y: override.y,
        w: width,
        h: height,
      };
    });
    mapped.sort((a, b) => (zIndexMap[a.id] ?? 0) - (zIndexMap[b.id] ?? 0));
    return mapped;
  }, [elements, smoothedElementOverrides, zIndexMap]);

  const editingElement = useMemo(
    () =>
      editingId
        ? elements.find((entry) => entry.id === editingId) ?? null
        : null,
    [editingId, elements]
  );

  const teamMemberContext = useMemo<TeamMemberContext[]>(
    () =>
      teamMembers.map(({ id, name, roles, email, tag }) => ({
        id,
        name,
        roles,
        email,
        tag: tag ?? undefined,
      })),
    [teamMembers]
  );
  const isTeamBoard = !isPersonal && !!teamId;
  const hasRoster = teamMemberContext.length > 0;
  const viewerTag = useMemo(() => {
    if (!viewerId) return user?.displayName ?? null;
    const match = teamMemberContext.find((member) => member.id === viewerId);
    return match?.tag ?? null;
  }, [teamMemberContext, viewerId, user?.displayName]);

  useEffect(() => {
    if (!elementPresenceRef) return undefined;
    const disconnect = onDisconnect(elementPresenceRef);
    disconnect.remove().catch(() => {});
    return () => {
      disconnect.cancel().catch(() => {});
      remove(elementPresenceRef).catch(() => {});
    };
  }, [elementPresenceRef]);

  useEffect(() => {
    if (!elementPresenceRef) return undefined;

    const intervalId = window.setInterval(() => {
      const state = dragPresenceRef.current;
      if (!state.active || !state.elementId) return;

      const now = Date.now();
      if (!state.dirty && now - state.lastSentAt < POSITION_KEEP_ALIVE_MS) {
        return;
      }

      state.dirty = false;
      state.lastSentAt = now;

      void set(elementPresenceRef, {
        elementId: state.elementId,
        userId: viewerId ?? undefined,
        x: state.x,
        y: state.y,
        w: state.w,
        h: state.h,
        updatedAt: now,
      } satisfies ElementPresencePayload);
    }, POSITION_BROADCAST_INTERVAL);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [elementPresenceRef, viewerId]);

  useEffect(() => {
    const presenceRef = ref(
      rtdb,
      ["moodboards", boardId, "presence", "elements"].join("/")
    );
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const value = snapshot.val() as Record<
        string,
        ElementPresencePayload
      > | null;
      if (!value) {
        setRemoteElementTargets({});
        return;
      }

      const next: Record<
        string,
        { x: number; y: number; w?: number; h?: number }
      > = {};
      for (const payload of Object.values(value)) {
        if (!payload) continue;
        if (payload.userId && payload.userId === viewerId) continue;
        if (!payload.elementId) continue;

        const x = Number(payload.x);
        const y = Number(payload.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

        const entry: { x: number; y: number; w?: number; h?: number } = {
          x,
          y,
        };
        const width = Number(payload.w);
        if (Number.isFinite(width)) entry.w = width;
        const height = Number(payload.h);
        if (Number.isFinite(height)) entry.h = height;
        next[payload.elementId] = entry;
      }

      setRemoteElementTargets(next);
    });

    return () => unsubscribe();
  }, [boardId, rtdb, viewerId]);

  useEffect(() => {
    const interpolants = remoteElementInterpolantsRef.current;
    const seen = new Set<string>();
    for (const [id, payload] of Object.entries(remoteElementTargets)) {
      seen.add(id);
      const existing = interpolants.get(id);
      if (existing) {
        existing.targetX = payload.x;
        existing.targetY = payload.y;
        if (payload.w !== undefined) existing.w = payload.w;
        if (payload.h !== undefined) existing.h = payload.h;
      } else {
        interpolants.set(id, {
          worldX: payload.x,
          worldY: payload.y,
          targetX: payload.x,
          targetY: payload.y,
          w: payload.w,
          h: payload.h,
        });
      }
    }

    interpolants.forEach((_, key) => {
      if (!seen.has(key)) {
        interpolants.delete(key);
      }
    });

    setSmoothedElementOverrides(mapInterpolantsToOverrides(interpolants));
  }, [remoteElementTargets]);

  useEffect(() => {
    let raf = 0;
    let previous = performance.now();

    const step = (timestamp: number) => {
      const delta = timestamp - previous;
      previous = timestamp;
      const interpolants = remoteElementInterpolantsRef.current;
      let changed = false;

      interpolants.forEach((entry) => {
        const diffX = entry.targetX - entry.worldX;
        const diffY = entry.targetY - entry.worldY;
        if (Math.abs(diffX) > 0.5 || Math.abs(diffY) > 0.5) {
          const factor = Math.min(1, delta / ELEMENT_INTERPOLATION_MS);
          entry.worldX += diffX * factor;
          entry.worldY += diffY * factor;
          changed = true;
        } else if (diffX !== 0 || diffY !== 0) {
          entry.worldX = entry.targetX;
          entry.worldY = entry.targetY;
          changed = true;
        }
      });

      if (changed) {
        setSmoothedElementOverrides(mapInterpolantsToOverrides(interpolants));
      }

      raf = window.requestAnimationFrame(step);
    };

    raf = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!isTeamBoard && isRosterOpen) {
      setIsRosterOpen(false);
    }
  }, [isTeamBoard, isRosterOpen]);

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
            : element
        )
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
    [boardId, editingId, rtdb]
  );

  return (
    <>
      <div className="relative h-screen w-screen select-none overflow-hidden bg-white">
        <BoardCanvasControls
          isPersonalBoard={isPersonal}
          isTeamBoard={isTeamBoard}
          teamId={teamId}
          hasRoster={hasRoster}
          scale={scale}
          isOffline={isOffline}
          teamMembers={teamMemberContext}
          onManualCreate={handleManualCreate}
          onQuickDrop={() => addTask()}
          onOpenRoster={() => setIsRosterOpen(true)}
        />

        <BoardInteractiveSurface
          boardId={boardId}
          canvasRef={canvasRef}
          gridStyle={gridStyle}
          transformStyle={transformStyle}
          renderedElements={renderedElements}
          zIndices={zIndexMap}
          offset={offset}
          scale={scale}
          viewerId={viewerId}
          viewerName={viewerName}
          viewerTag={viewerTag}
          teamMembers={teamMemberContext}
          isBoardEmpty={!elements.length}
          onWheel={onWheel}
          onBackgroundPointerDown={onBackgroundPointerDown}
          onBackgroundPointerMove={onBackgroundPointerMove}
          onBackgroundPointerUp={onBackgroundPointerUp}
          onElementPointerMove={onElementPointerMove}
          onElementPointerUp={endElementDrag}
          onResizePointerMove={onElementPointerMove}
          onResizePointerUp={endElementResize}
          onElementPointerDown={startElementDrag}
          onResizePointerDown={startElementResize}
          onEdit={(id) => {
            bringElementToFront(id);
            setEditingId(id);
          }}
          onRemove={removeElement}
        />
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
        teamMembers={teamMemberContext}
      />
      {isTeamBoard ? (
        <BoardRosterDialog
          open={isRosterOpen}
          onOpenChange={setIsRosterOpen}
          teamMembers={teamMemberContext}
          teamId={teamId}
        />
      ) : null}
    </>
  );
}

export default BoardCanvas;
async function fetchUserTag(db: Firestore, uid: string) {
  try {
    const tagQuery = query(
      collection(db, "user_tags"),
      where("uid", "==", uid),
      limit(1)
    );
    const tagSnap = await getDocs(tagQuery);
    if (tagSnap.empty) return undefined;
    const docSnap = tagSnap.docs[0];
    const docId = typeof docSnap.id === "string" ? docSnap.id.trim() : "";
    if (docId) return docId;
    const data = docSnap.data() as any;
    const fallback = typeof data?.tag === "string" ? data.tag.trim() : "";
    return fallback || undefined;
  } catch (error) {
    console.error("board-canvas:fetchUserTag", error);
    return undefined;
  }
}
