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
    colors: "from-orange-500 to-red-500",
    icon: Heart,
    label: "Energetic",
    borderColor: "border-orange-500/20",
  },
  calm: {
    colors: "from-blue-500 to-cyan-500",
    icon: Brain,
    label: "Calm",
    borderColor: "border-blue-500/20",
  },
  focused: {
    colors: "from-purple-500 to-indigo-500",
    icon: Target,
    label: "Focused",
    borderColor: "border-purple-500/20",
  },
  stressed: {
    colors: "from-red-600 to-pink-600",
    icon: AlertCircle,
    label: "Stressed",
    borderColor: "border-red-500/20",
  },
  creative: {
    colors: "from-pink-500 to-rose-500",
    icon: Zap,
    label: "Creative",
    borderColor: "border-pink-500/20",
  },
  analytical: {
    colors: "from-emerald-500 to-teal-500",
    icon: Brain,
    label: "Analytical",
    borderColor: "border-emerald-500/20",
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

function getBadgeClass(value: TaskMood | undefined) {
  switch (value) {
    case "energetic":
      return "bg-orange-600";
    case "calm":
      return "bg-blue-600";
    case "focused":
      return "bg-purple-600";
    case "stressed":
      return "bg-red-700";
    case "creative":
      return "bg-pink-600";
    case "analytical":
      return "bg-emerald-600";
    default:
      return "bg-gray-600";
  }
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
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg border-2",
        primaryMoodSettings.borderColor,
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-2 bg-gradient-to-r", primaryMoodSettings.colors)} />

      <CardHeader className="pb-4 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <h3 className="text-2xl font-bold text-foreground leading-tight">{title}</h3>

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

          <div
            className={cn(
              "flex items-center gap-2 text-white px-4 py-3 rounded-xl shadow-lg",
              getBadgeClass(primaryMood),
            )}
          >
            <Calendar className="w-5 h-5" />
            <div className="text-right">
              <div className="text-xs font-medium opacity-90">Due Date</div>
              <div className="text-sm font-bold">{formattedDueDate}</div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <p className="text-muted-foreground leading-relaxed">{description || "No description provided."}</p>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {teamMembers.length === 0 && (
                <Avatar className="w-8 h-8 border-2 border-background">
                  <AvatarFallback className="text-xs font-medium bg-muted">--</AvatarFallback>
                </Avatar>
              )}
              {teamMembers.map((member, index) => (
                <Avatar key={`${member.id ?? index}-${index}`} className="w-8 h-8 border-2 border-background">
                  <AvatarFallback className="text-xs font-medium bg-muted">{initialsFor(member)}</AvatarFallback>
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
                    "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium shadow-sm text-white",
                    getBadgeClass(mood),
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


