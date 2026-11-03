import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: "projectId query param is required" }, { status: 400 });
    }

    const findings = await db.getFindingsForProject(projectId);
    return NextResponse.json({ findings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
