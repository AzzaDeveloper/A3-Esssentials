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
