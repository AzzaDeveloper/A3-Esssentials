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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { firebase } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { MoodboardElement, MoodboardTask, TeamMemberContext } from "@/lib/types";
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
import { collection, doc, getDoc, getDocs, limit, query, where, type Firestore } from "firebase/firestore";

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
  for (const [memberId, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!memberId) continue;
    if (Array.isArray(raw)) {
      const roles = raw.filter((role) => typeof role === "string" && role.trim().length > 0);
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

export function BoardCanvas({ boardId, isPersonal = false, teamId = null }: BoardCanvasProps) {
  const { rtdb } = firebase();
  const { user } = useAuth();
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
  const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([]);
  const [isRosterOpen, setIsRosterOpen] = useState(false);

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
        const memberIds: string[] = Array.isArray(teamData?.members) ? teamData.members : [];
        if (!memberIds.length) {
          if (!cancelled) setTeamMembers([]);
          return;
        }

        const roleMap = normalizeRoleMap(teamData?.role);
        const teamRoleMap = normalizeRoleMap(teamData?.teamRole);
        const mergedRoles: Record<string, string[]> = {};
        for (const [memberId, roles] of Object.entries(roleMap)) {
          if (!Array.isArray(roles)) continue;
          mergedRoles[memberId] = Array.from(new Set([...(mergedRoles[memberId] ?? []), ...roles]));
        }
        for (const [memberId, roles] of Object.entries(teamRoleMap)) {
          if (!Array.isArray(roles)) continue;
          mergedRoles[memberId] = Array.from(new Set([...(mergedRoles[memberId] ?? []), ...roles]));
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
                  "Member",
              );
              return {
                id: memberId,
                name: displayName,
                displayName,
                roles: mergedRoles[memberId] ?? [],
                email: typeof userData.email === "string" ? userData.email : undefined,
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
          }),
        );

        if (!cancelled) {
          const sorted = memberRows.sort((a, b) => a.displayName.localeCompare(b.displayName));
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
    [boardId, teamId, user?.uid],
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
    [boardId, resolveWorldPosition, rtdb, sendAssigneeNotification],
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

  const teamMemberContext = useMemo<TeamMemberContext[]>(
    () =>
      teamMembers.map(({ id, name, roles, email, tag }) => ({
        id,
        name,
        roles,
        email,
        tag: tag ?? undefined,
      })),
    [teamMembers],
  );
  const isTeamBoard = !isPersonal && !!teamId;
  const hasRoster = teamMemberContext.length > 0;

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
          triggerClassName="border border-slate-300 bg-slate-900 text-white shadow-sm hover:bg-slate-800"
          isPersonalBoard={isPersonal}
          onManualCreate={handleManualCreate}
          teamMembers={teamMemberContext}
        />
        <Button
          variant="outline"
          className="border border-slate-300 bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-200"
          onClick={() => addTask()}
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
            onClick={() => setIsRosterOpen(true)}
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
        teamMembers={teamMemberContext}
      />
      {isTeamBoard ? (
        <Dialog open={isRosterOpen} onOpenChange={setIsRosterOpen}>
          <DialogContent className="sm:max-w-md bg-white text-slate-900">
            <DialogHeader>
              <DialogTitle className="text-slate-900">Team members</DialogTitle>
              <DialogDescription className="text-slate-600">
                Browse the roster and jump into a teammate&apos;s profile.
              </DialogDescription>
            </DialogHeader>
            {hasRoster ? (
              <div className="space-y-4">
                {teamMemberContext.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Link
                          href={`/user/${member.id}`}
                          className="text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
                          onClick={() => setIsRosterOpen(false)}
                        >
                          {member.name}
                        </Link>
                        <div className="text-xs text-slate-500">
                          {member.email || "No email on file"}
                        </div>
                      </div>
                      <Button asChild size="sm" variant="outline" className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100">
                        <Link href={`/user/${member.id}`}>Open profile</Link>
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {member.roles?.length ? (
                        member.roles.map((role) => (
                          <Badge
                            key={`${member.id}-${role}`}
                            variant="outline"
                            className="border-slate-300 bg-white text-slate-700 capitalize"
                          >
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">No roles assigned</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">This team doesn&apos;t have any members yet.</p>
            )}
            {teamId ? (
              <div className="pt-4">
                <Button className="w-full bg-slate-900 text-white hover:bg-slate-800" asChild>
                  <Link href={`/teams/${teamId}`}>View team page</Link>
                </Button>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}

export default BoardCanvas;
async function fetchUserTag(db: Firestore, uid: string) {
  try {
    const tagQuery = query(collection(db, "user_tags"), where("uid", "==", uid), limit(1));
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
