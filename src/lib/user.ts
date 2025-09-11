import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { firebaseAdmin } from "@/lib/firebase-admin";
import type { UserProfile, USER_SCHEMA_VERSION } from "@/lib/types";

type SchemaVersion = typeof USER_SCHEMA_VERSION;

function nowIso() {
  return new Date().toISOString();
}

function tsToIso(v: any): string | undefined {
  if (!v) return undefined;
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v?.toDate === "function") return v.toDate().toISOString();
  if (typeof v === "string") return v;
  return undefined;
}

export function defaultUserProfile(params: {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
}): UserProfile {
  return {
    id: params.uid,
    email: params.email,
    displayName: params.displayName || params.email.split("@")[0] || "",
    photoURL: params.photoURL ?? null,
    bio: "",
    preferences: { theme: "system" },
    role: "user",
    notificationState: { unreadCount: 0, lastReadAt: null },
    createdAt: nowIso(),
    updatedAt: nowIso(),
    schemaVersion: 1 as SchemaVersion,
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const { app, adminAuth } = firebaseAdmin();
  const db = getFirestore(app);
  const ref = db.collection("users").doc(uid);
  let snap = await ref.get();

  if (!snap.exists) {
    // Create a minimal profile from Admin Auth and persist
    let email = "";
    let displayName: string | null = null;
    let photoURL: string | null = null;
    try {
      const authUser = await adminAuth.getUser(uid);
      email = authUser.email || "";
      displayName = authUser.displayName || null;
      photoURL = (authUser.photoURL as string | null) || null;
    } catch {}

    const serverTime = Timestamp.now();
    const profile = defaultUserProfile({ uid, email, displayName, photoURL });
    await ref.set(
      {
        ...profile,
        createdAt: serverTime,
        updatedAt: serverTime,
      },
      { merge: true }
    );
    // re-read to build normalized return
    snap = await ref.get();
  }

  const data = snap.data() as any;
  // Build a safe, minimally-typed object with defaults and conversions
  const profile: UserProfile = {
    id: uid,
    email: data.email ?? "",
    displayName: data.displayName ?? "",
    photoURL: data.photoURL ?? null,
    bio: data.bio ?? "",
    preferences: {
      theme: (data.preferences?.theme as UserProfile["preferences"]["theme"]) ?? "system",
    },
    role: (data.role as any) ?? "user",
    notificationState: {
      unreadCount: data.notificationState?.unreadCount ?? 0,
      lastReadAt: tsToIso(data.notificationState?.lastReadAt) ?? null,
    },
    createdAt: tsToIso(data.createdAt) || nowIso(),
    updatedAt: tsToIso(data.updatedAt) || nowIso(),
    schemaVersion: (data.schemaVersion as number) ?? 1,
  };
  return profile;
}

export async function upsertUserProfile(
  uid: string,
  patch: Partial<Pick<UserProfile, "displayName" | "photoURL" | "bio" | "preferences" | "notificationState" | "email" | "role">>
): Promise<UserProfile> {
  const { app } = firebaseAdmin();
  const db = getFirestore(app);
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();

  const serverTime = Timestamp.now();

  if (!snap.exists) {
    const base = defaultUserProfile({
      uid,
      email: patch.email || "",
      displayName: patch.displayName || null,
      photoURL: patch.photoURL ?? null,
    });
    await ref.set(
      {
        ...base,
        createdAt: serverTime,
        updatedAt: serverTime,
        schemaVersion: 1 as SchemaVersion,
      },
      { merge: true }
    );
  }

  // Only allow expected fields to be updated; ignore unknowns for forward/backward compatibility
  const allowed: any = {};
  if (typeof patch.displayName === "string") allowed.displayName = patch.displayName;
  if (typeof patch.bio === "string") allowed.bio = patch.bio;
  if (typeof patch.photoURL !== "undefined") allowed.photoURL = patch.photoURL;
  if (patch.email) allowed.email = patch.email;
  if (patch.preferences) {
    allowed.preferences = {};
    if (patch.preferences.theme) allowed.preferences.theme = patch.preferences.theme;
  }
  if (typeof (patch as any).role === "string") {
    const nextRole = (patch as any).role;
    const allowedRoles = ["user", "paid1", "paid2", "admin"] as const;
    if ((allowedRoles as readonly string[]).includes(nextRole)) {
      allowed.role = nextRole;
    }
  }
  if (patch.notificationState) {
    allowed.notificationState = {};
    if (typeof patch.notificationState.unreadCount === "number") allowed.notificationState.unreadCount = patch.notificationState.unreadCount;
    if (typeof patch.notificationState.lastReadAt !== "undefined") allowed.notificationState.lastReadAt = patch.notificationState.lastReadAt;
  }

  await ref.set(
    {
      ...allowed,
      updatedAt: serverTime,
      schemaVersion: 1 as SchemaVersion,
    },
    { merge: true }
  );

  const updated = await ref.get();
  const data = updated.data() as any;
  return {
    id: uid,
    email: data.email ?? "",
    displayName: data.displayName ?? "",
    photoURL: data.photoURL ?? null,
    bio: data.bio ?? "",
    preferences: { theme: data.preferences?.theme ?? "system" },
    role: (data.role as any) ?? "user",
    notificationState: {
      unreadCount: data.notificationState?.unreadCount ?? 0,
      lastReadAt: tsToIso(data.notificationState?.lastReadAt) ?? null,
    },
    createdAt: tsToIso(data.createdAt) || nowIso(),
    updatedAt: tsToIso(data.updatedAt) || nowIso(),
    schemaVersion: (data.schemaVersion as number) ?? 1,
  };
}
