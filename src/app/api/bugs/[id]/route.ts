import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";
import { getAuthSession } from "@/lib/auth/session";
import { guardCsrf } from "@/lib/security/csrf";
import { updateBugSchema } from "@/lib/validation/schemas";
import { safeLogger } from "@/lib/security/logger";

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

    const auth = await getAuthSession();
    if (!auth.user || !auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized: Valid session required" }, { status: 401 });
    }
    if (project.userId !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden: Tenant isolation violation." }, { status: 403 });
    }

    const retestHistory = await db.getRetestHistory(id);

    return NextResponse.json({ bug, retestHistory });
  } catch (error: any) {
    safeLogger.error("Error fetching bug details", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const csrfError = guardCsrf(req);
    if (csrfError) return csrfError;

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
    // Defects can only be patched by the project owner
    if (project.userId !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden: Cannot modify bugs for projects you do not own." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const validation = updateBugSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const updatedBug = await db.updateBug(id, validation.data);
    return NextResponse.json({ bug: updatedBug });
  } catch (error: any) {
    safeLogger.error("Error patching bug", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
