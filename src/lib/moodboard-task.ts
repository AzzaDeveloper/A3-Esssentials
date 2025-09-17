import type { MoodboardTask, TaskEnergy, TaskMood, TaskUrgency } from "@/lib/types";
import { DEFAULT_MOOD, MOOD_ORDER } from "@/lib/moods";

export const BOARD_TASK_FALLBACK_MOOD: TaskMood = DEFAULT_MOOD;
export const BOARD_TASK_ALLOWED_MOODS: TaskMood[] = [...MOOD_ORDER];
export const BOARD_TASK_ALLOWED_URGENCIES: TaskUrgency[] = ["low", "medium", "urgent", "critical"];
export const BOARD_TASK_ALLOWED_ENERGIES: TaskEnergy[] = ["low", "medium", "high"];
export const BOARD_TASK_DEFAULT_WIDTH = 420;
export const BOARD_TASK_DEFAULT_HEIGHT = 320;
export const BOARD_TASK_MIN_WIDTH = 280;
export const BOARD_TASK_MIN_HEIGHT = 320;
export const BOARD_TASK_MAX_WIDTH = 960;
export const BOARD_TASK_MAX_HEIGHT = 720;


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

