// Firebase configuration for The Shared Screen
// Lazy initialization to prevent build-time errors when env vars aren't available
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Lazy initialization - only initialize when needed and in browser
let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

function getFirebaseApp(): FirebaseApp {
  if (app) return app;

  // Check if we're in a browser environment and have config
  if (typeof window === 'undefined') {
    throw new Error('Firebase can only be initialized in browser environment');
  }

  if (!firebaseConfig.apiKey) {
    throw new Error('Firebase API key not configured');
  }

  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return app;
}

// Lazy getters for Firebase services
export function getAuthInstance(): Auth {
  if (authInstance) return authInstance;
  authInstance = getAuth(getFirebaseApp());
  return authInstance;
}

export function getDbInstance(): Firestore {
  if (dbInstance) return dbInstance;
  dbInstance = getFirestore(getFirebaseApp());
  return dbInstance;
}

// For backwards compatibility - these will throw if called during SSR/build
export const auth = new Proxy({} as Auth, {
  get(target, prop) {
    return Reflect.get(getAuthInstance(), prop);
  }
});

export const db = new Proxy({} as Firestore, {
  get(target, prop) {
    return Reflect.get(getDbInstance(), prop);
  }
});

export default { getFirebaseApp, getAuthInstance, getDbInstance };
