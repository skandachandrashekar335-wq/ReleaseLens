import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import { PersistentDataStore } from "../src/lib/store/db-adapter";
import { SupabaseDataStore } from "../src/lib/store/supabase-adapter";
import { executeAutomatedAudit } from "../src/lib/engine/audit-runner";
import { analyzeReleaseDelta } from "../src/lib/engine/delta-analyzer";

describe("ReleaseLens Full E2E Cloud Workflow & Persistence Integration", () => {
  const testDbPath = "./data/test_e2e.db";
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

  it("proves complete end-to-end QA flow from registration to retest and shared report", async () => {
    // 1. User & Project Registration
    const user = await db.createUser({
      id: "usr_lead_qa",
      email: "lead.qa@company.com",
      name: "Lead QA Engineer",
      role: "lead_qa",
    });
    expect(user.id).toBe("usr_lead_qa");

    const project = await db.createProject({
      userId: user.id,
      name: "Staging Preview Storefront",
      targetUrl: "https://example.com",
      environment: "PREVIEW",
      isVerified: true,
    });
    expect(project.id).toMatch(/^proj_\d+_[a-f0-9-]+$/);
    expect(project.verificationToken).toMatch(/^rl_verify_[a-f0-9]+$/);

    // 2. Autonomous Cloud Audit Execution
    const auditRun = await executeAutomatedAudit({
      projectId: project.id,
      targetUrl: project.targetUrl,
      environment: project.environment,
      auditTier: "TIER_2_VERIFIED",
      skipBrowserWorker: true,
    });
    expect(auditRun.status).toBe("COMPLETED");
    expect(auditRun.checks.length).toBeGreaterThanOrEqual(4);
    await db.saveAudit(auditRun);

    // 3. Human Findings Review & Bug Promotion
    const finding = await db.saveFinding({
      id: `find_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
      auditRunId: auditRun.id,
      projectId: project.id,
      testSource: "SECURITY_HEADERS",
      affectedUrl: project.targetUrl,
      title: "Missing Content-Security-Policy (CSP) Header",
      description: "App does not define CSP, exposing users to cross-site scripting risks.",
      recommendedSeverity: "HIGH",
      suggestedSeverity: "HIGH",
      confidence: "HIGH",
      status: "NEEDS_REVIEW",
      createdAt: new Date().toISOString(),
    });
    expect(finding.status).toBe("NEEDS_REVIEW");

    // Triage finding -> CONFIRMED
    const bug = await db.createBug({
      projectId: project.id,
      userId: user.id,
      sourceFindingId: finding.id,
      title: finding.title,
      description: finding.description,
      affectedUrl: finding.affectedUrl || project.targetUrl,
      severity: "HIGH",
      status: "OPEN",
    });
    expect(bug.id).toMatch(/^bug_\d+_[a-f0-9-]+$/);
    expect(bug.status).toBe("OPEN");

    await db.updateFindingStatus(finding.id, "CONFIRMED", "Triaged by Lead QA", bug.id, user.name);
    const triagedFinding = await db.getFinding(finding.id);
    expect(triagedFinding?.status).toBe("CONFIRMED");
    expect(triagedFinding?.convertedBugId).toBe(bug.id);

    // 4. Retest Cycle Execution
    const retest = await db.addRetest({
      bugReportId: bug.id,
      userId: user.id,
      tester: user.name,
      previousStatus: "OPEN",
      newStatus: "VERIFIED",
      testerVerdict: "PASS",
      testerComment: "Fix verified in deploy build #8892",
    });
    expect(retest.testerVerdict).toBe("PASS");
    expect(retest.id).toMatch(/^retest_\d+_[a-f0-9-]+$/);

    const updatedBug = await db.getBug(bug.id);
    expect(updatedBug?.status).toBe("VERIFIED");
    expect(updatedBug?.retestCount).toBe(1);

    // 5. Release Delta Regression Analysis
    const subsequentAudit = await executeAutomatedAudit({
      projectId: project.id,
      targetUrl: project.targetUrl,
      environment: project.environment,
      auditTier: "TIER_2_VERIFIED",
      skipBrowserWorker: true,
    });
    const delta = analyzeReleaseDelta(subsequentAudit, auditRun);
    expect(delta.notes).toBeDefined();
    expect(delta.newBrokenLinks).toEqual([]);

    // 6. Developer Permapage Sharing
    const shareToken = db.createShareToken(project.id, auditRun.id, {
      verdict: "VERIFIED_READY",
      summary: "Production-ready release handoff",
    });
    expect(shareToken).toMatch(/^share_[a-f0-9]+$/);
    const shareData = db.getShareTokenData(shareToken);
    expect(shareData).not.toBeNull();
    expect(shareData?.projectId).toBe(project.id);
  });

  it("verifies Supabase adapter rejects missing credentials without silent SQLite fallback in production", () => {
    // When credentials are missing or placeholder, SupabaseDataStore MUST throw
    expect(() => {
      new SupabaseDataStore("https://placeholder.supabase.co", "placeholder-key");
    }).toThrow("Silent fallback disabled in production");

    expect(() => {
      new SupabaseDataStore("", "");
    }).toThrow("Valid NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  });
});
