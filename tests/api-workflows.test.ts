import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import { PersistentDataStore } from "../src/lib/store/db-adapter";
import { executeAutomatedAudit } from "../src/lib/engine/audit-runner";
import { analyzeReleaseDelta } from "../src/lib/engine/delta-analyzer";

describe("End-to-End Product Workflows (A through F)", () => {
  const testDbPath = "./data/test_workflows.db";
  let db: PersistentDataStore;

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }
    db = new PersistentDataStore(testDbPath);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }
  });

  it("Workflow A & B: Creates project, executes automated audit, and persists results", async () => {
    // 1. Create project
    const project = await db.createProject({
      userId: "user_demo_1",
      name: "Staging Vercel App",
      targetUrl: "https://example.com",
      environment: "PREVIEW",
    });

    expect(project.id).toBeDefined();
    expect(project.verificationToken).toBeDefined();

    // 2. Execute automated audit
    const auditRun = await executeAutomatedAudit({
      projectId: project.id,
      targetUrl: project.targetUrl,
      environment: project.environment,
      skipBrowserWorker: true, // test engine integration
    });

    expect(auditRun.status).toBe("COMPLETED");
    expect(auditRun.checks.length).toBeGreaterThanOrEqual(4);
    expect(auditRun.rqiScore).toBeDefined();

    // 3. Persist audit
    await db.saveAudit(auditRun);

    const savedAudit = await db.getAudit(auditRun.id);
    expect(savedAudit).not.toBeNull();
    expect(savedAudit?.projectId).toBe(project.id);
  });

  it("Workflow C & D: Findings Triage into Confirmed Bug & Developer Handoff", async () => {
    const project = await db.createProject({
      userId: "user_demo_1",
      name: "Cart Service",
      targetUrl: "https://example.com",
      environment: "STAGING",
    });

    // Save sample finding in NEEDS_REVIEW
    const finding = await db.saveFinding({
      id: "find_test_101",
      auditRunId: "run_101",
      projectId: project.id,
      testSource: "LINK_CRAWLER",
      title: "Broken Checkout Route (HTTP 500)",
      description: "Checkout button triggers 500 server error",
      recommendedSeverity: "CRITICAL",
      status: "NEEDS_REVIEW",
      createdAt: new Date().toISOString(),
    });

    expect(finding.status).toBe("NEEDS_REVIEW");

    // Human triage: Confirm as Bug
    const confirmedBug = await db.createBug({
      projectId: project.id,
      userId: "user_demo_1",
      sourceFindingId: finding.id,
      title: finding.title,
      description: finding.description,
      affectedUrl: "https://example.com/checkout",
      severity: "CRITICAL",
      status: "OPEN",
      stepsToReproduce: ["1. Open cart", "2. Click checkout"],
      reportedBy: "QA Lead",
    });

    // Update finding status to CONFIRMED
    const updatedFinding = await db.updateFindingStatus(
      finding.id,
      "CONFIRMED",
      "Confirmed reproduction on build 42",
      confirmedBug.id,
      "QA Lead"
    );

    expect(updatedFinding?.status).toBe("CONFIRMED");
    expect(updatedFinding?.convertedBugId).toBe(confirmedBug.id);

    // Verify bug exists in project defect inventory
    const projectBugs = await db.getBugsForProject(project.id);
    expect(projectBugs.length).toBe(1);
    expect(projectBugs[0].id).toBe(confirmedBug.id);
    expect(projectBugs[0].severity).toBe("CRITICAL");

    // Developer Handoff: Generate share token
    const token = db.createShareToken(project.id, undefined, {
      project,
      bugs: projectBugs,
    });

    const shareData = db.getShareTokenData(token);
    expect(shareData).not.toBeNull();
    expect(shareData?.data.bugs[0].id).toBe(confirmedBug.id);
  });

  it("Workflow E: Bug Lifecycle & Retest Verification (PASS -> VERIFIED, FAIL -> REOPENED)", async () => {
    const project = await db.createProject({
      userId: "user_demo_1",
      name: "Auth Service",
      targetUrl: "https://example.com",
      environment: "PRODUCTION",
    });

    const bug = await db.createBug({
      projectId: project.id,
      userId: "user_demo_1",
      title: "Password reset token expires instantly",
      description: "Token TTL set to 0 seconds",
      affectedUrl: "https://example.com/reset",
      severity: "HIGH",
      status: "OPEN",
    });

    // Developer marks bug FIXED
    await db.updateBug(bug.id, { status: "FIXED" });
    const fixedBug = await db.getBug(bug.id);
    expect(fixedBug?.status).toBe("FIXED");

    // Tester executes retest with verdict PASS
    const passRetest = await db.addRetest({
      bugReportId: bug.id,
      userId: "user_demo_1",
      tester: "Senior QA Engineer",
      previousStatus: "FIXED",
      newStatus: "VERIFIED",
      testerVerdict: "PASS",
      testerComment: "Token now has 15-minute TTL as specified.",
    });

    expect(passRetest.testerVerdict).toBe("PASS");

    // Bug status automatically updated to VERIFIED and retest count incremented
    const verifiedBug = await db.getBug(bug.id);
    expect(verifiedBug?.status).toBe("VERIFIED");
    expect(verifiedBug?.retestCount).toBe(1);

    // If a subsequent retest FAILS, bug transitions back to REOPENED
    const failRetest = await db.addRetest({
      bugReportId: bug.id,
      userId: "user_demo_1",
      tester: "Regression Tester",
      previousStatus: "VERIFIED",
      newStatus: "REOPENED",
      testerVerdict: "FAIL",
      testerComment: "Regression observed after deployment 124.",
    });

    expect(failRetest.testerVerdict).toBe("FAIL");

    const reopenedBug = await db.getBug(bug.id);
    expect(reopenedBug?.status).toBe("REOPENED");
    expect(reopenedBug?.retestCount).toBe(2);

    const retestHistory = await db.getRetestHistory(bug.id);
    expect(retestHistory.length).toBe(2);
  });

  it("Workflow F: Release Delta Comparative Analysis & Regression Gating", async () => {
    // Run 1: Clean audit with score 90
    const audit1 = {
      id: "run_alpha",
      projectId: "p1",
      targetUrl: "https://example.com",
      environment: "PREVIEW" as const,
      auditTier: "TIER_1_PUBLIC" as const,
      status: "COMPLETED" as const,
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      checks: [
        {
          id: "c1",
          auditRunId: "run_alpha",
          category: "BROKEN_LINKS" as const,
          checkName: "Broken Links",
          status: "PASS" as const,
          weight: 0.2,
          rawEvidence: { brokenLinks: [] },
          timestamp: new Date().toISOString(),
        },
      ],
      findings: [],
      rqiScore: {
        id: "rqi_alpha",
        auditRunId: "run_alpha",
        releaseVerdict: "VERIFIED_READY" as const,
        qualityScore: 92,
        coveragePercent: 100,
        gateSecurity: "PASS" as const,
        gateFunctional: "PASS" as const,
        openFindingsCount: 0,
        confirmedBugsCount: 0,
        categoryScores: { security: 95, performance: 90, accessibility: 90, links: 90 },
      },
    };

    // Run 2: Regression with broken links and score dropped to 72
    const audit2 = {
      id: "run_beta",
      projectId: "p1",
      targetUrl: "https://example.com",
      environment: "PREVIEW" as const,
      auditTier: "TIER_1_PUBLIC" as const,
      status: "COMPLETED" as const,
      startedAt: new Date().toISOString(),
      checks: [
        {
          id: "c2",
          auditRunId: "run_beta",
          category: "BROKEN_LINKS" as const,
          checkName: "Broken Links",
          status: "FAIL" as const,
          weight: 0.2,
          rawEvidence: { brokenLinks: [{ url: "https://example.com/checkout", statusCode: 500 }] },
          timestamp: new Date().toISOString(),
        },
      ],
      findings: [],
      rqiScore: {
        id: "rqi_beta",
        auditRunId: "run_beta",
        releaseVerdict: "REVIEW_REQUIRED" as const,
        qualityScore: 72,
        coveragePercent: 90,
        gateSecurity: "PASS" as const,
        gateFunctional: "PASS" as const,
        openFindingsCount: 1,
        confirmedBugsCount: 0,
        categoryScores: { security: 90, performance: 75, accessibility: 80, links: 45 },
      },
    };

    const delta = analyzeReleaseDelta(audit2, audit1);

    expect(delta.qualityDelta).toBe(-20); // 72 - 92
    expect(delta.verdictChanged).toBe(true);
    expect(delta.newBrokenLinks).toContain("https://example.com/checkout");
    expect(delta.notes.some((n) => n.includes("regressed by 20 points"))).toBe(true);
  });
});
