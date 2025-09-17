export type ThemePreference = "system" | "light" | "dark";

// Preferences controlling whether/how a user receives notifications

export interface UserNotificationState {
  unreadCount: number;
  lastReadAt?: string | null;
}

export interface UserNotification {
  id: string;
  type: string; // e.g., "assignment", "comment", "system"
  title: string;
  body?: string;
  level?: "info" | "success" | "warning" | "error";
  action?: { label: string; href: string };
  meta?: Record<string, any>;
  createdAt: string;
  readAt?: string | null;
}

export type UserRole = "user" | "paid1" | "paid2" | "admin";

export interface UserProfile {
  // Identity
  id: string; // Firebase UID (doc id)
  email: string;
  displayName: string;
  photoURL?: string | null;

  // Public profile
  // Unique user tag/handle for public profile URLs (e.g., /user/<tag>)
  tag?: string | null;
  bio?: string;

  // Preferences
  preferences: {
    theme: ThemePreference;
  };

  notificationState?: UserNotificationState;

  // Access and plan role
  role: UserRole;

  // Meta
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  schemaVersion: number; // for safe migrations
}

export const USER_SCHEMA_VERSION = 1 as const;

// Teams
export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: string[];
  role?: Record<string, string[]>;
  teamRole?: Record<string, string[]>;
  memberCount: number;
  isPublic?: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export type TeamInviteStatus = "pending" | "accepted" | "declined" | "expired";

export interface TeamInvitation {
  id: string;
  teamId: string;
  inviteeId: string;
  inviterId: string;
  status: TeamInviteStatus;
  createdAt: string; // ISO
}

// Moodboards
export type Facet = "focus" | "energy" | "social" | "calm";

export interface Moodboard {
  id: string;
  name: string;
  type: "personal" | "team";
  ownerName: string;
  teamId?: string;
  teamName?: string;
  tags?: string[];
  updatedAt: string; // ISO
  coverUrl?: string | null;
  facets?: Partial<Record<Facet, number>>; // -1..1, optional for preview
  participants?: Array<{
    id: string;
    name: string;
    avatarUrl?: string | null;
  }>;
  previewUrls?: string[]; // small live preview thumbnails
}

export interface MoodProfile {
  memberId: string;
  facets: Record<Facet, number>; // -1..1
  confidence?: Partial<Record<Facet, number>>;
  updatedAt: string;
}

export type TaskMood = "energetic" | "calm" | "focused" | "stressed" | "creative" | "analytical";
export type TaskUrgency = "low" | "medium" | "urgent" | "critical";
export type TaskEnergy = "low" | "medium" | "high";

export interface TaskMember {
  id: string;
  name: string;
  initials?: string;
  avatarUrl?: string | null;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  priority?: "low" | "med" | "high";
  assigneeId?: string | null;
  dueDate?: string;
  moods?: TaskMood[];
  urgency?: TaskUrgency;
  energy?: TaskEnergy;
  teamMembers?: TaskMember[];
  boardId?: string;
  boardElementId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssignmentScore {
  fit: number;
  load: number;
  mood_fit: number;
  fairness: number;
}

export interface MoodboardTask extends Task {
  moods: TaskMood[];
  urgency: TaskUrgency;
  energy: TaskEnergy;
  teamMembers: TaskMember[];
  boardId: string;
  boardElementId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MoodboardElement {
  id: string;
  type: "task";
  x: number;
  y: number;
  w?: number;
  h?: number;
  task: MoodboardTask;
  color?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

