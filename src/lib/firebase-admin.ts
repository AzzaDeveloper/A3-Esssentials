import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getDatabase, type Database } from "firebase-admin/database";
import fs from "node:fs";
import path from "node:path";

let app: App;
let adminAuth: Auth;
let adminDb: Firestore;
let adminRtdb: Database;
let adminDbUrl: string | undefined;

interface ServiceAccountLike {
  project_id?: string;
  client_email?: string;
  private_key?: string;
  databaseURL?: string;
}

function loadServiceAccountFromFile(): ServiceAccountLike | null {
  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const filePath = configuredPath || path.join(process.cwd(), ".env.firebase-admin.json");
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const json = JSON.parse(raw);
  return json;
}

function loadServiceAccountFromEnv(): ServiceAccountLike | null {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  //
  if (!projectId) {
    console.warn("[firebase-admin] Missing FIREBASE_PROJECT_ID env variable.");
  }
  if (!clientEmail) {
    console.warn("[firebase-admin] Missing FIREBASE_CLIENT_EMAIL env variable.");
  }
  if (!privateKey) {
    console.warn("[firebase-admin] Missing FIREBASE_PRIVATE_KEY env variable. Note that this is different from the FIREBASE_API_KEY_ID.");
  }
  //
  if (!projectId || !clientEmail || !privateKey) return null;
  privateKey = privateKey.replace(/\\n/g, "\n");
  return { project_id: projectId, client_email: clientEmail, private_key: privateKey };
}

export function firebaseAdmin() {
  if (!getApps().length) {
    const fileCred = loadServiceAccountFromFile();
    const envCred = fileCred || loadServiceAccountFromEnv();
    const projectId = envCred?.project_id || process.env.FIREBASE_PROJECT_ID;
    const clientEmail = envCred?.client_email || process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = envCred?.private_key || process.env.FIREBASE_PRIVATE_KEY;
    adminDbUrl =
      process.env.NEXT_PUBLIC_FB_DB_URL ||
      process.env.FIREBASE_DATABASE_URL ||
      envCred?.databaseURL ||
      undefined;
    if (!adminDbUrl) {
      console.warn(
        "[firebase-admin] Missing Realtime Database URL. Set NEXT_PUBLIC_FB_DB_URL or FIREBASE_DATABASE_URL."
      );
    }
    if (fileCred) {
      app = initializeApp({
        credential: cert(fileCred as any),
        projectId: (fileCred as any).project_id,
        databaseURL: adminDbUrl,
      });
    } else {
      if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
          "Firebase Admin credentials not found. Provide .env.firebase-admin.json or FIREBASE_* envs."
        );
      }
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
        projectId,
        databaseURL: adminDbUrl,
      });
    }
  }
  adminAuth ||= getAuth(app);
  adminDb ||= getFirestore(app);
  // Realtime Database admin (optional)
  if (!adminRtdb) {
    try {
      adminRtdb = getDatabase(app);
    } catch (error) {
      console.warn(
        "[firebase-admin] Failed to initialize Realtime Database. Check database URL configuration.",
        error
      );
    }
  }
  return { app, adminAuth, adminDb, adminRtdb };
}
