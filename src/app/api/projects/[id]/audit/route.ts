import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";
import { executeAutomatedAudit } from "@/lib/engine/audit-runner";
import { analyzeReleaseDelta } from "@/lib/engine/delta-analyzer";
import { getAuthSession } from "@/lib/auth/session";
import { checkRateLimit, createRateLimitResponse, getClientIp } from "@/lib/security/rate-limit";
import { guardCsrf } from "@/lib/security/csrf";
import { safeLogger } from "@/lib/security/logger";

export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const csrfError = guardCsrf(req);
    if (csrfError) return csrfError;

    const { id } = await params;
    const auth = await getAuthSession();
    if (!auth.user || !auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized: Valid session required" }, { status: 401 });
    }

    // Rate limiting on audit trigger: 10 executions per minute per user/IP
    const clientIdentifier = auth.user.id || getClientIp(req);
    const rateCheck = checkRateLimit(clientIdentifier, {
      limit: 10,
      windowSeconds: 60,
      prefix: "audit",
    });
    if (!rateCheck.success) {
      return createRateLimitResponse(rateCheck);
    }

    const body = await req.json().catch(() => ({}));

    let project = await db.getProject(id);
    // Serverless auto-hydration if project metadata is supplied in audit payload
    if (!project && body?.targetUrl) {
      try {
        project = await db.createProject({
          id,
          userId: auth.user.id,
          name: body.name || "Target Application",
          targetUrl: body.targetUrl,
          environment: body.environment || "PREVIEW",
        } as any);
      } catch {}
    }

    if (!project) {
      return NextResponse.json({ error: `Project '${id}' not found in database session.`, code: "PROJECT_NOT_FOUND" }, { status: 404 });
    }

    // Audits can only be executed by the verified project owner
    if (project.userId !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden: Cannot execute audit on projects you do not own." }, { status: 403 });
    }

    // Get existing confirmed bugs to feed into RQI calculation
    const existingConfirmedBugs = await db.getBugsForProject(id);
    const previousAudits = await db.getAuditsForProject(id);
    const previousAudit = previousAudits[0];

    // Execute real automated audit (with Playwright browser worker and SSRF guard)
    const auditRun = await executeAutomatedAudit({
      projectId: project.id,
      targetUrl: project.targetUrl,
      environment: project.environment,
      auditTier: project.isVerified ? "TIER_2_VERIFIED" : "TIER_1_PUBLIC",
      existingConfirmedBugs,
    });

    // Save audit and generated findings
    await db.saveAudit(auditRun);

    // Calculate release delta
    const delta = analyzeReleaseDelta(auditRun, previousAudit);

    return NextResponse.json(
      {
        auditRun,
        delta,
        checks: auditRun.checks,
        potentialFindings: auditRun.findings,
        rqi: auditRun.rqiScore,
        browserResult: auditRun.browserResult,
      },
      { status: 201 }
    );
  } catch (error: any) {
    safeLogger.error("Audit execution error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await db.getProject(id);
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

    const audits = await db.getAuditsForProject(id);
    return NextResponse.json(audits);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
