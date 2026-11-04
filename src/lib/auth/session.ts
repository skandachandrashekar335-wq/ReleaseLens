import { cookies, headers } from "next/headers";
import { db, UserRecord } from "../store/db-adapter";

export const SESSION_COOKIE_NAME = "releaselens_session";

export interface AuthContext {
  user: UserRecord | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
}

export async function getAuthSession(): Promise<AuthContext> {
  let sessionToken: string | null = null;

  // 1. Try reading Authorization header (Bearer token)
  try {
    const headerList = await headers();
    const authHeader = headerList.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      sessionToken = authHeader.substring(7).trim();
    }
  } catch {}

  // 2. Try reading from cookie
  if (!sessionToken) {
    try {
      const cookieStore = await cookies();
      sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
    } catch {}
  }

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
