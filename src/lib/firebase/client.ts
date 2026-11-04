import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth } from "firebase/auth";

export const firebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export function isFirebaseClientConfigured(): boolean {
  return Boolean(
    firebaseClientConfig.apiKey &&
    !firebaseClientConfig.apiKey.includes("placeholder") &&
    firebaseClientConfig.projectId &&
    !firebaseClientConfig.projectId.includes("placeholder")
  );
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseClientConfigured()) {
    return null;
  }
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseClientConfig);
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) return null;
  return getAuth(app);
}

export async function signInWithGoogle(): Promise<{
  idToken: string;
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  };
}> {
  if (!isFirebaseClientConfigured()) {
    throw new Error(
      "FIREBASE_NOT_CONFIGURED: Firebase Client SDK credentials are not configured in environment variables (NEXT_PUBLIC_FIREBASE_*)."
    );
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("FIREBASE_AUTH_UNAVAILABLE: Unable to initialize Firebase Auth instance.");
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();

  return {
    idToken,
    user: {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
    },
  };
}

export async function signOutFirebase(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) {
    await signOut(auth);
  }
}
