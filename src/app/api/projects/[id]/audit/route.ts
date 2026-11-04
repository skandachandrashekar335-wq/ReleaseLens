import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";
import { executeAutomatedAudit } from "@/lib/engine/audit-runner";
import { analyzeReleaseDelta } from "@/lib/engine/delta-analyzer";
import { getAuthSession } from "@/lib/auth/session";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await getAuthSession();
    const userId = auth.user?.id;

    const project = await db.getProject(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const effectiveUserId = userId || "user_demo_1";
    if (project.userId !== "user_demo_1" && project.userId !== effectiveUserId) {
      return NextResponse.json({ error: "Forbidden: Tenant isolation violation." }, { status: 403 });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await getAuthSession();
    const userId = auth.user?.id || "user_demo_1";

    const project = await db.getProject(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.userId !== "user_demo_1" && project.userId !== userId) {
      return NextResponse.json({ error: "Forbidden: Tenant isolation violation." }, { status: 403 });
    }

    const audits = await db.getAuditsForProject(id);
    return NextResponse.json(audits);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
