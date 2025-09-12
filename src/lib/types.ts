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
