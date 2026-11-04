import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth, DecodedIdToken } from "firebase-admin/auth";

export interface FirebaseAdminConfig {
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
}

export function getFirebaseAdminConfig(): FirebaseAdminConfig {
  return {
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  };
}

export function isFirebaseAdminConfigured(): boolean {
  const config = getFirebaseAdminConfig();
  return Boolean(
    config.projectId &&
    !config.projectId.includes("placeholder") &&
    config.clientEmail &&
    !config.clientEmail.includes("placeholder") &&
    config.privateKey &&
    !config.privateKey.includes("placeholder")
  );
}

let adminApp: App | null = null;

export function initFirebaseAdmin(): App {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const config = getFirebaseAdminConfig();
  if (!isFirebaseAdminConfigured()) {
    throw new Error(
      "FIREBASE_ADMIN_NOT_CONFIGURED: Missing valid FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY."
    );
  }

  let formattedPrivateKey = config.privateKey!;
  if (formattedPrivateKey.includes("\\n")) {
    formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, "\n");
  }

  adminApp = initializeApp({
    credential: cert({
      projectId: config.projectId,
      clientEmail: config.clientEmail,
      privateKey: formattedPrivateKey,
    }),
  });

  return adminApp;
}

// Custom verifier hook for isolated unit and regression test suites
export type TokenVerifierFn = (idToken: string) => Promise<DecodedIdToken>;
let customVerifier: TokenVerifierFn | null = null;

export function setCustomTokenVerifier(verifier: TokenVerifierFn | null): void {
  customVerifier = verifier;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<DecodedIdToken> {
  if (!idToken || typeof idToken !== "string" || !idToken.trim()) {
    throw new Error("INVALID_TOKEN: ID token must be a non-empty string.");
  }

  if (customVerifier) {
    return await customVerifier(idToken);
  }

  if (!isFirebaseAdminConfigured()) {
    throw new Error(
      "FIREBASE_ADMIN_NOT_CONFIGURED: Firebase Admin SDK is not configured with valid service account credentials."
    );
  }

  const app = initFirebaseAdmin();
  const auth = getAuth(app);
  return await auth.verifyIdToken(idToken, true);
}
