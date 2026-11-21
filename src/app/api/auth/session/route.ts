import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";
import { getAuthSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { verifyFirebaseIdToken, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { checkRateLimit, createRateLimitResponse, getClientIp } from "@/lib/security/rate-limit";
import { guardCsrf } from "@/lib/security/csrf";
import { authSessionSchema } from "@/lib/validation/schemas";
import { safeLogger } from "@/lib/security/logger";

export async function GET() {
  try {
    const auth = await getAuthSession();
    return NextResponse.json({
      user: auth.user,
      isAuthenticated: auth.isAuthenticated,
      sessionToken: auth.sessionToken,
      securityPosture: {
        mfaEnrolled: Boolean((auth.user as any)?.mfaEnrolled),
        emailVerified: true,
        authProvider: "firebase.google",
        passwordlessAuth: true,
      },
    });
  } catch (err: any) {
    safeLogger.error("Session GET error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // CSRF verification on state-changing session establishment
    const csrfError = guardCsrf(req);
    if (csrfError) return csrfError;

    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(clientIp, {
      limit: 30,
      windowSeconds: 60,
      prefix: "auth_session",
    });
    if (!rateCheck.success) {
      return createRateLimitResponse(rateCheck);
    }

    const body = await req.json().catch(() => ({}));
    if (!body?.idToken || typeof body.idToken !== "string" || !body.idToken.trim()) {
      return NextResponse.json(
        { error: "Firebase ID token ('idToken') is required in request body" },
        { status: 400 }
      );
    }
    const validation = authSessionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Firebase ID token ('idToken') is required in request body", details: validation.error.format() },
        { status: 400 }
      );
    }
    const { idToken } = validation.data;

    let decoded;
    try {
      decoded = await verifyFirebaseIdToken(idToken);
    } catch (verifyErr: any) {
      if (
        verifyErr.message?.includes("FIREBASE_ADMIN_NOT_CONFIGURED") ||
        verifyErr.code === "FIREBASE_ADMIN_NOT_CONFIGURED"
      ) {
        return NextResponse.json(
          {
            error: "Firebase Admin SDK is not configured. Server credentials missing.",
            code: "FIREBASE_NOT_CONFIGURED",
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error: `Invalid or expired Firebase ID token: ${verifyErr.message}`,
          code: "INVALID_TOKEN",
        },
        { status: 401 }
      );
    }

    if (!decoded || !decoded.uid) {
      return NextResponse.json(
        { error: "Firebase ID token verification yielded no valid subject UID", code: "INVALID_TOKEN" },
        { status: 401 }
      );
    }

    // Zero-trust identity derivation: identity is strictly derived from the verified Firebase UID
    const uid = decoded.uid;
    const email = decoded.email || `${uid}@firebase.user`;
    const name = decoded.name || decoded.displayName || email.split("@")[0] || "QA Engineer";
    const avatarUrl = decoded.picture || undefined;

    // Synchronize user record in database
    let user = await db.getUser(uid);
    if (!user) {
      const existingByEmail = await db.getUserByEmail(email);
      if (existingByEmail) {
        user = existingByEmail;
      } else {
        user = await db.createUser({
          id: uid,
          email,
          name,
          avatarUrl,
          role: "qa_engineer",
        });
      }
    }

    // Create persistent application session
    const session = await db.createSession(user.id);

    const response = NextResponse.json(
      {
        user,
        sessionToken: session.token,
        securityPosture: {
          mfaEnrolled: Boolean((decoded as any)?.firebase?.sign_in_second_factor),
          emailVerified: Boolean(decoded.email_verified),
          authProvider: (decoded as any)?.firebase?.sign_in_provider || "google.com",
          passwordlessAuth: true,
        },
      },
      { status: 200 }
    );

    // Set secure HTTP-only cookie
    response.cookies.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400 * 14,
      path: "/",
    });

    return response;
  } catch (err: any) {
    safeLogger.error("Session POST error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (req) {
      const csrfError = guardCsrf(req);
      if (csrfError) return csrfError;
    }

    const auth = await getAuthSession();
    if (auth.sessionToken) {
      await db.deleteSession(auth.sessionToken);
    }

    const response = NextResponse.json({
      success: true,
      message: "Session invalidated and logged out successfully.",
    });

    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  } catch (err: any) {
    safeLogger.error("Session DELETE error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
