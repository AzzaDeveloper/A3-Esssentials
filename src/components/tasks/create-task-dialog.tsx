"use client";

import { useMemo, useState, type FormEvent } from "react";
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
import type { Task, TaskEnergy, TaskMember, TaskMood, TaskUrgency } from "@/lib/types";
import { AlertCircle, Plus, Sparkles, UserPlus } from "lucide-react";

type CreateTaskMode = "natural" | "manual";

export interface CreateTaskDialogProps {
  triggerLabel?: string;
  triggerClassName?: string;
  onManualCreate?: (taskDraft: ManualTaskFormState) => void | Promise<void>;
  isPersonalBoard?: boolean;
}

export interface ManualTaskFormState {
  title: string;
  description: string;
  tags: string[];
  priority: Task["priority"];
  assigneeId: string;
  dueDate: string;
  urgency: TaskUrgency;
  energy: TaskEnergy;
  moods: TaskMood[];
  teamMembers: Array<
    Pick<TaskMember, "name"> & Partial<Pick<TaskMember, "id" | "initials">>
  >;
  createdAt: string;
  updatedAt: string;
}

const moodStyles: Record<
  TaskMood,
  {
    label: string;
    gradient: string;
    soft: string;
    focus: string;
  }
> = {
  energetic: {
    label: "Energetic",
    gradient: "from-orange-400 to-rose-500",
    soft: "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100",
    focus: "focus-visible:ring-orange-200",
  },
  calm: {
    label: "Calm",
    gradient: "from-sky-400 to-cyan-500",
    soft: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100",
    focus: "focus-visible:ring-sky-200",
  },
  focused: {
    label: "Focused",
    gradient: "from-violet-400 to-indigo-500",
    soft: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100",
    focus: "focus-visible:ring-violet-200",
  },
  stressed: {
    label: "Stressed",
    gradient: "from-rose-500 to-pink-600",
    soft: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
    focus: "focus-visible:ring-rose-200",
  },
  creative: {
    label: "Creative",
    gradient: "from-pink-400 to-fuchsia-500",
    soft: "border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100",
    focus: "focus-visible:ring-pink-200",
  },
  analytical: {
    label: "Analytical",
    gradient: "from-emerald-400 to-teal-500",
    soft: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    focus: "focus-visible:ring-emerald-200",
  },
};

const moodOptions: TaskMood[] = ["energetic", "calm", "focused", "stressed", "creative", "analytical"];

const initialManualState: ManualTaskFormState = {
  title: "",
  description: "",
  tags: [],
  priority: "med",
  assigneeId: "",
  dueDate: "",
  urgency: "medium",
  energy: "medium",
  moods: ["focused"],
  teamMembers: [],
  createdAt: "",
  updatedAt: "",
};

export function CreateTaskDialog({
  triggerLabel = "New Task",
  triggerClassName,
  onManualCreate,
  isPersonalBoard = false,
}: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CreateTaskMode>("manual");
  const [naturalDraft, setNaturalDraft] = useState("");
  const [manualState, setManualState] = useState<ManualTaskFormState>(initialManualState);
  const [memberName, setMemberName] = useState("");
  const [memberId, setMemberId] = useState("");
  const [memberInitials, setMemberInitials] = useState("");

  const manualIsSubmittable = useMemo(() => manualState.title.trim().length > 0, [manualState.title]);
  const showTeamMembers = !isPersonalBoard;

  function resetForm() {
    setManualState(initialManualState);
    setNaturalDraft("");
    setMemberName("");
    setMemberId("");
    setMemberInitials("");
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

  function addTeamMember() {
    const name = memberName.trim();
    if (!name) return;
    setManualState((prev) => ({
      ...prev,
      teamMembers: [
        ...prev.teamMembers,
        {
          name,
          id: memberId.trim() || undefined,
          initials: memberInitials.trim() || undefined,
        },
      ],
    }));
    setMemberName("");
    setMemberId("");
    setMemberInitials("");
  }

  function removeTeamMember(index: number) {
    setManualState((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, idx) => idx !== index),
    }));
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
                  Describe the task in plain language. We'll translate this into structured work soon.
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
                    <div className="font-medium text-slate-800">AI assist is in preview</div>
                    <p>Share context now while automatic task drafts finish training.</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 text-violet-500" />
                    Generation is coming soon.
                  </span>
                  <Button type="button" variant="secondary" disabled>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate task (soon)
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
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700">Mood signals</Label>
                    <div className="flex flex-wrap gap-2">
                      {moodOptions.map((mood) => {
                        const active = manualState.moods.includes(mood);
                        const { gradient, label, soft, focus } = moodStyles[mood];
                        return (
                          <button
                            key={mood}
                            type="button"
                            onClick={() => toggleMood(mood)}
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none",
                              "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                              focus,
                              active
                                ? cn("bg-gradient-to-r text-white shadow-md border-transparent", gradient)
                                : cn(soft, "focus-visible:ring-offset-white"),
                            )}
                          >
                            {label}
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
                      <div className="grid gap-2 md:grid-cols-[2fr_2fr_minmax(0,1fr)]">
                        <Input
                          value={memberName}
                          onChange={(event) => setMemberName(event.target.value)}
                          placeholder="Display name"
                          className="border-slate-200"
                        />
                        <Input
                          value={memberId}
                          onChange={(event) => setMemberId(event.target.value)}
                          placeholder="Member id / email"
                          className="border-slate-200"
                        />
                        <div className="flex gap-2">
                          <Input
                            value={memberInitials}
                            onChange={(event) => setMemberInitials(event.target.value)}
                            placeholder="Initials"
                            className="border-slate-200 max-w-[96px]"
                          />
                          <Button type="button" variant="outline" onClick={addTeamMember} className="whitespace-nowrap">
                            Add
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {manualState.teamMembers.map((member, index) => (
                          <Badge
                            key={`${member.name}-${index}`}
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
