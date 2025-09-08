import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

let app: App;
let adminAuth: Auth;

function getEnv(name: string, required = true): string | undefined {
  const v = process.env[name];
  if (required && !v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function firebaseAdmin() {
  if (!getApps().length) {
    const projectId = getEnv("FIREBASE_PROJECT_ID");
    const clientEmail = getEnv("FIREBASE_CLIENT_EMAIL");
    let privateKey = getEnv("FIREBASE_PRIVATE_KEY");
    // Support escaped newlines in env
    if (privateKey) privateKey = privateKey.replace(/\\n/g, "\n");

    app = initializeApp({
      credential: cert({
        projectId: projectId!,
        clientEmail: clientEmail!,
        privateKey: privateKey!,
      }),
      projectId,
    });
  }
  adminAuth ||= getAuth(app);
  return { app, adminAuth };
}

