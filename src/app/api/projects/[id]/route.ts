import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";
import { getAuthSession } from "@/lib/auth/session";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await getAuthSession();
    const userId = auth.user?.id;

    const project = await db.getProject(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify tenant ownership if user is authenticated with a non-demo account
    if (userId && project.userId !== "user_demo_1" && project.userId !== userId) {
      return NextResponse.json({ error: "Forbidden: Tenant isolation violation." }, { status: 403 });
    }

    const audits = await db.getAuditsForProject(id);
    const findings = await db.getFindingsForProject(id);
    const bugs = await db.getBugsForProject(id);

    return NextResponse.json({
      ...project,
      project,
      latestAudit: audits[0] || null,
      auditCount: audits.length,
      openFindingsCount: findings.filter((f) => f.status === "NEEDS_REVIEW" || f.status === "DETECTED").length,
      activeBugsCount: bugs.filter((b) => b.status !== "FIXED" && b.status !== "VERIFIED").length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await getAuthSession();
    const userId = auth.user?.id;

    const project = await db.getProject(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (userId && project.userId !== "user_demo_1" && project.userId !== userId) {
      return NextResponse.json({ error: "Forbidden: Tenant isolation violation." }, { status: 403 });
    }

    const success = await db.deleteProject(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
