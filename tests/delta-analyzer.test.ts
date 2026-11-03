import { describe, it, expect } from "vitest";
import { analyzeReleaseDelta } from "../src/lib/engine/delta-analyzer";
import { AuditRun } from "../src/lib/types";

describe("Release Delta Analyzer", () => {
  it("computes baseline delta when no previous run exists", () => {
    const currentRun: AuditRun = {
      id: "run_current",
      projectId: "proj_1",
      targetUrl: "https://example.com",
      environment: "PREVIEW",
      auditTier: "TIER_1_PUBLIC",
      status: "COMPLETED",
      startedAt: new Date().toISOString(),
      checks: [],
      findings: [],
      rqiScore: {
        id: "rqi_1",
        auditRunId: "run_current",
        releaseVerdict: "PROVISIONAL_PASS",
        qualityScore: 85,
        coveragePercent: 90,
        gateSecurity: "PASS",
        gateFunctional: "PASS",
        openFindingsCount: 1,
        confirmedBugsCount: 0,
        categoryScores: { security: 90, performance: 80, accessibility: 90, links: 85 },
      },
    };

    const delta = analyzeReleaseDelta(currentRun);
    expect(delta.rqiDelta).toBe(0);
    expect(delta.verdictChanged).toBe(false);
    expect(delta.notes[0]).toContain("Initial baseline");
  });

  it("detects score improvements and newly broken routes when comparing consecutive runs", () => {
    const prevRun: AuditRun = {
      id: "run_prev",
      projectId: "proj_1",
      targetUrl: "https://example.com",
      environment: "PREVIEW",
      auditTier: "TIER_1_PUBLIC",
      status: "COMPLETED",
      startedAt: new Date().toISOString(),
      checks: [
        {
          id: "c1",
          auditRunId: "run_prev",
          category: "BROKEN_LINKS",
          checkName: "Broken Links",
          status: "PASS",
          weight: 0.2,
          rawEvidence: { brokenLinks: [] },
          timestamp: new Date().toISOString(),
        },
      ],
      findings: [],
      rqiScore: {
        id: "rqi_prev",
        auditRunId: "run_prev",
        releaseVerdict: "REVIEW_REQUIRED",
        qualityScore: 70,
        coveragePercent: 80,
        gateSecurity: "PASS",
        gateFunctional: "PASS",
        openFindingsCount: 3,
        confirmedBugsCount: 0,
        categoryScores: { security: 70, performance: 70, accessibility: 70, links: 70 },
      },
    };

    const currentRun: AuditRun = {
      id: "run_curr",
      projectId: "proj_1",
      targetUrl: "https://example.com",
      environment: "PREVIEW",
      auditTier: "TIER_1_PUBLIC",
      status: "COMPLETED",
      startedAt: new Date().toISOString(),
      checks: [
        {
          id: "c2",
          auditRunId: "run_curr",
          category: "BROKEN_LINKS",
          checkName: "Broken Links",
          status: "FAIL",
          weight: 0.2,
          rawEvidence: {
            brokenLinks: [{ url: "https://example.com/checkout-bug", statusCode: 500 }],
          },
          timestamp: new Date().toISOString(),
        },
      ],
      findings: [],
      rqiScore: {
        id: "rqi_curr",
        auditRunId: "run_curr",
        releaseVerdict: "PROVISIONAL_PASS",
        qualityScore: 82,
        coveragePercent: 95,
        gateSecurity: "PASS",
        gateFunctional: "PASS",
        openFindingsCount: 1,
        confirmedBugsCount: 0,
        categoryScores: { security: 90, performance: 80, accessibility: 80, links: 60 },
      },
    };

    const delta = analyzeReleaseDelta(currentRun, prevRun);

    expect(delta.qualityDelta).toBe(12); // 82 - 70
    expect(delta.coverageDelta).toBe(15); // 95 - 80
    expect(delta.verdictChanged).toBe(true);
    expect(delta.newBrokenLinks).toContain("https://example.com/checkout-bug");
  });
});
