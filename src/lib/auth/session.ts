import { cookies, headers } from "next/headers";
import { db, UserRecord } from "../store/db-adapter";
import { verifyFirebaseIdToken, isFirebaseAdminConfigured } from "../firebase/admin";

export const SESSION_COOKIE_NAME = "releaselens_session";

export interface AuthContext {
  user: UserRecord | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
}

export async function getAuthSession(): Promise<AuthContext> {
  let sessionToken: string | null = null;
  let bearerToken: string | null = null;

  // 1. Try reading Authorization header (Bearer token)
  try {
    const headerList = await headers();
    const authHeader = headerList.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      bearerToken = authHeader.substring(7).trim();
    }
  } catch {}

  // 2. If Bearer token is provided, check if it's an app session token or Firebase ID token
  if (bearerToken) {
    const session = await db.getSession(bearerToken);
    if (session) {
      const user = await db.getUser(session.userId);
      if (user) {
        return {
          user,
          sessionToken: session.token,
          isAuthenticated: true,
        };
      }
    }

    // Attempt Firebase ID token verification for Bearer token
    try {
      if (isFirebaseAdminConfigured() || process.env.NODE_ENV === "test") {
        const decoded = await verifyFirebaseIdToken(bearerToken);
        if (decoded && decoded.uid) {
          let user = await db.getUser(decoded.uid);
          if (!user && decoded.email) {
            user = await db.getUserByEmail(decoded.email);
          }
          if (!user) {
            user = await db.createUser({
              id: decoded.uid,
              email: decoded.email || `${decoded.uid}@firebase.user`,
              name: decoded.name || decoded.email?.split("@")[0] || "QA Engineer",
              avatarUrl: decoded.picture || undefined,
              role: "qa_engineer",
            });
          }
          return {
            user,
            sessionToken: bearerToken,
            isAuthenticated: true,
          };
        }
      }
    } catch {
      // Direct token verification failed, fall through to cookie inspection
    }
  }

  // 3. Try reading from cookie
  try {
    const cookieStore = await cookies();
    sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
  } catch {}

  if (!sessionToken) {
    return {
      user: null,
      sessionToken: null,
      isAuthenticated: false,
    };
  }

  const session = await db.getSession(sessionToken);
  if (!session) {
    return {
      user: null,
      sessionToken: null,
      isAuthenticated: false,
    };
  }

  const user = await db.getUser(session.userId);
  return {
    user,
    sessionToken: session.token,
    isAuthenticated: !!user,
  };
}

export async function requireAuth(reqUserId?: string): Promise<UserRecord> {
  const { user } = await getAuthSession();
  if (!user) {
    throw new Error("UNAUTHORIZED: Authentication session required.");
  }
  if (reqUserId && user.id !== reqUserId) {
    throw new Error("FORBIDDEN: Tenant isolation violation. Cannot access another tenant's resources.");
  }
  return user;
}
