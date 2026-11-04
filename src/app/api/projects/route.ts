import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";
import { getAuthSession } from "@/lib/auth/session";
import { validateTargetUrl } from "@/lib/engine/ssrf-guard";

export async function GET() {
  try {
    const auth = await getAuthSession();
    const userId = auth.user?.id || "user_demo_1";
    const projects = await db.getProjects(userId);

    // Return both top-level and wrapper for maximum client compatibility
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
    const userId = auth.user?.id || "user_demo_1";

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

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
