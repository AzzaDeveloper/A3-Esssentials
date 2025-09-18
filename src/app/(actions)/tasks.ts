"use server";

import { z } from "zod";

import { openrouter, openrouterModel } from "@/lib/openrouter";
import { DEFAULT_MOOD, MOOD_ORDER, MOOD_SET } from "@/lib/moods";
import type { TaskDraft, TaskMood, TeamMemberContext } from "@/lib/types";

const TeamMemberContextInput = z
  .object({
    id: z.string().min(1).max(120),
    name: z.string().min(1).max(120),
    roles: z.array(z.string().min(1).max(80)).max(12).optional(),
    email: z.string().email().optional(),
    tag: z.string().min(1).max(80).optional(),
  })
  .strict();

const GenerateTaskDraftInput = z.object({
  prompt: z.string().min(8, "Describe the task with at least a few words."),
  isPersonalBoard: z.boolean().optional(),
  teamMembers: z.array(TeamMemberContextInput).max(24).optional(),
});

const TeamMemberSchema = z
  .object({
    name: z.string().min(1).max(80),
    id: z.string().min(1).max(120).optional(),
    initials: z.string().min(1).max(12).optional(),
  })
  .strict();

const TaskMoodEnum = z.enum(MOOD_ORDER as [TaskMood, ...TaskMood[]]);

const TaskDraftSchema = z
  .object({
    title: z.string().min(3).max(120),
    description: z.string().max(2000).optional().default(""),
    tags: z
      .array(z.string().min(1).max(40))
      .max(10)
      .optional()
      .default([]),
    priority: z.enum(["low", "med", "high"]).optional().default("med"),
    assigneeId: z.string().min(1).max(120).optional(),
    dueDate: z.string().max(40).optional(),
    urgency: z
      .enum(["low", "medium", "urgent", "critical"])
      .optional()
      .default("medium"),
    energy: z.enum(["low", "medium", "high"]).optional().default("medium"),
    moods: z.array(TaskMoodEnum).min(1).max(4).optional().default([DEFAULT_MOOD]),
    teamMembers: z.array(TeamMemberSchema).max(8).optional().default([]),
  })
  .strict();

type RawTaskDraft = z.infer<typeof TaskDraftSchema>;
type TeamMemberInput = z.infer<typeof TeamMemberContextInput>;

function buildJsonSchema() {
  return {
    name: "TaskDraftPayload",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string", minLength: 3, maxLength: 120 },
        description: { type: "string", maxLength: 2000 },
        tags: {
          type: "array",
          maxItems: 10,
          items: { type: "string", minLength: 1, maxLength: 40 },
        },
        priority: {
          type: "string",
          enum: ["low", "med", "high"],
          default: "med",
        },
        assigneeId: { type: "string", minLength: 1, maxLength: 120 },
        dueDate: { type: "string", pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" },
        urgency: {
          type: "string",
          enum: ["low", "medium", "urgent", "critical"],
          default: "medium",
        },
        energy: {
          type: "string",
          enum: ["low", "medium", "high"],
          default: "medium",
        },
        moods: {
          type: "array",
          minItems: 1,
          maxItems: 4,
          items: {
            type: "string",
            enum: [...MOOD_ORDER],
          },
          default: [DEFAULT_MOOD],
        },
        teamMembers: {
          type: "array",
          maxItems: 8,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name"],
            properties: {
              name: { type: "string", minLength: 1, maxLength: 80 },
              id: { type: "string", minLength: 1, maxLength: 120 },
              initials: { type: "string", minLength: 1, maxLength: 12 },
            },
          },
          default: [],
        },
      },
      required: ["title"],
    },
  } as const;
}

function cleanTags(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of values) {
    const trimmed = tag.trim().slice(0, 40);
    if (!trimmed) continue;
    const canonical = trimmed.toLowerCase();
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    result.push(trimmed);
    if (result.length >= 10) break;
  }
  return result;
}

function cleanTeamMembers(values: RawTaskDraft["teamMembers"]) {
  return values
    .map((entry) => ({
      name: entry.name.trim(),
      id: entry.id?.trim() || undefined,
      initials: entry.initials?.trim() || undefined,
    }))
    .filter((entry) => entry.name.length > 0);
}

function normalizeDraftMoods(values: RawTaskDraft["moods"]): TaskDraft["moods"] {
  const source = values?.length ? values : [DEFAULT_MOOD];
  const filtered = source.filter((mood): mood is TaskMood => MOOD_SET.has(mood));
  const unique = Array.from(new Set(filtered));
  return unique.length ? unique : [DEFAULT_MOOD];
}

function normalizeTeamMembersForPrompt(values: TeamMemberInput[]): TeamMemberContext[] {
  const seen = new Set<string>();
  const result: TeamMemberContext[] = [];
  values.forEach((member) => {
    if (!member || typeof member !== "object") return;
    const id = typeof member.id === "string" ? member.id.trim().slice(0, 120) : "";
    const name = typeof member.name === "string" ? member.name.trim().slice(0, 120) : "";
    if (!id || !name || seen.has(id)) return;

    const roles = Array.isArray(member.roles)
      ? member.roles
          .map((role) => (typeof role === "string" ? role.trim().slice(0, 80) : ""))
          .filter((role) => role.length)
          .slice(0, 12)
      : [];

    const email = typeof member.email === "string" ? member.email.trim().slice(0, 160) : "";

    result.push({
      id,
      name,
      roles,
      email: email || null,
      tag: typeof member.tag === "string" ? member.tag.trim().slice(0, 80) || undefined : undefined,
    });
    seen.add(id);
  });
  return result;
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return undefined;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function extractTextFromResponse(resp: any): string {
  const content = resp?.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim()) return content.trim();
  throw new Error("No response text found");
}

export async function generateTaskDraft(input: {
  prompt: string;
  isPersonalBoard?: boolean;
  teamMembers?: TeamMemberContext[];
}): Promise<TaskDraft> {
  const { prompt, isPersonalBoard, teamMembers: teamMembersInput } = GenerateTaskDraftInput.parse(input);

  const teamRoster = normalizeTeamMembersForPrompt(teamMembersInput ?? []);
  const client = openrouter();
  const model = openrouterModel();

  const systemPromptParts = [
    "You convert natural-language task descriptions into structured JSON that matches Taskette's task schema.",
    isPersonalBoard
      ? "The task is for a personal board. Avoid adding teammates or extra collaborators unless the request is explicit."
      : "The task is for a collaborative team board. Include the collaborators requested in the brief.",
    teamRoster.length
      ? "When assigning work, choose assigneeId from the provided team roster ids when the request mentions a user or users (names, tags, or roles). Leave it empty when no owner is specified."
      : "",
    `Rules: respond with JSON only using the provided schema; keep titles under 120 characters; prefer concise markdown-free descriptions; use lowercase tags (max 10) with no symbols; use ISO YYYY-MM-DD for dueDate; default priority to "med", urgency and energy to "medium"; interpret moods from tone; never invent sensitive data.`,
  ];

  const systemPrompt = systemPromptParts.filter(Boolean).join(" ");

  const teamRosterPrompt = teamRoster.length
    ? teamRoster
        .map((member) => {
          const detail: string[] = [`${member.name} (id: ${member.id})`];
          if (member.tag) detail.push(`tag: @${member.tag}`);
          if (member.email) detail.push(`email: ${member.email}`);
          if (member.roles.length) detail.push(`roles: ${member.roles.join(", ")}`);
          return `- ${detail.join(" • ")}`;
        })
        .join("\n")
    : null;

  const messages: Array<{ role: "system" | "user"; content: string }> = [{ role: "system", content: systemPrompt }];

  if (teamRosterPrompt) {
    console.log("teamRosterPrompt", teamRosterPrompt);
    messages.push({
      role: "system",
      content: [
        `Team roster for assignment decisions:\n${teamRosterPrompt}`,
        "When you assign work, choose assigneeId from this roster and reuse the exact ids.",
        "For every collaborator you assign or the brief references (even loosely), add them to teamMembers with their roster id and name. Do not invent new people; always reuse roster data.",
      ].join("\n"),
    });
  }

  messages.push({ role: "user", content: prompt });

  let response: unknown;
  try {
    // OpenRouter exposes `response_format`, which is not yet in the OpenAI typings.
    console.log("model", model);

    response = await client.chat.completions.create(
      {
        model: model,
        messages,
        response_format: {
          type: "json_schema",
          json_schema: buildJsonSchema(),
        },
      } as any,
    );
  } catch (error) {
    console.error("generateTaskDraft:request", error);
    throw new Error("Unable to generate a task draft right now. Please try again.");
  }

  const rawText = extractTextFromResponse(response);

  let rawDraft: RawTaskDraft;
  try {
    rawDraft = TaskDraftSchema.parse(JSON.parse(rawText));
    console.log("rawDraft", rawDraft);
  } catch (error) {
    console.error("generateTaskDraft:parse", { rawText, error });
    throw new Error("AI response did not match the expected task format.");
  }

  const nowIso = new Date().toISOString();

  const candidateAssigneeId = rawDraft.assigneeId?.trim() ?? "";
  const validatedAssigneeId =
    isPersonalBoard || (candidateAssigneeId && !teamRoster.some((member) => member.id === candidateAssigneeId))
      ? ""
      : candidateAssigneeId;

  const draft: TaskDraft = {
    title: rawDraft.title.trim(),
    description: rawDraft.description?.trim() ?? "",
    tags: cleanTags(rawDraft.tags ?? []),
    priority: rawDraft.priority ?? "med",
    assigneeId: validatedAssigneeId,
    dueDate: rawDraft.dueDate ?? "",
    urgency: rawDraft.urgency ?? "medium",
    energy: rawDraft.energy ?? "medium",
    moods: normalizeDraftMoods(rawDraft.moods),
    teamMembers: cleanTeamMembers(rawDraft.teamMembers ?? []),
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const existingIds = new Set(
    draft.teamMembers
      .map((member) => (typeof member.id === "string" ? member.id.trim() : ""))
      .filter((id): id is string => id.length > 0),
  );

  if (validatedAssigneeId && !existingIds.has(validatedAssigneeId)) {
    const assigned = teamRoster.find((member) => member.id === validatedAssigneeId);
    if (assigned) {
      draft.teamMembers.push({
        name: assigned.name,
        id: assigned.id,
        initials: initialsFromName(assigned.name),
      });
      existingIds.add(validatedAssigneeId);
    }
  }

  const promptContext = `${prompt}\n${rawDraft.description ?? ""}`.toLowerCase();
  teamRoster.forEach((member) => {
    if (existingIds.has(member.id)) return;
    const nameMatch = member.name && promptContext.includes(member.name.toLowerCase());
    const tagMatch = member.tag ? promptContext.includes(`@${member.tag.toLowerCase()}`) : false;
    if (!nameMatch && !tagMatch) return;
    draft.teamMembers.push({
      name: member.name,
      id: member.id,
      initials: initialsFromName(member.name),
    });
    existingIds.add(member.id);
  });

  return draft;
}







