import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, auditId, data } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
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
