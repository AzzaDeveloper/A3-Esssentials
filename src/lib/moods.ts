import type { LucideIcon } from "lucide-react";
import { AlertCircle, Brain, Heart, Target, Zap } from "lucide-react";

import type { TaskMood } from "@/lib/types";

export interface MoodTheme {
  value: TaskMood;
  label: string;
  gradient: string;
  soft: string;
  focusRing: string;
  borderColor: string;
  icon: LucideIcon;
}

export const DEFAULT_MOOD: TaskMood = "focused";

export const MOOD_ORDER: TaskMood[] = [
  "energetic",
  "calm",
  "focused",
  "stressed",
  "creative",
  "analytical",
];

export const MOOD_CONFIG: Record<TaskMood, MoodTheme> = {
  energetic: {
    value: "energetic",
    label: "Energetic",
    gradient: "from-orange-400 to-rose-500",
    soft: "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100",
    focusRing: "focus-visible:ring-orange-200",
    borderColor: "border-orange-200",
    icon: Heart,
  },
  calm: {
    value: "calm",
    label: "Calm",
    gradient: "from-sky-400 to-cyan-500",
    soft: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100",
    focusRing: "focus-visible:ring-sky-200",
    borderColor: "border-sky-200",
    icon: Brain,
  },
  focused: {
    value: "focused",
    label: "Focused",
    gradient: "from-violet-400 to-indigo-500",
    soft: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100",
    focusRing: "focus-visible:ring-violet-200",
    borderColor: "border-violet-200",
    icon: Target,
  },
  stressed: {
    value: "stressed",
    label: "Stressed",
    gradient: "from-rose-500 to-pink-600",
    soft: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
    focusRing: "focus-visible:ring-rose-200",
    borderColor: "border-rose-200",
    icon: AlertCircle,
  },
  creative: {
    value: "creative",
    label: "Creative",
    gradient: "from-pink-400 to-fuchsia-500",
    soft: "border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100",
    focusRing: "focus-visible:ring-pink-200",
    borderColor: "border-pink-200",
    icon: Zap,
  },
  analytical: {
    value: "analytical",
    label: "Analytical",
    gradient: "from-emerald-400 to-teal-500",
    soft: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    focusRing: "focus-visible:ring-emerald-200",
    borderColor: "border-emerald-200",
    icon: Brain,
  },
};

export const MOOD_SET = new Set<TaskMood>(MOOD_ORDER);

