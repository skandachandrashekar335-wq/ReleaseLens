import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";
import { getAuthSession } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const auth = await getAuthSession();
    const userId = auth.user?.id || "user_demo_1";

    const body = await req.json();
    const { projectId, auditId, data } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const project = await db.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== "user_demo_1" && project.userId !== userId) {
      return NextResponse.json({ error: "Forbidden: Tenant isolation violation." }, { status: 403 });
    }

    const token = db.createShareToken(projectId, auditId, data);
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
