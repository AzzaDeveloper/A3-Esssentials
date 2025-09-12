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
    tag: null,
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
    tag: (data.tag as string | null) ?? null,
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
    tag: (data.tag as string | null) ?? null,
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

// Tag utilities
export function normalizeTag(input: string): string {
  const lower = (input || "").toLowerCase();
  // allow a-z, 0-9, underscore, dot, hyphen; collapse spaces to hyphen
  const collapsed = lower.trim().replace(/\s+/g, "-");
  return collapsed.replace(/[^a-z0-9._-]/g, "").replace(/-+/g, "-").replace(/^[-._]+|[-._]+$/g, "");
}

export function isValidTag(tag: string): boolean {
  if (!tag) return false;
  if (tag.length < 3 || tag.length > 30) return false;
  return /^[a-z0-9._-]+$/.test(tag);
}

export function suggestTagFrom(displayName?: string | null, email?: string | null): string | null {
  const namePart = (displayName || "").trim() || (email || "").split("@")[0] || "";
  const base = normalizeTag(namePart);
  return base || null;
}

export async function claimUserTag(uid: string, rawTag: string): Promise<UserProfile> {
  const { app } = firebaseAdmin();
  const db = getFirestore(app);
  const tag = normalizeTag(rawTag);
  if (!isValidTag(tag)) throw new Error("invalid_tag");

  await db.runTransaction(async (tx) => {
    const tagRef = db.collection("user_tags").doc(tag);
    const userRef = db.collection("users").doc(uid);
    const tagDoc = await tx.get(tagRef);
    if (tagDoc.exists && tagDoc.data()?.uid !== uid) {
      throw new Error("tag_taken");
    }
    tx.set(tagRef, { uid, createdAt: Timestamp.now() }, { merge: true });
    tx.set(userRef, { tag, updatedAt: Timestamp.now() }, { merge: true });
  });

  const updated = await getUserProfile(uid);
  if (!updated) throw new Error("profile_missing");
  return updated;
}

export async function ensureUserTag(uid: string, displayName?: string | null, email?: string | null): Promise<string | null> {
  const base = suggestTagFrom(displayName, email);
  if (!base) return null;

  const { app } = firebaseAdmin();
  const db = getFirestore(app);
  // try base + suffixes up to 10 attempts
  for (let i = 0; i < 10; i++) {
    const candidate = i === 0 ? base : `${base}${i}`;
    const tagRef = db.collection("user_tags").doc(candidate);
    const doc = await tagRef.get();
    if (!doc.exists) {
      try {
        await claimUserTag(uid, candidate);
        return candidate;
      } catch (e) {
        // continue trying on race
      }
    }
  }
  return null;
}
