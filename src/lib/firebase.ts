import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getDatabase, type Database } from "firebase/database";

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let rtdb: Database;

export function firebase() {
  if (!getApps().length) {
    app = initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FB_API_KEY!,
      authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN!,
      projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID!,
      storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FB_MSG_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FB_APP_ID!,
      databaseURL:
        process.env.NEXT_PUBLIC_FB_DB_URL ||
        "https://taskette-d98e6-default-rtdb.asia-southeast1.firebasedatabase.app/",
    });
  }
  db ||= getFirestore(app);
  auth ||= getAuth(app);
  // Prefer explicit URL to ensure correct region/instance
  const dbUrl =
    process.env.NEXT_PUBLIC_FB_DB_URL ||
    "https://taskette-d98e6-default-rtdb.asia-southeast1.firebasedatabase.app/";
  rtdb ||= getDatabase(app, dbUrl);
  return { app, db, auth, rtdb };
}
