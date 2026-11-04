import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, triageNotes, triagedBy, suggestedSeverity, adjustedSeverity } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const finding = await db.getFinding(id);
    if (!finding) {
      return NextResponse.json({ error: "Finding not found" }, { status: 404 });
    }

    let convertedBugId: string | undefined;

    // If confirmed as bug, automatically convert to official persistent BugReport
    if (status === "CONFIRMED") {
      const bug = await db.createBug({
        projectId: finding.projectId,
        userId: "user_demo_1",
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

    const updatedFinding = await db.updateFindingStatus(
      id,
      status,
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
