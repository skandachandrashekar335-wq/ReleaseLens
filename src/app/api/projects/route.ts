import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";
import { getAuthSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { validateTargetUrl } from "@/lib/engine/ssrf-guard";
import { checkRateLimit, createRateLimitResponse, getClientIp } from "@/lib/security/rate-limit";
import { guardCsrf } from "@/lib/security/csrf";
import { createProjectSchema } from "@/lib/validation/schemas";
import { safeLogger } from "@/lib/security/logger";

export async function GET() {
  try {
    const auth = await getAuthSession();
    if (!auth.user || !auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized: Valid session required" }, { status: 401 });
    }
    const projects = await db.getProjects(auth.user.id);

    return NextResponse.json(projects, {
      headers: { "X-Total-Count": String(projects.length) },
    });
  } catch (error: any) {
    safeLogger.error("Error fetching projects", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // CSRF verification on state-changing requests
    const csrfError = guardCsrf(req);
    if (csrfError) return csrfError;

    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(clientIp, {
      limit: 20,
      windowSeconds: 60,
      prefix: "project_create",
    });
    if (!rateCheck.success) {
      return createRateLimitResponse(rateCheck);
    }

    const auth = await getAuthSession();
    let user = auth.user;
    let newSessionToken: string | null = null;

    // If unauthenticated visitor launches audit from landing page, provision dedicated isolated tenant session
    if (!user || !auth.isAuthenticated) {
      const guestId = `usr_guest_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
      user = await db.createUser({
        id: guestId,
        email: `${guestId}@releaselens.local`,
        name: "QA Explorer",
        role: "tester",
      });
      const session = await db.createSession(user.id);
      newSessionToken = session.token;
    }

    const userId = user.id; // Strictly validated session identity, never client-supplied

    const body = await req.json().catch(() => ({}));
    const validation = createProjectSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { name, targetUrl, environment } = validation.data;

    // SSRF & URL validation
    const ssrfCheck = await validateTargetUrl(targetUrl);
    if (!ssrfCheck.isAllowed) {
      return NextResponse.json(
        { error: `Target URL rejected by security policy: ${ssrfCheck.reason}` },
        { status: 400 }
      );
    }

    const validUrl = new URL(targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`);

    const project = await db.createProject({
      userId,
      name: name.trim(),
      targetUrl: validUrl.toString().replace(/\/$/, ""),
      environment: environment || "PREVIEW",
      isVerified: false,
    });

    const response = NextResponse.json(project, { status: 201 });
    if (newSessionToken) {
      response.cookies.set(SESSION_COOKIE_NAME, newSessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 86400 * 14,
        path: "/",
      });
    }

    return response;
  } catch (error: any) {
    safeLogger.error("Error creating project", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
