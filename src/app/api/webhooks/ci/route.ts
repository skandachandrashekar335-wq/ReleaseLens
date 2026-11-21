import { NextResponse } from "next/server";
import { z } from "zod";
import { guardWebhookHmac } from "@/lib/security/hmac";
import { safeLogger } from "@/lib/security/logger";

const ciWebhookPayloadSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  commitSha: z.string().min(4, "commitSha is required"),
  branch: z.string().default("main"),
  environment: z.enum(["PREVIEW", "STAGING", "PRODUCTION"]).default("PREVIEW"),
  targetUrl: z.string().url("Valid target URL is required"),
});

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    // Verify HMAC-SHA256 signature with timing-safe comparison and 5-minute replay window
    const hmacError = guardWebhookHmac(req, rawBody, "CI_WEBHOOK_SECRET");
    if (hmacError) {
      return hmacError;
    }

    let parsedJson;
    try {
      parsedJson = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body", code: "INVALID_BODY" }, { status: 400 });
    }

    const validation = ciWebhookPayloadSchema.safeParse(parsedJson);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format(), code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { projectId, commitSha, branch, environment, targetUrl } = validation.data;

    safeLogger.info("CI Webhook triggered successfully", {
      projectId,
      commitSha,
      branch,
      environment,
      targetUrl,
    });

    return NextResponse.json(
      {
        success: true,
        message: "CI Webhook accepted. Quality audit queued.",
        jobId: `ci_job_${Date.now()}_${commitSha.substring(0, 7)}`,
        targetUrl,
      },
      { status: 201 }
    );
  } catch (err: any) {
    safeLogger.error("CI Webhook processing error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
