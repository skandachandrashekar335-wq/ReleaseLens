import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";
import { getAuthSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { validateTargetUrl } from "@/lib/engine/ssrf-guard";

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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

    const body = await req.json();
    const { name, targetUrl, environment } = body;

    if (!name || !targetUrl) {
      return NextResponse.json({ error: "Project name and target URL are required" }, { status: 400 });
    }

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
