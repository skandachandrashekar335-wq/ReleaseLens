import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";
import { getAuthSession } from "@/lib/auth/session";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: "projectId query param is required" }, { status: 400 });
    }

    const project = await db.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Public demo project permits read-only preview; private projects require exact ownership
    if (project.id !== "proj_hackathon_demo") {
      const auth = await getAuthSession();
      if (!auth.user || !auth.isAuthenticated) {
        return NextResponse.json({ error: "Unauthorized: Valid session required" }, { status: 401 });
      }
      if (project.userId !== auth.user.id) {
        return NextResponse.json({ error: "Forbidden: Tenant isolation violation." }, { status: 403 });
      }
    }

    const findings = await db.getFindingsForProject(projectId);
    return NextResponse.json(findings, {
      headers: { "X-Total-Count": String(findings.length) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
