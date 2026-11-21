import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";
import { getAuthSession } from "@/lib/auth/session";
import { checkRateLimit, createRateLimitResponse, getClientIp } from "@/lib/security/rate-limit";
import { guardCsrf } from "@/lib/security/csrf";
import { createBugSchema } from "@/lib/validation/schemas";
import { safeLogger } from "@/lib/security/logger";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: "projectId query param is required" }, { status: 400 });
    }

    const project = await db.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const auth = await getAuthSession();
    if (!auth.user || !auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized: Valid session required" }, { status: 401 });
    }
    if (project.userId !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden: Tenant isolation violation." }, { status: 403 });
    }

    const bugs = await db.getBugsForProject(projectId);
    return NextResponse.json(bugs, {
      headers: { "X-Total-Count": String(bugs.length) },
    });
  } catch (error: any) {
    safeLogger.error("Error fetching bugs", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const csrfError = guardCsrf(req);
    if (csrfError) return csrfError;

    const auth = await getAuthSession();
    if (!auth.user || !auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized: Valid session required" }, { status: 401 });
    }
    const userId = auth.user.id;

    // Rate limiting: 30 bug creations per minute
    const rateCheck = checkRateLimit(userId || getClientIp(req), {
      limit: 30,
      windowSeconds: 60,
      prefix: "bugs",
    });
    if (!rateCheck.success) {
      return createRateLimitResponse(rateCheck);
    }

    const body = await req.json().catch(() => ({}));
    const validation = createBugSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const {
      projectId,
      title,
      description,
      affectedUrl,
      stepsToReproduce,
      expectedResult,
      actualResult,
      severity,
      developerNotes,
      sourceFindingId,
    } = validation.data;

    const proj = await db.getProject(projectId);
    if (!proj) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    // Defects can only be created in user-owned projects
    if (proj.userId !== userId) {
      return NextResponse.json({ error: "Forbidden: Cannot create defects in projects you do not own." }, { status: 403 });
    }

    // Determine target URL fallback from project if not directly specified
    const targetUrl = affectedUrl || proj.targetUrl || "https://target-app.local";

    const bug = await db.createBug({
      projectId,
      userId,
      sourceFindingId,
      title: title.trim(),
      description: description || "",
      affectedUrl: targetUrl.trim(),
      stepsToReproduce: Array.isArray(stepsToReproduce) ? stepsToReproduce : [stepsToReproduce || ""],
      expectedResult: expectedResult || "",
      actualResult: actualResult || "",
      severity: severity || "HIGH",
      status: "OPEN",
      environmentTelemetry: body.environmentTelemetry || {
        deviceType: "Desktop/Mobile QA Session",
      },
      evidenceUrls: [],
      evidence: body.evidence || {},
      developerNotes: developerNotes || undefined,
      reportedBy: body.reportedBy || "QA Explorer",
    });

    return NextResponse.json(bug, { status: 201 });
  } catch (error: any) {
    safeLogger.error("Error creating bug report", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
