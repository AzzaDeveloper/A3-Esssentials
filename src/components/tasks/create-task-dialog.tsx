"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { generateTaskDraft } from "@/app/(actions)/tasks";
import { DEFAULT_MOOD, MOOD_CONFIG, MOOD_ORDER } from "@/lib/moods";
import type { TaskDraft, TaskMood, TeamMemberContext } from "@/lib/types";
import { AlertCircle, Loader2, Plus, Sparkles, UserPlus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CreateTaskMode = "natural" | "manual";

export interface CreateTaskDialogProps {
  triggerLabel?: string;
  triggerClassName?: string;
  onManualCreate?: (taskDraft: ManualTaskFormState) => void | Promise<void>;
  isPersonalBoard?: boolean;
  teamMembers?: TeamMemberContext[];
}

export type ManualTaskFormState = TaskDraft;


const initialManualState: ManualTaskFormState = {
  title: "",
  description: "",
  tags: [],
  priority: "med",
  assigneeId: "",
  dueDate: "",
  urgency: "medium",
  energy: "medium",
  moods: [DEFAULT_MOOD],
  teamMembers: [],
  createdAt: "",
  updatedAt: "",
};

export function CreateTaskDialog({
  triggerLabel = "New Task",
  triggerClassName,
  onManualCreate,
  isPersonalBoard = false,
  teamMembers = [],
}: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CreateTaskMode>("manual");
  const [naturalDraft, setNaturalDraft] = useState("");
  const [manualState, setManualState] = useState<ManualTaskFormState>(initialManualState);
  const [isGenerating, startGenerating] = useTransition();
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [teamMemberSelectValue, setTeamMemberSelectValue] = useState("placeholder");

  const teamMemberPayload = useMemo(
    () =>
      teamMembers.map((member) => ({
        id: member.id,
        name: member.name,
        roles: Array.isArray(member.roles) ? member.roles : [],
        email: member.email ?? undefined,
        tag: member.tag ?? undefined,
      })),
    [teamMembers],
  );

  const manualIsSubmittable = useMemo(() => manualState.title.trim().length > 0, [manualState.title]);
  const naturalIsSubmittable = useMemo(() => naturalDraft.trim().length >= 8, [naturalDraft]);
  const showTeamMembers = !isPersonalBoard;
  const showAssigneeField = !isPersonalBoard;
  const hasTeamMembers = teamMemberPayload.length > 0;
  const assigneeSelectValue = manualState.assigneeId.trim().length ? manualState.assigneeId : "unassigned";

  useEffect(() => {
    if (isPersonalBoard) {
      setManualState((prev) => (prev.assigneeId ? { ...prev, assigneeId: "" } : prev));
    }
  }, [isPersonalBoard]);

  function resetForm() {
    setManualState(initialManualState);
    setNaturalDraft("");
    setTeamMemberSelectValue("placeholder");
    setGenerationError(null);
    setMode("manual");
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      resetForm();
    }
  }

  function toggleMood(mood: TaskMood) {
    setManualState((prev) => {
      const active = prev.moods.includes(mood);
      return {
        ...prev,
        moods: active ? prev.moods.filter((value) => value !== mood) : [...prev.moods, mood],
      };
    });
  }

  function removeTeamMember(index: number) {
    setManualState((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, idx) => idx !== index),
    }));
  }

  const availableTeamMembers = useMemo(
    () =>
      teamMemberPayload.filter(
        (member) => !manualState.teamMembers.some((entry) => entry.id && entry.id === member.id),
      ),
    [manualState.teamMembers, teamMemberPayload],
  );

  function initialsFromName(name: string) {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 0) return undefined;
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  function handleTeamMemberSelect(value: string) {
    if (value === "placeholder") {
      setTeamMemberSelectValue("placeholder");
      return;
    }
    const selected = teamMemberPayload.find((member) => member.id === value);
    if (!selected) return;
    setManualState((prev) => {
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

  function handleNaturalGenerate() {
    if (!naturalIsSubmittable) {
      return;
    }

    startGenerating(() => {
      setGenerationError(null);
      const prompt = naturalDraft.trim();

      void (async () => {
        try {
          const generatedDraft = await generateTaskDraft({
            prompt,
            isPersonalBoard,
            teamMembers: teamMemberPayload,
          });

          if (onManualCreate) {
            await onManualCreate(generatedDraft);
            setOpen(false);
            resetForm();
          } else {
            setManualState(generatedDraft);
            setMode("manual");
            setNaturalDraft("");
          }
        } catch (error) {
          console.error("create-task-dialog:natural", error);
          setGenerationError(error instanceof Error ? error.message : "Failed to generate task draft.");
        }
      })();
    });
  }
  async function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manualIsSubmittable) {
      return;
    }
    if (onManualCreate) {
      await onManualCreate(manualState);
    }
    setOpen(false);
    resetForm();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className={cn("min-w-[160px]", triggerClassName)}>
          <Plus className="mr-2 h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl overflow-hidden border border-slate-200 bg-gradient-to-b from-white via-white to-slate-50 shadow-2xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl font-semibold text-slate-900">Create a task</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Choose the quickest way to capture work. Manual details are ready now; AI briefs are on the way.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(value) => setMode(value as CreateTaskMode)} className="space-y-6">
          <TabsList className="w-full grid-cols-2 rounded-md border border-slate-200 bg-slate-100/80 p-1 text-slate-600">
            <TabsTrigger
              value="natural"
              className="rounded-md px-3 py-1.5 text-sm font-medium transition data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              AI brief
            </TabsTrigger>
            <TabsTrigger
              value="manual"
              className="rounded-md px-3 py-1.5 text-sm font-medium transition data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              Manual form
            </TabsTrigger>
          </TabsList>

          <TabsContent value="natural" className="space-y-4">
            <Card className="relative overflow-hidden border border-slate-200 bg-white/95 shadow-lg">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-300 via-indigo-300 to-blue-300" />
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">Natural language</CardTitle>
                <p className="text-sm text-slate-500">
                  Describe the task in plain language. We'll translate this into structured work automatically.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                  <Textarea
                    value={naturalDraft}
                    onChange={(event) => setNaturalDraft(event.target.value)}
                    placeholder="e.g., Capture the beta feedback and assign follow-ups by Thursday."
                    className="min-h-[160px] border border-slate-200 text-slate-900 shadow-inner"
                  />
                  <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50/90 p-3 text-sm text-slate-600">
                    <Sparkles className="mt-0.5 h-4 w-4 text-violet-500" />
                    <div className="space-y-1">
                      <div className="font-medium text-slate-800">Describe what needs to happen</div>
                      <p>Mention deliverables, timing, collaborators, and any mood cues for the assignee.</p>
                    </div>
                  </div>
                  {generationError ? (
                    <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50/90 p-3 text-sm text-rose-600">
                      <AlertCircle className="mt-0.5 h-4 w-4" />
                      <div>{generationError}</div>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 text-left">
                      <AlertCircle className="h-3.5 w-3.5 text-violet-500" />
                      We will structure the task for you. Include due dates or teammates when you know them.
                    </span>
                    <Button
                      type="button"
                      onClick={handleNaturalGenerate}
                      disabled={!naturalIsSubmittable || isGenerating}
                      className="whitespace-nowrap"
                    >
                      {isGenerating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      {isGenerating ? "Generating..." : "Generate task"}
                    </Button>
                  </div>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual">
            <Card className="relative overflow-hidden border border-slate-200 bg-white/95 shadow-lg">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">Manual details</CardTitle>
                <p className="text-sm text-slate-500">Provide the essentials to capture a task. You can enrich it later.</p>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={handleManualSubmit}>
                  <div className="grid gap-2">
                    <Label htmlFor="task-title" className="text-sm font-medium text-slate-700">
                      Title
                    </Label>
                    <Input
                      id="task-title"
                      value={manualState.title}
                      onChange={(event) =>
                        setManualState((prev) => ({
                          ...prev,
                          title: event.target.value,
                        }))
                      }
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
                      value={manualState.description}
                      onChange={(event) =>
                        setManualState((prev) => ({
                          ...prev,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Outline context, links, or acceptance criteria"
                      className="min-h-[140px] border border-slate-200 text-slate-900"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="task-due-date" className="text-sm font-medium text-slate-700">
                        Due date
                      </Label>
                      <Input
                        id="task-due-date"
                        type="date"
                        value={manualState.dueDate}
                        onChange={(event) =>
                          setManualState((prev) => ({
                            ...prev,
                            dueDate: event.target.value,
                          }))
                        }
                        className="border-slate-200 text-slate-700"
                      />
                    </div>
                    {showAssigneeField ? (
                      <div className="grid gap-2">
                        <Label className="text-sm font-medium text-slate-700">Assignee</Label>
                        <Select
                          value={assigneeSelectValue}
                          onValueChange={(value) =>
                            setManualState((prev) => ({
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
                            {teamMemberPayload.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.name}
                                {member.roles.length ? ` — ${member.roles.join(", ")}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!hasTeamMembers && (
                          <p className="text-xs text-slate-400">
                            Add teammates to the team in order to assign tasks.
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700">Mood signals</Label>
                    <div className="flex flex-wrap gap-2">
                      {MOOD_ORDER.map((mood) => {
                        const active = manualState.moods.includes(mood);
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
                  {showTeamMembers ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium text-slate-700">Team members</Label>
                        <Badge variant="outline" className="flex items-center gap-1 border-violet-200 text-violet-600">
                          <UserPlus className="h-3.5 w-3.5" />
                          optional
                        </Badge>
                      </div>
                      <Select value={teamMemberSelectValue} onValueChange={handleTeamMemberSelect}>
                        <SelectTrigger className="border-slate-200">
                          <SelectValue placeholder={availableTeamMembers.length ? "Add teammate" : "No teammates available"} />
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
                      <div className="flex flex-wrap gap-2">
                        {manualState.teamMembers.map((member, index) => (
                          <Badge
                            key={`${member.id ?? member.name}-${index}`}
                            variant="secondary"
                            className="flex cursor-pointer items-center gap-2 border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-100"
                            onClick={() => removeTeamMember(index)}
                          >
                            <span>{member.name}</span>
                            {member.initials ? (
                              <span className="text-[10px] uppercase tracking-wide text-slate-500">{member.initials}</span>
                            ) : null}
                          </Badge>
                        ))}
                        {!manualState.teamMembers.length && (
                          <span className="text-xs text-slate-400">No collaborators yet</span>
                        )}
                      </div>
                    </div>
                  ) : null}
                  <DialogFooter className="pt-2">
                    <Button type="submit" disabled={!manualIsSubmittable}>
                      Create task
                    </Button>
                  </DialogFooter>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
