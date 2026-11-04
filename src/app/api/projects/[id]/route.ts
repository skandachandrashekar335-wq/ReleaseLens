import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";
import { getAuthSession } from "@/lib/auth/session";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await db.getProject(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Public read-only demo access mechanism (strictly scoped to proj_hackathon_demo)
    const isPublicDemo = project.id === "proj_hackathon_demo";

    if (!isPublicDemo) {
      const auth = await getAuthSession();
      if (!auth.user || !auth.isAuthenticated) {
        return NextResponse.json({ error: "Unauthorized: Valid session required" }, { status: 401 });
      }
      if (project.userId !== auth.user.id) {
        return NextResponse.json({ error: "Forbidden: Tenant isolation violation. You do not own this project." }, { status: 403 });
      }
    }

    const audits = await db.getAuditsForProject(id);
    const findings = await db.getFindingsForProject(id);
    const bugs = await db.getBugsForProject(id);

    return NextResponse.json({
      ...project,
      project,
      isReadOnlyDemo: isPublicDemo,
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
    if (!auth.user || !auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized: Valid session required" }, { status: 401 });
    }

    const project = await db.getProject(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Demo project is immutable; private projects can only be deleted by the owner
    if (project.id === "proj_hackathon_demo" || project.userId !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden: Tenant isolation violation. Cannot delete projects you do not own." }, { status: 403 });
    }

    const success = await db.deleteProject(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
