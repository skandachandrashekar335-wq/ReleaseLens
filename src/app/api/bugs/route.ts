import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: "projectId query param is required" }, { status: 400 });
    }

    const bugs = await db.getBugsForProject(projectId);
    return NextResponse.json({ bugs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      projectId,
      title,
      description,
      affectedUrl,
      stepsToReproduce,
      expectedResult,
      actualResult,
      severity,
      environmentTelemetry,
      developerNotes,
    } = body;

    if (!projectId || !title || !affectedUrl) {
      return NextResponse.json(
        { error: "projectId, title, and affectedUrl are required" },
        { status: 400 }
      );
    }

    const bug = await db.createBug({
      projectId,
      userId: "user_demo_1",
      title: title.trim(),
      description: description || "",
      affectedUrl: affectedUrl.trim(),
      stepsToReproduce: Array.isArray(stepsToReproduce) ? stepsToReproduce : [stepsToReproduce || ""],
      expectedResult: expectedResult || "",
      actualResult: actualResult || "",
      severity: severity || "MEDIUM",
      status: "OPEN",
      environmentTelemetry: environmentTelemetry || {},
      evidenceUrls: [],
      developerNotes: developerNotes || "",
    });

    return NextResponse.json({ bug }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
