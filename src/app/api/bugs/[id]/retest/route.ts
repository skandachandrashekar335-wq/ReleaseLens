import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { testerVerdict, testerComment } = body;

    if (!testerVerdict) {
      return NextResponse.json({ error: "testerVerdict is required (PASS, FAIL, INCONCLUSIVE)" }, { status: 400 });
    }

    const bug = await db.getBug(id);
    if (!bug) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }

    const retest = await db.addRetest({
      bugReportId: id,
      userId: "user_demo_1",
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
