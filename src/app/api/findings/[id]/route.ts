import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, triageNotes, adjustedSeverity } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    let convertedBugId: string | undefined;

    // If confirmed as bug, automatically convert to official BugReport
    if (status === "CONFIRMED") {
      const allFindings = await db.getFindingsForProject(body.projectId || "");
      const finding = allFindings.find((f) => f.id === id);

      if (finding) {
        const bug = await db.createBug({
          projectId: finding.projectId,
          userId: "user_demo_1",
          sourceFindingId: finding.id,
          title: finding.title,
          description: finding.description,
          affectedUrl: finding.affectedUrl,
          stepsToReproduce: [
            `Navigate to ${finding.affectedUrl}`,
            `Trigger automated check: ${finding.testSource}`,
            `Observed behavior: ${finding.observedBehavior}`,
          ],
          expectedResult: finding.expectedBehavior,
          actualResult: finding.observedBehavior,
          severity: adjustedSeverity || finding.recommendedSeverity,
          status: "OPEN",
          environmentTelemetry: {
            browser: "Automated Chrome Probe",
            deviceType: "Desktop/Mobile Emulation",
          },
          evidenceUrls: [],
          developerNotes: triageNotes || `Confirmed from automated finding (${finding.testSource}).`,
        });

        convertedBugId = bug.id;
      }
    }

    const updatedFinding = await db.updateFindingStatus(id, status, triageNotes, convertedBugId);
    if (!updatedFinding) {
      return NextResponse.json({ error: "Finding not found" }, { status: 404 });
    }

    return NextResponse.json({
      finding: updatedFinding,
      convertedBugId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
