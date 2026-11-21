import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";
import { getAuthSession } from "@/lib/auth/session";
import { checkRateLimit, createRateLimitResponse, getClientIp } from "@/lib/security/rate-limit";
import { guardCsrf } from "@/lib/security/csrf";
import { shareReportSchema } from "@/lib/validation/schemas";
import { safeLogger } from "@/lib/security/logger";

export async function POST(req: Request) {
  try {
    const csrfError = guardCsrf(req);
    if (csrfError) return csrfError;

    const auth = await getAuthSession();
    if (!auth.user || !auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized: Valid session required" }, { status: 401 });
    }
    const userId = auth.user.id;

    // Rate limiting: 20 share token creations per minute
    const rateCheck = checkRateLimit(userId || getClientIp(req), {
      limit: 20,
      windowSeconds: 60,
      prefix: "reports_share",
    });
    if (!rateCheck.success) {
      return createRateLimitResponse(rateCheck);
    }

    const body = await req.json().catch(() => ({}));
    const validation = shareReportSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { projectId, auditId } = validation.data;
    const { data } = body;

    const project = await db.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Reports can only be shared by the verified project owner
    if (project.userId !== userId) {
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
    safeLogger.error("Error creating share token", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
