import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";
import { executeAutomatedAudit } from "@/lib/engine/audit-runner";
import { analyzeReleaseDelta } from "@/lib/engine/delta-analyzer";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await db.getProject(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get existing confirmed bugs to feed into RQI calculation
    const existingConfirmedBugs = await db.getBugsForProject(id);
    const previousAudits = await db.getAuditsForProject(id);
    const previousAudit = previousAudits[0];

    // Execute real automated audit
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

    return NextResponse.json({
      auditRun,
      delta,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const audits = await db.getAuditsForProject(id);
    return NextResponse.json({ audits });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
