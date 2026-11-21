import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";
import { getAuthSession } from "@/lib/auth/session";
import { guardCsrf } from "@/lib/security/csrf";
import { retestBugSchema } from "@/lib/validation/schemas";
import { safeLogger } from "@/lib/security/logger";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const csrfError = guardCsrf(req);
    if (csrfError) return csrfError;

    const { id } = await params;
    const auth = await getAuthSession();
    if (!auth.user || !auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized: Valid session required" }, { status: 401 });
    }
    const userId = auth.user.id;

    const body = await req.json().catch(() => ({}));
    const validation = retestBugSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const verdict = validation.data.verdict || validation.data.testerVerdict || "PASS";
    const comment = validation.data.comment || validation.data.testerComment || "";
    const tester = validation.data.tester;

    const bug = await db.getBug(id);
    if (!bug) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }

    const project = await db.getProject(bug.projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    // Retests can only be recorded by the verified project owner
    if (project.userId !== userId) {
      return NextResponse.json({ error: "Forbidden: Cannot record retests on projects you do not own." }, { status: 403 });
    }

    const normalizedVerdict: "PASS" | "FAIL" =
      verdict === "FAILED" || verdict === "FAIL" ? "FAIL" : "PASS";

    const retest = await db.addRetest({
      bugReportId: id,
      userId,
      tester: tester || auth.user?.name || "QA Tester",
      previousStatus: bug.status,
      newStatus: (verdict === "PASSED" || verdict === "PASS") ? "VERIFIED" : "REOPENED",
      testerVerdict: normalizedVerdict,
      testerComment: comment || "",
    });

    const updatedBug = await db.getBug(id);

    return NextResponse.json({ retest, bug: updatedBug }, { status: 201 });
  } catch (error: any) {
    safeLogger.error("Error adding retest", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
