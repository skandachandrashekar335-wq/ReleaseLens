import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const tokenData = db.getShareTokenData(token);

    if (!tokenData) {
      return NextResponse.json({ error: "Invalid or expired report link" }, { status: 404 });
    }

    const project = await db.getProject(tokenData.projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const audits = await db.getAuditsForProject(project.id);
    const audit = tokenData.auditId
      ? audits.find((a) => a.id === tokenData.auditId)
      : audits[0];

    const findings = await db.getFindingsForProject(project.id);
    const bugs = await db.getBugsForProject(project.id);

    return NextResponse.json({
      project,
      audit: audit || null,
      findings,
      bugs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
