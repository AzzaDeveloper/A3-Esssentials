import type {
  MoodboardElement,
  MoodboardTask,
  TaskEnergy,
  TaskMember,
  TaskMood,
  TaskUrgency,
} from "@/lib/types";

export const BOARD_TASK_FALLBACK_MOOD: TaskMood = "focused";
export const BOARD_TASK_ALLOWED_MOODS: TaskMood[] = [
  "energetic",
  "calm",
  "focused",
  "stressed",
  "creative",
  "analytical",
];
export const BOARD_TASK_ALLOWED_URGENCIES: TaskUrgency[] = ["low", "medium", "urgent", "critical"];
export const BOARD_TASK_ALLOWED_ENERGIES: TaskEnergy[] = ["low", "medium", "high"];
export const BOARD_TASK_DEFAULT_WIDTH = 360;
export const BOARD_TASK_MIN_WIDTH = 320;
export const BOARD_TASK_DEFAULT_HEIGHT = 260;

interface NormalizedTaskResult {
  task: MoodboardTask;
  changed: boolean;
  clearLegacyText: boolean;
}

interface NormalizedDimensions {
  width: number;
  height: number;
  changed: boolean;
}

export interface NormalizedElementSnapshot {
  element: MoodboardElement;
  requiresMigration: boolean;
  clearLegacyText: boolean;
}

function toIsoString(value: unknown): string | undefined {
  if (typeof value === "string" && value) return value;
  if (typeof value === "number") return new Date(value).toISOString();
  if (value && typeof (value as { toDate?: () => Date }).toDate === "function") {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch {}
  }
  return undefined;
}

export function sanitizeTeamMembers(input: unknown): TaskMember[] {
  if (!Array.isArray(input)) return [];

  const members: TaskMember[] = [];

  input.forEach((member, index) => {
    if (!member || typeof member !== "object") return;

    const idValue =
      typeof (member as any).id === "string" && (member as any).id
        ? String((member as any).id)
        : typeof (member as any).uid === "string" && (member as any).uid
          ? String((member as any).uid)
          : `member-${index}`;

    const nameValue = typeof (member as any).name === "string" && (member as any).name.trim().length
      ? (member as any).name.trim()
      : undefined;

    if (!nameValue) return;

    const initialsValue = typeof (member as any).initials === "string" ? (member as any).initials : undefined;
    const avatarRaw = (member as any).avatarUrl;

    const normalized: TaskMember = {
      id: idValue,
      name: nameValue,
    };

    if (typeof initialsValue === "string" && initialsValue.trim().length) {
      normalized.initials = initialsValue;
    }

    if (typeof avatarRaw === "string" && avatarRaw.trim().length) {
      normalized.avatarUrl = avatarRaw;
    } else if (avatarRaw === null) {
      normalized.avatarUrl = null;
    }

    members.push(normalized);
  });

  return members;
}

export function createDefaultMoodboardTask(id: string, boardId: string, now: string): MoodboardTask {
  return {
    id,
    title: "New task",
    description: "",
    tags: [],
    priority: "med",
    assigneeId: null,
    moods: [BOARD_TASK_FALLBACK_MOOD],
    urgency: "medium",
    energy: "medium",
    teamMembers: [],
    boardId,
    boardElementId: id,
    createdAt: now,
    updatedAt: now,
  } satisfies MoodboardTask;
}

function normalizeMoodboardTask(
  id: string,
  boardId: string,
  raw: unknown,
  nowIso: string,
): NormalizedTaskResult {
  const source = (raw as { task?: unknown; text?: unknown; createdAt?: unknown }) ?? {};
  const rawTask = (source.task ?? {}) as Partial<MoodboardTask> & Record<string, unknown>;
  const legacyText = typeof source.text === "string" ? source.text : "";

  let changed = rawTask.boardElementId !== id || rawTask.boardId !== boardId;
  let clearLegacyText = false;

  const titleCandidate = typeof rawTask.title === "string" && rawTask.title.trim().length ? rawTask.title.trim() : undefined;
  const normalizedTitle = titleCandidate ?? (legacyText.trim().length ? legacyText.trim().slice(0, 120) : "Untitled Task");
  if (normalizedTitle !== rawTask.title) changed = true;

  const descriptionCandidate = typeof rawTask.description === "string" ? rawTask.description : undefined;
  const normalizedDescription = descriptionCandidate ?? legacyText;
  if (normalizedDescription !== rawTask.description) changed = true;
  if ((!titleCandidate && legacyText) || (!descriptionCandidate && legacyText)) clearLegacyText = true;

  const rawTags = Array.isArray(rawTask.tags) ? rawTask.tags : [];
  const tagsCandidate = rawTags.filter((tag): tag is string => typeof tag === "string");
  if (
    !Array.isArray(rawTask.tags) ||
    tagsCandidate.length !== rawTags.length ||
    tagsCandidate.some((tag, index) => tag !== rawTags[index])
  ) {
    changed = true;
  }

  const priorityCandidate =
    rawTask.priority === "low" || rawTask.priority === "med" || rawTask.priority === "high" ? rawTask.priority : "med";
  if (priorityCandidate !== rawTask.priority) changed = true;

  const assigneeCandidate = typeof rawTask.assigneeId === "string" && rawTask.assigneeId.length ? rawTask.assigneeId : null;
  if (assigneeCandidate !== (rawTask.assigneeId ?? null)) changed = true;

  const dueDateCandidate = typeof rawTask.dueDate === "string" && rawTask.dueDate ? rawTask.dueDate : undefined;
  if (dueDateCandidate !== rawTask.dueDate) changed = true;

  const rawMoods = Array.isArray(rawTask.moods) ? rawTask.moods : [];
  const moodsCandidate = rawMoods.filter((mood): mood is TaskMood => BOARD_TASK_ALLOWED_MOODS.includes(mood as TaskMood));
  if (
    !Array.isArray(rawTask.moods) ||
    moodsCandidate.length !== rawMoods.length ||
    moodsCandidate.some((mood, index) => mood !== rawMoods[index])
  ) {
    changed = true;
  }
  const normalizedMoods = moodsCandidate.length ? moodsCandidate : [BOARD_TASK_FALLBACK_MOOD];
  if (!moodsCandidate.length) changed = true;

  const urgencyCandidate = BOARD_TASK_ALLOWED_URGENCIES.includes(rawTask.urgency as TaskUrgency)
    ? (rawTask.urgency as TaskUrgency)
    : "medium";
  if (urgencyCandidate !== rawTask.urgency) changed = true;

  const energyCandidate = BOARD_TASK_ALLOWED_ENERGIES.includes(rawTask.energy as TaskEnergy)
    ? (rawTask.energy as TaskEnergy)
    : "medium";
  if (energyCandidate !== rawTask.energy) changed = true;

  const rawTeamMembers = Array.isArray(rawTask.teamMembers) ? rawTask.teamMembers : null;
  const teamMembersCandidate = sanitizeTeamMembers(rawTask.teamMembers);
  if (!rawTeamMembers || teamMembersCandidate.length !== rawTeamMembers.length) changed = true;

  const boardIdCandidate = typeof rawTask.boardId === "string" && rawTask.boardId.length ? rawTask.boardId : boardId;
  if (boardIdCandidate !== rawTask.boardId) changed = true;

  const boardElementIdCandidate = typeof rawTask.boardElementId === "string" && rawTask.boardElementId.length ? rawTask.boardElementId : id;
  if (boardElementIdCandidate !== rawTask.boardElementId) changed = true;

  const createdAtCandidate = toIsoString(rawTask.createdAt) ?? toIsoString(source.createdAt) ?? nowIso;
  if (createdAtCandidate !== rawTask.createdAt) changed = true;

  const updatedAtCandidate = toIsoString(rawTask.updatedAt) ?? nowIso;
  if (updatedAtCandidate !== rawTask.updatedAt) changed = true;

  const normalizedTask: MoodboardTask = {
    id: typeof rawTask.id === "string" && rawTask.id.length ? rawTask.id : id,
    title: normalizedTitle,
    description: normalizedDescription,
    tags: tagsCandidate,
    priority: priorityCandidate,
    assigneeId: assigneeCandidate,
    ...(typeof dueDateCandidate === "string" ? { dueDate: dueDateCandidate } : {}),
    moods: normalizedMoods,
    urgency: urgencyCandidate,
    energy: energyCandidate,
    teamMembers: teamMembersCandidate,
    boardId: boardIdCandidate,
    boardElementId: boardElementIdCandidate,
    createdAt: createdAtCandidate,
    updatedAt: updatedAtCandidate,
  };

  return { task: normalizedTask, changed, clearLegacyText };
}

function normalizeTaskDimensions(raw: unknown): NormalizedDimensions {
  const source = raw as { w?: unknown; h?: unknown };
  const rawWidth = Number(source?.w);
  const rawHeight = Number(source?.h);
  let changed = false;

  let width = Number.isFinite(rawWidth) ? rawWidth : BOARD_TASK_DEFAULT_WIDTH;
  if (!Number.isFinite(rawWidth) || rawWidth < BOARD_TASK_MIN_WIDTH) {
    width = Math.max(width, BOARD_TASK_MIN_WIDTH);
    changed = true;
  }

  const height = Number.isFinite(rawHeight) ? rawHeight : BOARD_TASK_DEFAULT_HEIGHT;
  if (!Number.isFinite(rawHeight)) changed = true;

  return { width, height, changed };
}

export function normalizeElementSnapshot(
  boardId: string,
  id: string,
  data: unknown,
): NormalizedElementSnapshot {
  const nowIso = new Date().toISOString();
  const { task, changed, clearLegacyText } = normalizeMoodboardTask(id, boardId, data, nowIso);
  const { width, height, changed: dimensionChanged } = normalizeTaskDimensions(data);
  const normalizedTask = changed ? { ...task, updatedAt: nowIso } : task;

  const element: MoodboardElement = {
    id,
    type: "task",
    x: Number((data as any)?.x ?? 0),
    y: Number((data as any)?.y ?? 0),
    w: width,
    h: height,
    task: normalizedTask,
    color: typeof (data as any)?.color === "string" ? (data as any).color : undefined,
    createdAt: (data as any)?.createdAt,
    updatedAt: (data as any)?.updatedAt,
  };

  const requiresMigration = changed || dimensionChanged || (data as any)?.type !== "task";

  return { element, requiresMigration, clearLegacyText };
}

export function moodboardElementComparator(a: MoodboardElement, b: MoodboardElement): number {
  const createdA =
    typeof a.createdAt === "number"
      ? a.createdAt
      : Number.isFinite(Date.parse(a.task.createdAt))
        ? Date.parse(a.task.createdAt)
        : 0;
  const createdB =
    typeof b.createdAt === "number"
      ? b.createdAt
      : Number.isFinite(Date.parse(b.task.createdAt))
        ? Date.parse(b.task.createdAt)
        : 0;

  return createdA - createdB;
}
