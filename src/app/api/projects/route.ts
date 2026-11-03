import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";

export async function GET() {
  try {
    const projects = await db.getProjects();
    return NextResponse.json({ projects });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, targetUrl, environment } = body;

    if (!name || !targetUrl) {
      return NextResponse.json({ error: "Project name and target URL are required" }, { status: 400 });
    }

    // URL validation
    let validUrl: URL;
    try {
      validUrl = new URL(targetUrl);
      if (!["http:", "https:"].includes(validUrl.protocol)) {
        throw new Error("Protocol must be http or https");
      }
    } catch (e: any) {
      return NextResponse.json({ error: "Invalid URL format. Include http:// or https://" }, { status: 400 });
    }

    const project = await db.createProject({
      userId: "user_demo_1",
      name: name.trim(),
      targetUrl: validUrl.toString().replace(/\/$/, ""),
      environment: environment || "PREVIEW",
      isVerified: false,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
