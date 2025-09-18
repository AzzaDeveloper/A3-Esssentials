import type { MoodboardTask, TaskEnergy, TaskMember, TaskMood, TaskUrgency } from "@/lib/types";
import { BOARD_TASK_FALLBACK_MOOD } from "@/lib/moodboard-task";
import { MOOD_SET } from "@/lib/moods";

export type TaskDraftTeamMember =
  | (Pick<TaskMember, "name"> & Partial<Pick<TaskMember, "id" | "initials">>)
  | { name?: string | null; id?: string | null; initials?: string | null };

const ALLOWED_MOOD_SET = MOOD_SET;
const ALLOWED_PRIORITIES = new Set<NonNullable<MoodboardTask["priority"]>>(["low", "med", "high"]);
const ALLOWED_URGENCIES = new Set<MoodboardTask["urgency"]>(["low", "medium", "urgent", "critical"]);
const ALLOWED_ENERGIES = new Set<MoodboardTask["energy"]>(["low", "medium", "high"]);

export function normalizeManualTeamMembers(members: TaskDraftTeamMember[]): MoodboardTask["teamMembers"] {
  return members
    .map((member, index) => {
      if (!member || typeof member !== "object") return null;
      const name = typeof member.name === "string" ? member.name.trim() : "";
      if (!name) return null;

      const normalized: MoodboardTask["teamMembers"][number] = {
        id:
          typeof member.id === "string" && member.id.trim().length
            ? member.id.trim()
            : `member-${index}`,
        name,
      };

      if (typeof member.initials === "string" && member.initials.trim().length) {
        normalized.initials = member.initials.trim();
      }

      return normalized;
    })
    .filter((value): value is MoodboardTask["teamMembers"][number] => value !== null);
}

export function normalizeManualTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  tags.forEach((tag) => {
    if (typeof tag !== "string") return;
    const value = tag.trim().toLowerCase();
    if (!value || seen.has(value)) return;
    seen.add(value);
    normalized.push(value);
  });
  return normalized.slice(0, 12);
}

export function normalizeManualMoods(moods: TaskMood[]): MoodboardTask["moods"] {
  const filtered = moods.filter((mood) => ALLOWED_MOOD_SET.has(mood));
  return filtered.length ? filtered : [BOARD_TASK_FALLBACK_MOOD];
}

export function normalizePriority(priority: MoodboardTask["priority"] | undefined | null): MoodboardTask["priority"] {
  if (priority && ALLOWED_PRIORITIES.has(priority)) {
    return priority;
  }
  return "med";
}

export function normalizeUrgency(urgency: TaskUrgency | undefined | null): MoodboardTask["urgency"] {
  return urgency && ALLOWED_URGENCIES.has(urgency) ? urgency : "medium";
}

export function normalizeEnergy(energy: TaskEnergy | undefined | null): MoodboardTask["energy"] {
  return energy && ALLOWED_ENERGIES.has(energy) ? energy : "medium";
}

export function normalizeDateInput(value: string, fallbackIso: string): string {
  if (!value) return fallbackIso;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallbackIso;
  return parsed.toISOString();
}

export function normalizeOptionalDate(value: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

