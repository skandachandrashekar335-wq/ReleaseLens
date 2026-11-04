import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";
import { queryEvidenceAssistant } from "@/lib/ai/gemini-assistant";
import { getAuthSession } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const auth = await getAuthSession();
    const userId = auth.user?.id;

    const body = await req.json();
    const { projectId } = body;
    const queryText = body.userQuery || body.prompt || body.message;

    if (!projectId || !queryText) {
      return NextResponse.json({ error: "projectId and prompt/userQuery are required" }, { status: 400 });
    }

    const project = await db.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Tenant isolation: public demo project permits read-only copilot analysis; private projects require exact ownership
    if (project.id !== "proj_hackathon_demo") {
      if (!auth.user || !auth.isAuthenticated) {
        return NextResponse.json({ error: "Unauthorized: Valid session required" }, { status: 401 });
      }
      if (project.userId !== auth.user.id) {
        return NextResponse.json({ error: "Forbidden: Tenant isolation violation." }, { status: 403 });
      }
    }

    const audits = await db.getAuditsForProject(projectId);
    const findings = await db.getFindingsForProject(projectId);
    const confirmedBugs = await db.getBugsForProject(projectId);

    const result = await queryEvidenceAssistant({
      projectUrl: project.targetUrl,
      projectName: project.name,
      auditRun: audits[0],
      findings,
      confirmedBugs,
      userQuery: queryText.trim(),
    });

    const citations = result.referencedEvidence.map((e) => `[${e.type}] ${e.label}`);

    return NextResponse.json({
      answer: result.answer,
      reply: result.answer,
      referencedEvidence: result.referencedEvidence,
      citations,
      suggestedAction: result.suggestedAction,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
