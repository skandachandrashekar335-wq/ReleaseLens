import { z } from "zod";

/**
 * Zod Schemas for ReleaseLens API Payloads
 * Enforces strict input validation and type safety across all endpoints.
 */

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name cannot be empty")
    .max(100, "Project name must not exceed 100 characters"),
  targetUrl: z
    .string()
    .trim()
    .url("A valid HTTP or HTTPS target URL is required")
    .refine((url) => url.startsWith("http://") || url.startsWith("https://"), {
      message: "Target URL must use http:// or https:// protocol",
    }),
  environment: z
    .enum(["PRODUCTION", "PREVIEW", "STAGING"])
    .default("PREVIEW"),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  targetUrl: z
    .string()
    .trim()
    .url()
    .refine((url) => url.startsWith("http://") || url.startsWith("https://"), {
      message: "Target URL must use http:// or https:// protocol",
    })
    .optional(),
  environment: z
    .enum(["PRODUCTION", "PREVIEW", "STAGING"])
    .optional(),
});

export const auditTriggerSchema = z.object({
  environment: z
    .enum(["PRODUCTION", "PREVIEW", "STAGING"])
    .optional(),
  auditTier: z.enum(["TIER_1_PUBLIC", "TIER_2_AUTHENTICATED"]).optional(),
});

export const createBugSchema = z.object({
  projectId: z.string().trim().min(1, "Project ID is required"),
  title: z.string().trim().min(1, "Bug title is required").max(200, "Title too long"),
  affectedUrl: z.string().trim().url("Affected URL must be a valid URL"),
  description: z.string().trim().max(5000).optional().default(""),
  stepsToReproduce: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .default([]),
  expectedResult: z.string().trim().max(2000).optional().default(""),
  actualResult: z.string().trim().max(2000).optional().default(""),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).default("HIGH"),
  sourceFindingId: z.string().optional(),
  developerNotes: z.string().max(2000).optional(),
});

export const updateBugSchema = z.object({
  status: z
    .enum([
      "OPEN",
      "ACKNOWLEDGED",
      "IN_PROGRESS",
      "FIXED",
      "RETEST_REQUIRED",
      "VERIFIED",
      "REOPENED",
    ])
    .optional(),
  developerNotes: z.string().max(2000).optional(),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
});

export const retestBugSchema = z
  .object({
    verdict: z.enum(["PASS", "PASSED", "FAIL", "FAILED"]).optional(),
    testerVerdict: z.enum(["PASS", "PASSED", "FAIL", "FAILED"]).optional(),
    comment: z.string().trim().max(1000).optional().default(""),
    testerComment: z.string().trim().max(1000).optional().default(""),
    tester: z.string().trim().max(100).optional(),
  })
  .refine((data) => Boolean(data.verdict || data.testerVerdict), {
    message: "Verdict is required (PASS or FAIL)",
  });

export const updateFindingSchema = z.object({
  status: z.enum([
    "DETECTED",
    "NEEDS_REVIEW",
    "CONFIRMED",
    "REJECTED",
    "DUPLICATE",
    "ACCEPTED_RISK",
    "DISMISSED",
    "CONVERTED_TO_BUG",
  ]),
  triageNotes: z.string().trim().max(2000).optional(),
});

export const shareReportSchema = z.object({
  projectId: z.string().trim().min(1, "Project ID is required"),
  auditId: z.string().trim().optional(),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

export const chatMessageSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty").max(2000, "Message too long"),
  context: z.record(z.string(), z.any()).optional(),
});

export const authSessionSchema = z.object({
  idToken: z.string().trim().min(1, "Firebase ID token ('idToken') is required"),
});
