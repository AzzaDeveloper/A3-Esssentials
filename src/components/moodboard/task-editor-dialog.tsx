"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MoodboardTask, TaskEnergy, TaskMember, TaskMood, TaskUrgency } from "@/lib/types";
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
}

interface MemberDraft {
  name: string;
  id: string;
  initials: string;
}

const urgencyOptions: TaskUrgency[] = ["low", "medium", "urgent", "critical"];
const energyOptions: TaskEnergy[] = ["low", "medium", "high"];
const moodOptions: TaskMood[] = ["energetic", "calm", "focused", "stressed", "creative", "analytical"];

function normalizeMemberDraft(draft: MemberDraft): TaskMember | null {
  const name = draft.name.trim();
  if (!name) return null;
  const normalizedId = draft.id.trim();
  return {
    name,
    id: normalizedId || name,
    initials: draft.initials.trim() || undefined,
  };
}

function toDateInputValue(value: string | undefined) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return format(parsed, "yyyy-MM-dd");
}

export function TaskEditorDialog({ open, task, onOpenChange, onSubmit, isPersonalBoard = false }: TaskEditorDialogProps) {
  const [draft, setDraft] = useState<EditableTask | null>(null);
  const [memberDraft, setMemberDraft] = useState<MemberDraft>({ name: "", id: "", initials: "" });
  const [error, setError] = useState<string | null>(null);

  const updateDraft = useCallback((updater: (current: EditableTask) => EditableTask) => {
    setDraft((prev) => (prev ? updater(prev) : prev));
  }, []);

  useEffect(() => {
    if (!open) {
      setDraft(null);
      setMemberDraft({ name: "", id: "", initials: "" });
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
        moods: task.moods?.length ? [...task.moods] : ["focused"],
        urgency: task.urgency ?? "medium",
        energy: task.energy ?? "medium",
        teamMembers: task.teamMembers ? [...task.teamMembers] : [],
        tags: task.tags ? [...task.tags] : [],
        boardId: task.boardId,
        boardElementId: task.boardElementId,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      });
      setMemberDraft({ name: "", id: "", initials: "" });
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
      assigneeId: currentDraft.assigneeId?.trim() || null,
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

  function addMember() {
    const member = normalizeMemberDraft(memberDraft);
    if (!member) {
      setError("Enter a team member name to add");
      return;
    }
    updateDraft((prev) => ({
      ...prev,
      teamMembers: [...prev.teamMembers, member],
    }));
    setMemberDraft({ name: "", id: "", initials: "" });
    setError(null);
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
              className="min-h-[120px] border-slate-200"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
                className="border-slate-200"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-assignee" className="text-sm font-medium text-slate-700">
                Assignee
              </Label>
              <Input
                id="task-assignee"
                value={currentDraft.assigneeId ?? ""}
                onChange={(event) => updateDraft((prev) => ({ ...prev, assigneeId: event.target.value }))}
                placeholder="user@example.com"
                className="border-slate-200"
              />
            </div>
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
              {moodOptions.map((mood) => {
                const active = currentDraft.moods.includes(mood);
                return (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => toggleMood(mood)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                      active
                        ? "bg-slate-900 text-white shadow"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    {mood}
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
              <div className="grid gap-3 md:grid-cols-[2fr_2fr_minmax(0,1fr)]">
                <Input
                  value={memberDraft.name}
                  onChange={(event) => setMemberDraft((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Display name"
                  className="border-slate-200"
                />
                <Input
                  value={memberDraft.id}
                  onChange={(event) => setMemberDraft((prev) => ({ ...prev, id: event.target.value }))}
                  placeholder="Member id"
                  className="border-slate-200"
                />
                <div className="flex gap-2">
                  <Input
                    value={memberDraft.initials}
                    onChange={(event) => setMemberDraft((prev) => ({ ...prev, initials: event.target.value }))}
                    placeholder="Initials"
                    className="max-w-[96px] border-slate-200"
                  />
                  <Button type="button" variant="outline" onClick={addMember} className="whitespace-nowrap">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentDraft.teamMembers.length ? (
                  currentDraft.teamMembers.map((member, index) => (
                    <Badge
                      key={`${member.name}-${index}`}
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
