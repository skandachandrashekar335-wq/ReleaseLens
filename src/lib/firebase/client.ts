import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  inMemoryPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  Auth,
} from "firebase/auth";

export const firebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
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

let cachedAuth: Auth | null = null;

export function getFirebaseAuth(): Auth | null {
  if (cachedAuth) return cachedAuth;
  const app = getFirebaseApp();
  if (!app) return null;

  try {
    cachedAuth = initializeAuth(app, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        inMemoryPersistence,
      ],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    cachedAuth = getAuth(app);
  }
  return cachedAuth;
}

export async function getFirebaseAnalytics() {
  if (typeof window === "undefined" || !isFirebaseClientConfigured()) {
    return null;
  }
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    if (await isSupported()) {
      return getAnalytics(app);
    }
  } catch {
    // Analytics optional / unsupported in this environment
  }
  return null;
}

export async function signInWithGoogle(options?: { useRedirect?: boolean }): Promise<{
  idToken: string;
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  };
} | null> {
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

  if (options?.useRedirect) {
    await signInWithRedirect(auth, provider);
    return null;
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken(true);

    return {
      idToken,
      user: {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      },
    };
  } catch (popupError: any) {
    // If popup was blocked by browser or environment, attempt automatic fallback to signInWithRedirect
    if (popupError?.code === "auth/popup-blocked") {
      console.warn("Popup blocked by browser. Falling back to signInWithRedirect...");
      await signInWithRedirect(auth, provider);
      return null;
    }

    // Provide actionable user messaging for popup closed or cancellation
    if (popupError?.code === "auth/popup-closed-by-user") {
      throw new Error(
        "Sign-in popup was closed before completing authentication. Please click [SIGN IN WITH GOOGLE] again to complete sign-in, or allow popups for this site."
      );
    }

    if (popupError?.code === "auth/cancelled-popup-request") {
      throw new Error("A previous sign-in request was still in progress. Please try again.");
    }

    throw popupError;
  }
}

export async function getGoogleRedirectResult(): Promise<{
  idToken: string;
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  };
} | null> {
  if (!isFirebaseClientConfigured()) return null;
  const auth = getFirebaseAuth();
  if (!auth) return null;

  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;

    const idToken = await result.user.getIdToken(true);
    return {
      idToken,
      user: {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      },
    };
  } catch (error) {
    console.error("Error retrieving redirect sign-in result:", error);
    return null;
  }
}

export async function signOutFirebase(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) {
    await signOut(auth);
  }
}
