import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Zap, AlertTriangle, Brain, Heart, Target, AlertCircle, LucideIcon } from "lucide-react";
import type { Task, TaskEnergy, TaskMember, TaskMood, TaskUrgency } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface TaskCardProps {
  task: Task & {
    moods: TaskMood[];
    urgency: TaskUrgency;
    energy: TaskEnergy;
    teamMembers: TaskMember[];
    dueDate?: string;
  };
}

const moodConfig: Record<TaskMood, { colors: string; icon: LucideIcon; label: string; borderColor: string }> = {
  energetic: {
    colors: "from-orange-400 to-rose-500",
    icon: Heart,
    label: "Energetic",
    borderColor: "border-orange-200",
  },
  calm: {
    colors: "from-sky-400 to-cyan-500",
    icon: Brain,
    label: "Calm",
    borderColor: "border-sky-200",
  },
  focused: {
    colors: "from-violet-400 to-indigo-500",
    icon: Target,
    label: "Focused",
    borderColor: "border-violet-200",
  },
  stressed: {
    colors: "from-rose-500 to-pink-600",
    icon: AlertCircle,
    label: "Stressed",
    borderColor: "border-rose-200",
  },
  creative: {
    colors: "from-pink-400 to-fuchsia-500",
    icon: Zap,
    label: "Creative",
    borderColor: "border-pink-200",
  },
  analytical: {
    colors: "from-emerald-400 to-teal-500",
    icon: Brain,
    label: "Analytical",
    borderColor: "border-emerald-200",
  },
};

const urgencyConfig: Record<TaskUrgency, { color: string; label: string }> = {
  low: { color: "bg-green-100 text-green-800 border-green-300", label: "LOW" },
  medium: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "MEDIUM" },
  urgent: { color: "bg-orange-100 text-orange-800 border-orange-300", label: "URGENT" },
  critical: { color: "bg-red-100 text-red-800 border-red-300", label: "CRITICAL" },
};

const energyConfig: Record<TaskEnergy, { color: string; label: string }> = {
  low: { color: "bg-slate-100 text-slate-800 border-slate-300", label: "LOW ENERGY" },
  medium: { color: "bg-blue-100 text-blue-800 border-blue-300", label: "MEDIUM ENERGY" },
  high: { color: "bg-orange-100 text-orange-800 border-orange-300", label: "HIGH ENERGY" },
};

const fallbackMood: TaskMood = "focused";

function getGradientMood(mood: TaskMood | undefined) {
  return mood ? moodConfig[mood] ?? moodConfig[fallbackMood] : moodConfig[fallbackMood];
}

function getMoodBadgeClass(value: TaskMood | undefined) {
  const moodSettings = getGradientMood(value);
  return cn("bg-gradient-to-r text-white shadow-md", moodSettings.colors);
}

function initialsFor(member: TaskMember) {
  if (member.initials && member.initials.trim().length > 0) return member.initials.trim().slice(0, 3).toUpperCase();
  const parts = member.name.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function TaskCard({ task }: TaskCardProps) {
  const {
    title,
    description = "",
    dueDate,
    teamMembers = [],
    moods = [fallbackMood],
    urgency = "medium",
    energy = "medium",
  } = task;

  const primaryMood = moods[0] ?? fallbackMood;
  const primaryMoodSettings = getGradientMood(primaryMood);
  const urgencySettings = urgencyConfig[urgency] ?? urgencyConfig.medium;
  const energySettings = energyConfig[energy] ?? energyConfig.medium;
  const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "No due date";

  return (
    <Card
      className={cn(
        "relative overflow-hidden bg-white text-slate-900 transition-all duration-300 border",
        "shadow-sm hover:shadow-xl",
        primaryMoodSettings.borderColor,
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-2 bg-gradient-to-r", primaryMoodSettings.colors)} />

      <CardHeader className="pb-4 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <h3 className="text-2xl font-bold text-slate-900 leading-tight">{title}</h3>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={cn("font-medium", energySettings.color)}>
                <Zap className="w-3 h-3 mr-1" />
                {energySettings.label}
              </Badge>
              <Badge variant="outline" className={cn("font-medium", urgencySettings.color)}>
                <AlertTriangle className="w-3 h-3 mr-1" />
                {urgencySettings.label}
              </Badge>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden">
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-r",
                primaryMoodSettings.colors,
              )}
            />
            <div className="absolute inset-0 bg-slate-950/25 backdrop-blur-md border border-white/30" />
            <div className="relative flex items-center gap-3 px-4 py-3 text-white">
              <Calendar className="w-5 h-5" />
              <div className="text-right">
                <div className="text-xs font-medium uppercase tracking-wide opacity-90">Due Date</div>
                <div className="text-sm font-semibold">{formattedDueDate}</div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <p className="text-slate-600 leading-relaxed">{description || "No description provided."}</p>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {teamMembers.length === 0 && (
                <Avatar className="w-8 h-8 border-2 border-background">
                  <AvatarFallback className="text-xs font-medium bg-white text-slate-600 border border-slate-200">--</AvatarFallback>
                </Avatar>
              )}
              {teamMembers.map((member, index) => (
                <Avatar key={`${member.id ?? index}-${index}`} className="w-8 h-8 border-2 border-background">
                  <AvatarFallback className="text-xs font-medium bg-white text-slate-600 border border-slate-200">
                    {initialsFor(member)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {moods.map((mood, index) => {
              const moodSettings = getGradientMood(mood);
              const MoodIcon = moodSettings.icon;

              return (
                <div
                  key={`${mood}-${index}`}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-white",
                    getMoodBadgeClass(mood),
                  )}
                >
                  <MoodIcon className="w-4 h-4" />
                  <span>{moodSettings.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
