import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import fs from "node:fs";
import path from "node:path";

let app: App;
let adminAuth: Auth;

function loadServiceAccountFromFile() {
  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const filePath = configuredPath || path.join(process.cwd(), ".env.firebase-admin.json");
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const json = JSON.parse(raw);
  return json;
}

function loadServiceAccountFromEnv() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) return null;
  privateKey = privateKey.replace(/\\n/g, "\n");
  return { projectId, clientEmail, privateKey };
}

export function firebaseAdmin() {
  if (!getApps().length) {
    const fileCred = loadServiceAccountFromFile();
    if (fileCred) {
      app = initializeApp({
        credential: cert(fileCred as any),
        projectId: (fileCred as any).project_id,
      });
    } else {
      const envCred = loadServiceAccountFromEnv();
      if (!envCred) {
        throw new Error(
          "Firebase Admin credentials not found. Provide .env.firebase-admin.json or FIREBASE_* envs."
        );
      }
      app = initializeApp({
        credential: cert({
          projectId: envCred.projectId,
          clientEmail: envCred.clientEmail,
          privateKey: envCred.privateKey,
        }),
        projectId: envCred.projectId,
      });
    }
  }
  adminAuth ||= getAuth(app);
  return { app, adminAuth };
}

