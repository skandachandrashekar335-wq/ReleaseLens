import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";
import { getAuthSession } from "@/lib/auth/session";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const bug = await db.getBug(id);
    if (!bug) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }

    const project = await db.getProject(bug.projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Public demo project permits read-only inspection; private projects require ownership
    if (project.id !== "proj_hackathon_demo") {
      const auth = await getAuthSession();
      if (!auth.user || !auth.isAuthenticated) {
        return NextResponse.json({ error: "Unauthorized: Valid session required" }, { status: 401 });
      }
      if (project.userId !== auth.user.id) {
        return NextResponse.json({ error: "Forbidden: Tenant isolation violation." }, { status: 403 });
      }
    }

    const retestHistory = await db.getRetestHistory(id);

    return NextResponse.json({ bug, retestHistory });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await getAuthSession();
    if (!auth.user || !auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized: Valid session required" }, { status: 401 });
    }

    const bug = await db.getBug(id);
    if (!bug) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }

    const project = await db.getProject(bug.projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    // Demo content cannot be modified; defects can only be patched by the project owner
    if (project.id === "proj_hackathon_demo" || project.userId !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden: Cannot modify bugs for projects you do not own." }, { status: 403 });
    }

    const body = await req.json();

    const updatedBug = await db.updateBug(id, body);
    return NextResponse.json({ bug: updatedBug });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
