import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import { PersistentDataStore } from "../src/lib/store/db-adapter";
import { validateTargetUrl } from "../src/lib/engine/ssrf-guard";
import { inspectTlsCertificate } from "../src/lib/engine/tls-inspector";
import { calculateRqiScore } from "../src/lib/engine/rqi-calculator";

describe("Real Failure Modes & Edge Case Resilience", () => {
  const testDbPath = "./data/test_failures.db";
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

  it("handles malformed and non-HTTP URLs safely", async () => {
    const invalidUrl1 = await validateTargetUrl("not-a-valid-url");
    expect(invalidUrl1.isAllowed).toBe(false);

    const invalidUrl2 = await validateTargetUrl("ftp://ftp.example.com/file");
    expect(invalidUrl2.isAllowed).toBe(false);
    expect(invalidUrl2.reason).toContain("Unsupported protocol");

    const invalidUrl3 = await validateTargetUrl("javascript:alert(1)");
    expect(invalidUrl3.isAllowed).toBe(false);
  });

  it("handles unreachable domains during TLS inspection without unhandled promise crashes", async () => {
    const unreachableUrl = "https://this-domain-does-not-exist-at-all-889922.com";
    const result = await inspectTlsCertificate(unreachableUrl, "run_fail_1");

    expect(["FAIL", "INCONCLUSIVE"]).toContain(result.check.status);
    expect(result.daysRemaining).toBe(0);
    expect(result.check.errorMessage).toBeDefined();
  });

  it("returns null safely when requesting non-existent resources from store", async () => {
    const nonExistentProject = await db.getProject("proj_does_not_exist");
    expect(nonExistentProject).toBeNull();

    const nonExistentFinding = await db.getFinding("find_does_not_exist");
    expect(nonExistentFinding).toBeNull();

    const nonExistentBug = await db.getBug("bug_does_not_exist");
    expect(nonExistentBug).toBeNull();

    const nonExistentShare = db.getShareTokenData("share_invalid_token_xyz");
    expect(nonExistentShare).toBeNull();
  });

  it("safely enforces hard release block (RELEASE_BLOCKED) when zero checks run or all fail", () => {
    const emptyRqi = calculateRqiScore({
      auditRunId: "run_empty",
      checks: [],
      findings: [],
      confirmedBugs: [],
      tlsDaysRemaining: 0, // Fails security gate
      httpsEnforced: false,
      clickjackingProtected: false,
    });

    expect(emptyRqi.gateSecurity).toBe("FAIL");
    expect(emptyRqi.releaseVerdict).toBe("RELEASE_BLOCKED");
    expect(emptyRqi.overallScore).toBeNull();
  });

  it("handles duplicate share tokens gracefully without database collisions", async () => {
    const proj = await db.createProject({
      userId: "user_demo_1",
      name: "Test Project",
      targetUrl: "https://example.com",
      environment: "PRODUCTION",
      isVerified: true,
    });

    const token1 = db.createShareToken(proj.id);
    const token2 = db.createShareToken(proj.id);

    expect(token1).not.toBe(token2);
    expect(db.getShareTokenData(token1)).not.toBeNull();
    expect(db.getShareTokenData(token2)).not.toBeNull();
  });
});
