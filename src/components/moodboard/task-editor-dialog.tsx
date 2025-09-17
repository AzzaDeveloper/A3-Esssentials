"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type {
  MoodboardTask,
  TaskEnergy,
  TaskMember,
  TaskMood,
  TaskUrgency,
  TeamMemberContext,
} from "@/lib/types";
import { DEFAULT_MOOD, MOOD_CONFIG, MOOD_ORDER } from "@/lib/moods";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { AlertCircle, Save, UserPlus, Users } from "lucide-react";

type EditableTask = Pick<
  MoodboardTask,
  | "title"
  | "description"
  | "dueDate"
  | "assigneeId"
  | "priority"
  | "moods"
  | "urgency"
  | "energy"
  | "teamMembers"
  | "tags"
  | "boardId"
  | "boardElementId"
  | "createdAt"
  | "updatedAt"
> & { id: string };

export interface TaskEditorDialogProps {
  open: boolean;
  task: MoodboardTask | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: MoodboardTask) => Promise<void> | void;
  isPersonalBoard?: boolean;
  teamMembers?: TeamMemberContext[];
}

const urgencyOptions: TaskUrgency[] = ["low", "medium", "urgent", "critical"];
const energyOptions: TaskEnergy[] = ["low", "medium", "high"];

function toDateInputValue(value: string | undefined) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return format(parsed, "yyyy-MM-dd");
}

function initialsFromName(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return undefined;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function TaskEditorDialog({
  open,
  task,
  onOpenChange,
  onSubmit,
  isPersonalBoard = false,
  teamMembers = [],
}: TaskEditorDialogProps) {
  const [draft, setDraft] = useState<EditableTask | null>(null);
  const [teamMemberSelectValue, setTeamMemberSelectValue] = useState("placeholder");
  const [error, setError] = useState<string | null>(null);

  const rosterOptions = useMemo(
    () =>
      teamMembers.map((member) => ({
        id: member.id,
        name: member.name,
        roles: Array.isArray(member.roles) ? member.roles : [],
        tag: member.tag ?? undefined,
      })),
    [teamMembers],
  );
  const assigneeOptions = rosterOptions;
  const hasAssigneeOptions = assigneeOptions.length > 0;

  const availableTeamMembers = useMemo(() => {
    if (!draft) return rosterOptions;
    return rosterOptions.filter((member) =>
      member.id ? !draft.teamMembers.some((existing) => existing.id === member.id) : true,
    );
  }, [draft, rosterOptions]);

  const updateDraft = useCallback((updater: (current: EditableTask) => EditableTask) => {
    setDraft((prev) => (prev ? updater(prev) : prev));
  }, []);

  useEffect(() => {
    setDraft((prev) => {
      if (!prev) return prev;
      if (isPersonalBoard) {
        return prev.assigneeId ? { ...prev, assigneeId: "" } : prev;
      }
      if (prev.assigneeId && !assigneeOptions.some((option) => option.id === prev.assigneeId)) {
        return { ...prev, assigneeId: "" };
      }
      return prev;
    });
  }, [assigneeOptions, isPersonalBoard]);

  useEffect(() => {
    if (!open) {
      setDraft(null);
      setTeamMemberSelectValue("placeholder");
      setError(null);
      return;
    }
    if (task) {
      setDraft({
        id: task.id,
        title: task.title,
        description: task.description ?? "",
        dueDate: task.dueDate ?? "",
        assigneeId: task.assigneeId ?? "",
        priority: task.priority ?? "med",
        moods: task.moods?.length ? [...task.moods] : [DEFAULT_MOOD],
        urgency: task.urgency ?? "medium",
        energy: task.energy ?? "medium",
        teamMembers: task.teamMembers ? [...task.teamMembers] : [],
        tags: task.tags ? [...task.tags] : [],
        boardId: task.boardId,
        boardElementId: task.boardElementId,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      });
      setTeamMemberSelectValue("placeholder");
      setError(null);
    }
  }, [open, task]);

  const canSave = useMemo(() => {
    if (!draft) return false;
    return draft.title.trim().length > 0;
  }, [draft]);

  if (!task || !draft) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <AlertCircle className="h-4 w-4" />
            Unable to load task details.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentTask: MoodboardTask = task;
  const currentDraft: EditableTask = draft;
  const assigneeSelectValue = currentDraft.assigneeId?.trim()
    ? currentDraft.assigneeId
    : "unassigned";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) {
      setError("Title is required");
      return;
    }

    const nowIso = new Date().toISOString();
    const updatedTask: MoodboardTask = {
      ...currentTask,
      title: currentDraft.title.trim(),
      description: currentDraft.description?.trim() ?? "",
      dueDate: currentDraft.dueDate ? new Date(currentDraft.dueDate).toISOString() : undefined,
      assigneeId: isPersonalBoard ? null : currentDraft.assigneeId?.trim() || null,
      priority: currentDraft.priority,
      moods: currentDraft.moods,
      urgency: currentDraft.urgency,
      energy: currentDraft.energy,
      teamMembers: currentDraft.teamMembers,
      tags: currentDraft.tags,
      updatedAt: nowIso,
    };

    Promise.resolve(onSubmit(updatedTask))
      .then(() => {
        setError(null);
        onOpenChange(false);
      })
      .catch((submitError) => {
        console.error("task-editor:submit", submitError);
        setError(submitError instanceof Error ? submitError.message : "Failed to update task");
      });
  }

  function handleTeamMemberSelect(value: string) {
    if (value === "placeholder") {
      setTeamMemberSelectValue("placeholder");
      return;
    }
    const selected = rosterOptions.find((member) => member.id === value);
    if (!selected) return;

    updateDraft((prev) => {
      if (prev.teamMembers.some((member) => member.id === selected.id)) {
        return prev;
      }
      return {
        ...prev,
        teamMembers: [
          ...prev.teamMembers,
          {
            name: selected.name,
            id: selected.id,
            initials: initialsFromName(selected.name),
          },
        ],
      };
    });
    setTeamMemberSelectValue("placeholder");
  }

  function removeMember(index: number) {
    updateDraft((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, idx) => idx !== index),
    }));
  }

  function toggleMood(mood: TaskMood) {
    updateDraft((prev) => {
      const active = prev.moods.includes(mood);
      return {
        ...prev,
        moods: active ? prev.moods.filter((value) => value !== mood) : [...prev.moods, mood],
      };
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl overflow-hidden border border-slate-200 bg-white/95 shadow-2xl">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-xl font-semibold text-slate-900">Edit task</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Update card details. Changes sync instantly to the moodboard.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="task-title" className="text-sm font-medium text-slate-700">
              Title
            </Label>
            <Input
              id="task-title"
              value={currentDraft.title}
              onChange={(event) => updateDraft((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Give the task a clear name"
              className="border-slate-200 text-slate-900"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="task-description" className="text-sm font-medium text-slate-700">
              Description
            </Label>
            <Textarea
              id="task-description"
              value={currentDraft.description ?? ""}
              onChange={(event) => updateDraft((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Add helpful context"
              className="min-h-[120px] border-slate-200 text-slate-900"
            />
          </div>

          <div className={cn("grid gap-4", !isPersonalBoard && "sm:grid-cols-2")}>
            <div className="grid gap-2">
              <Label htmlFor="task-due" className="text-sm font-medium text-slate-700">
                Due date
              </Label>
              <Input
                id="task-due"
                type="date"
                value={toDateInputValue(currentDraft.dueDate)}
                onChange={(event) =>
                  updateDraft((prev) => ({
                    ...prev,
                    dueDate: event.target.value,
                  }))
                }
                className="border-slate-200 text-slate-900"
              />
            </div>
            {!isPersonalBoard ? (
              <div className="grid gap-2">
                <Label className="text-sm font-medium text-slate-700">Assignee</Label>
                <Select
                  value={assigneeSelectValue}
                  onValueChange={(value) =>
                    updateDraft((prev) => ({
                      ...prev,
                      assigneeId: value === "unassigned" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Choose a teammate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {assigneeOptions.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                        {member.roles.length ? ` — ${member.roles.join(", ")}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!hasAssigneeOptions && (
                  <p className="text-xs text-slate-400">Add teammates in the team settings to assign this task.</p>
                )}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-slate-700">Urgency</Label>
              <Select
                value={currentDraft.urgency}
                onValueChange={(value) =>
                  updateDraft((prev) => ({ ...prev, urgency: value as TaskUrgency }))
                }
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  {urgencyOptions.map((value) => (
                    <SelectItem key={value} value={value} className="capitalize">
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-slate-700">Energy</Label>
              <Select
                value={currentDraft.energy}
                onValueChange={(value) =>
                  updateDraft((prev) => ({ ...prev, energy: value as TaskEnergy }))
                }
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder="Select energy" />
                </SelectTrigger>
                <SelectContent>
                  {energyOptions.map((value) => (
                    <SelectItem key={value} value={value} className="capitalize">
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-slate-700">Priority</Label>
              <Select
                value={currentDraft.priority ?? "med"}
                onValueChange={(value) =>
                  updateDraft((prev) => ({ ...prev, priority: value as MoodboardTask["priority"] }))
                }
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">low</SelectItem>
                  <SelectItem value="med">med</SelectItem>
                  <SelectItem value="high">high</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700">Mood signals</Label>
            <div className="flex flex-wrap gap-2">
              {MOOD_ORDER.map((mood) => {
                const active = currentDraft.moods.includes(mood);
                const config = MOOD_CONFIG[mood];
                return (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => toggleMood(mood)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none",
                      "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                      config.focusRing,
                      active
                        ? cn("bg-gradient-to-r text-white shadow-md border-transparent", config.gradient)
                        : cn(config.soft, "focus-visible:ring-offset-white"),
                    )}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {!isPersonalBoard ? (
            <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Users className="h-4 w-4" />
                Assigned members
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-slate-700">Add teammate</Label>
                  <Badge variant="outline" className="flex items-center gap-1 border-violet-200 text-violet-600">
                    <UserPlus className="h-3.5 w-3.5" />
                    optional
                  </Badge>
                </div>
                <Select
                  value={teamMemberSelectValue}
                  onValueChange={handleTeamMemberSelect}
                  disabled={!availableTeamMembers.length}
                >
                  <SelectTrigger className="border-slate-200 bg-white text-slate-900">
                    <SelectValue
                      placeholder={
                        availableTeamMembers.length ? "Add teammate" : "No teammates available"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder" disabled>
                      {availableTeamMembers.length ? "Choose a teammate" : "No teammates available"}
                    </SelectItem>
                    {availableTeamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                        {member.roles.length ? ` — ${member.roles.join(", ")}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentDraft.teamMembers.length ? (
                  currentDraft.teamMembers.map((member, index) => (
                    <Badge
                      key={`${member.id ?? member.name}-${index}`}
                      variant="secondary"
                      className="flex cursor-pointer items-center gap-2 border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-100"
                      onClick={() => removeMember(index)}
                    >
                      <span>{member.name}</span>
                      {member.initials ? (
                        <span className="text-[10px] uppercase tracking-wide text-slate-500">{member.initials}</span>
                      ) : null}
                    </Badge>
                  ))
                ) : (
                  <span className="flex items-center gap-2 text-xs text-slate-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    No collaborators assigned
                  </span>
                )}
              </div>
            </div>
          ) : null}

          {error ? <p className="text-sm text-rose-500">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave}>
              <Save className="mr-2 h-4 w-4" />
              Save changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


