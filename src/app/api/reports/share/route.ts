import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";
import { getAuthSession } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const auth = await getAuthSession();
    if (!auth.user || !auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized: Valid session required" }, { status: 401 });
    }
    const userId = auth.user.id;

    const body = await req.json();
    const { projectId, auditId, data } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const project = await db.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Reports can only be shared by the verified project owner (or sample demo project)
    if (project.userId !== userId && project.id !== "proj_hackathon_demo") {
      return NextResponse.json({ error: "Forbidden: Cannot share reports for projects you do not own." }, { status: 403 });
    }

    const token = await db.createShareToken(projectId, auditId, data);
    return NextResponse.json(
      {
        token,
        shareToken: token,
        shareUrl: `/reports/${token}`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
