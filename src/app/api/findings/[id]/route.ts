import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";
import { getAuthSession } from "@/lib/auth/session";
import { guardCsrf } from "@/lib/security/csrf";
import { updateFindingSchema } from "@/lib/validation/schemas";
import { safeLogger } from "@/lib/security/logger";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const csrfError = guardCsrf(req);
    if (csrfError) return csrfError;

    const { id } = await params;
    const auth = await getAuthSession();
    if (!auth.user || !auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized: Valid session required" }, { status: 401 });
    }
    const userId = auth.user.id;

    const body = await req.json().catch(() => ({}));
    const validation = updateFindingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { status, triageNotes } = validation.data;
    const { triagedBy, suggestedSeverity, adjustedSeverity } = body;

    const finding = await db.getFinding(id);
    if (!finding) {
      return NextResponse.json({ error: "Finding not found" }, { status: 404 });
    }

    const project = await db.getProject(finding.projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    // Findings can only be triaged by the verified project owner
    if (project.userId !== userId) {
      return NextResponse.json({ error: "Forbidden: Cannot triage findings for projects you do not own." }, { status: 403 });
    }

    let convertedBugId: string | undefined;

    // If confirmed as bug, automatically convert to official persistent BugReport
    if (status === "CONFIRMED") {
      const bug = await db.createBug({
        projectId: finding.projectId,
        userId,
        sourceFindingId: finding.id,
        title: finding.title,
        description: finding.description,
        affectedUrl: finding.affectedUrl || "https://target-app.local",
        stepsToReproduce: [
          `Navigate to ${finding.affectedUrl || "target origin"}`,
          `Trigger inspection source: ${finding.sourceCheck || finding.testSource || "Browser probe"}`,
          `Observed anomaly: ${finding.observedBehavior || finding.description}`,
        ],
        expectedResult: finding.expectedBehavior || "Component should function without errors",
        actualResult: finding.observedBehavior || finding.description,
        severity: adjustedSeverity || suggestedSeverity || finding.recommendedSeverity || "HIGH",
        status: "OPEN",
        environmentTelemetry: {
          browser: "Autonomous Browser Worker (Chromium)",
          deviceType: "Desktop/Mobile Responsive",
        },
        evidenceUrls: [],
        evidence: finding.evidence || finding.evidencePayload || {},
        developerNotes: triageNotes || `Confirmed from automated finding (${finding.sourceCheck || finding.testSource}).`,
        reportedBy: triagedBy || "QA Lead",
      });

      convertedBugId = bug.id;
    }

    const mappedStatus =
      status === "DISMISSED"
        ? "REJECTED"
        : status === "CONVERTED_TO_BUG"
        ? "CONFIRMED"
        : status;

    const updatedFinding = await db.updateFindingStatus(
      id,
      mappedStatus,
      triageNotes,
      convertedBugId,
      triagedBy
    );

    return NextResponse.json({
      finding: updatedFinding,
      convertedBugId,
      status: "SUCCESS",
    });
  } catch (error: any) {
    safeLogger.error("Error updating finding", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
