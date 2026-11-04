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

    // Public demo project permits read-only defect review; private projects require exact ownership
    if (project.id !== "proj_hackathon_demo") {
      const auth = await getAuthSession();
      if (!auth.user || !auth.isAuthenticated) {
        return NextResponse.json({ error: "Unauthorized: Valid session required" }, { status: 401 });
      }
      if (project.userId !== auth.user.id) {
        return NextResponse.json({ error: "Forbidden: Tenant isolation violation." }, { status: 403 });
      }
    }

    const bugs = await db.getBugsForProject(projectId);
    return NextResponse.json(bugs, {
      headers: { "X-Total-Count": String(bugs.length) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthSession();
    if (!auth.user || !auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized: Valid session required" }, { status: 401 });
    }
    const userId = auth.user.id;

    const body = await req.json();
    const {
      projectId,
      title,
      description,
      affectedUrl,
      stepsToReproduce,
      expectedBehavior,
      expectedResult,
      actualBehavior,
      actualResult,
      severity,
      environmentTelemetry,
      evidence,
      developerNotes,
      reportedBy,
    } = body;

    if (!projectId || !title) {
      return NextResponse.json(
        { error: "projectId and title are required" },
        { status: 400 }
      );
    }

    const proj = await db.getProject(projectId);
    if (!proj) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    // Demo content cannot be mutated; defects can only be created in user-owned projects
    if (proj.id === "proj_hackathon_demo" || proj.userId !== userId) {
      return NextResponse.json({ error: "Forbidden: Cannot create defects in projects you do not own." }, { status: 403 });
    }

    // Determine target URL fallback from project if not directly specified
    const targetUrl = affectedUrl || proj.targetUrl || "https://target-app.local";

    const bug = await db.createBug({
      projectId,
      userId,
      title: title.trim(),
      description: description || "",
      affectedUrl: targetUrl.trim(),
      stepsToReproduce: Array.isArray(stepsToReproduce) ? stepsToReproduce : [stepsToReproduce || ""],
      expectedResult: expectedBehavior || expectedResult || "",
      actualResult: actualBehavior || actualResult || "",
      severity: severity || "HIGH",
      status: "OPEN",
      environmentTelemetry: environmentTelemetry || {
        deviceType: "Desktop/Mobile QA Session",
      },
      evidenceUrls: [],
      evidence: evidence || {},
      developerNotes: developerNotes || null,
      reportedBy: reportedBy || "QA Explorer",
    });

    return NextResponse.json(bug, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
