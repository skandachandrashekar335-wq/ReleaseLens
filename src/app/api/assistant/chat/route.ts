import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";
import { queryEvidenceAssistant } from "@/lib/ai/gemini-assistant";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, userQuery } = body;

    if (!projectId || !userQuery) {
      return NextResponse.json({ error: "projectId and userQuery are required" }, { status: 400 });
    }

    const project = await db.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const audits = await db.getAuditsForProject(projectId);
    const findings = await db.getFindingsForProject(projectId);
    const confirmedBugs = await db.getBugsForProject(projectId);

    const response = await queryEvidenceAssistant({
      projectUrl: project.targetUrl,
      projectName: project.name,
      auditRun: audits[0],
      findings,
      confirmedBugs,
      userQuery: userQuery.trim(),
    });

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
