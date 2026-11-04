import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";
import { getAuthSession } from "@/lib/auth/session";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await getAuthSession();
    const userId = auth.user?.id || "user_demo_1";

    const body = await req.json();
    const { testerVerdict, testerComment, tester } = body;

    if (!testerVerdict) {
      return NextResponse.json({ error: "testerVerdict is required (PASS, FAIL, INCONCLUSIVE)" }, { status: 400 });
    }

    const bug = await db.getBug(id);
    if (!bug) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }

    const project = await db.getProject(bug.projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.userId !== "user_demo_1" && project.userId !== userId) {
      return NextResponse.json({ error: "Forbidden: Tenant isolation violation." }, { status: 403 });
    }

    const retest = await db.addRetest({
      bugReportId: id,
      userId,
      tester: tester || auth.user?.name || "QA Tester",
      previousStatus: bug.status,
      newStatus: testerVerdict === "PASS" ? "VERIFIED" : testerVerdict === "FAIL" ? "REOPENED" : bug.status,
      testerVerdict,
      testerComment: testerComment || "",
    });

    const updatedBug = await db.getBug(id);

    return NextResponse.json({ retest, bug: updatedBug }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
