import { describe, it, expect } from "vitest";
import { calculateRqiScore } from "../src/lib/engine/rqi-calculator";
import { AutomatedCheck, BugReport, PotentialFinding } from "../src/lib/types";

describe("RQI Calculator — Tripartite Governance (ADR-020 & ADR-023)", () => {
  const mockChecks: AutomatedCheck[] = [
    {
      id: "c_avail",
      auditRunId: "run_1",
      category: "AVAILABILITY",
      checkName: "Endpoint Availability",
      status: "PASS",
      score: 100,
      weight: 0.15,
      rawEvidence: { statusCode: 200 },
      timestamp: new Date().toISOString(),
    },
    {
      id: "c_tls",
      auditRunId: "run_1",
      category: "TLS",
      checkName: "TLS Certificate Validity",
      status: "PASS",
      score: 100,
      weight: 0.15,
      rawEvidence: { valid: true, daysRemaining: 60 },
      timestamp: new Date().toISOString(),
    },
    {
      id: "c_headers",
      auditRunId: "run_1",
      category: "HEADERS",
      checkName: "Security Headers & CSP",
      status: "PASS",
      score: 100,
      weight: 0.15,
      rawEvidence: { hasHsts: true, hasCsp: true },
      timestamp: new Date().toISOString(),
    },
    {
      id: "c_links",
      auditRunId: "run_1",
      category: "BROKEN_LINKS",
      checkName: "Route & Broken Link Crawl",
      status: "PASS",
      score: 100,
      weight: 0.20,
      rawEvidence: { crawledCount: 10, brokenCount: 0 },
      timestamp: new Date().toISOString(),
    },
    {
      id: "c_speed",
      auditRunId: "run_1",
      category: "PAGESPEED",
      checkName: "PageSpeed & Core Web Vitals",
      status: "PASS",
      score: 90,
      weight: 0.35,
      rawEvidence: { performance: 90 },
      timestamp: new Date().toISOString(),
    },
  ];

  it("produces VERIFIED_READY when all gates pass, scores are high, and zero findings remain", () => {
    const result = calculateRqiScore({
      auditRunId: "run_1",
      checks: mockChecks,
      findings: [],
      confirmedBugs: [],
      tlsDaysRemaining: 60,
      httpsEnforced: true,
      clickjackingProtected: true,
    });

    expect(result.gateSecurity).toBe("PASS");
    expect(result.gateFunctional).toBe("PASS");
    expect(result.releaseVerdict).toBe("VERIFIED_READY");
    expect(result.qualityScore).toBeGreaterThanOrEqual(85);
    expect(result.coveragePercent).toBe(100);
  });

  it("trips Security Gate (FAIL) and blocks release when HTTPS is not enforced", () => {
    const result = calculateRqiScore({
      auditRunId: "run_1",
      checks: mockChecks,
      findings: [],
      confirmedBugs: [],
      tlsDaysRemaining: 60,
      httpsEnforced: false, // Insecure HTTP
      clickjackingProtected: true,
    });

    expect(result.gateSecurity).toBe("FAIL");
    expect(result.releaseVerdict).toBe("RELEASE_BLOCKED");
  });

  it("trips Security Gate (FAIL) when TLS certificate has expired (<= 2 days)", () => {
    const result = calculateRqiScore({
      auditRunId: "run_1",
      checks: mockChecks,
      findings: [],
      confirmedBugs: [],
      tlsDaysRemaining: 1, // Expired or expiring today
      httpsEnforced: true,
      clickjackingProtected: true,
    });

    expect(result.gateSecurity).toBe("FAIL");
    expect(result.releaseVerdict).toBe("RELEASE_BLOCKED");
  });

  it("trips Functional Gate (FAIL) and blocks release when active CRITICAL bug exists", () => {
    const criticalBug: BugReport = {
      id: "bug_crit_1",
      projectId: "proj_1",
      userId: "user_qa",
      title: "Broken payment submission button",
      description: "Clicking pay causes uncaught 500 server error.",
      affectedUrl: "https://preview.app/checkout",
      stepsToReproduce: ["1. Go to checkout", "2. Click Pay"],
      expectedResult: "Confirmation order",
      actualResult: "500 Error",
      severity: "CRITICAL",
      status: "OPEN",
      environmentTelemetry: {},
      evidenceUrls: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = calculateRqiScore({
      auditRunId: "run_1",
      checks: mockChecks,
      findings: [],
      confirmedBugs: [criticalBug],
      tlsDaysRemaining: 60,
      httpsEnforced: true,
      clickjackingProtected: true,
    });

    expect(result.gateFunctional).toBe("FAIL");
    expect(result.releaseVerdict).toBe("RELEASE_BLOCKED");
    expect(result.confirmedBugsCount).toBe(1);
  });

  it("allows PROVISIONAL_PASS if critical bug was FIXED or VERIFIED", () => {
    const verifiedBug: BugReport = {
      id: "bug_crit_fixed",
      projectId: "proj_1",
      userId: "user_qa",
      title: "Broken payment submission button",
      description: "Clicking pay causes uncaught 500 server error.",
      affectedUrl: "https://preview.app/checkout",
      stepsToReproduce: ["1. Go to checkout", "2. Click Pay"],
      expectedResult: "Confirmation order",
      actualResult: "Verified fixed on commit a1b2c3",
      severity: "CRITICAL",
      status: "VERIFIED",
      environmentTelemetry: {},
      evidenceUrls: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = calculateRqiScore({
      auditRunId: "run_1",
      checks: mockChecks,
      findings: [],
      confirmedBugs: [verifiedBug],
      tlsDaysRemaining: 60,
      httpsEnforced: true,
      clickjackingProtected: true,
    });

    expect(result.gateFunctional).toBe("PASS");
    expect(result.releaseVerdict).toBe("VERIFIED_READY");
    expect(result.confirmedBugsCount).toBe(0);
  });
});
