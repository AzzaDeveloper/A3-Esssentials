import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

export function firebase() {
  if (!getApps().length) {
    app = initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FB_API_KEY!,
      authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN!,
      projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID!,
      storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FB_MSG_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FB_APP_ID!,
    });
  }
  db ||= getFirestore(app);
  auth ||= getAuth(app);
  return { app, db, auth };
}
