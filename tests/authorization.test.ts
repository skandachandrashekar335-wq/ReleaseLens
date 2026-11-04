import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../src/lib/store/db-adapter";
import * as sessionModule from "../src/lib/auth/session";
import { GET as getProjects, POST as createProject } from "../src/app/api/projects/route";
import { GET as getProject, DELETE as deleteProject } from "../src/app/api/projects/[id]/route";
import { GET as getAudits, POST as triggerAudit } from "../src/app/api/projects/[id]/audit/route";
import { GET as getFindings } from "../src/app/api/findings/route";
import { PATCH as updateFinding } from "../src/app/api/findings/[id]/route";
import { GET as getBugs, POST as createBug } from "../src/app/api/bugs/route";
import { GET as getBug, PATCH as updateBug } from "../src/app/api/bugs/[id]/route";
import { POST as retestBug } from "../src/app/api/bugs/[id]/retest/route";
import { POST as createShareToken } from "../src/app/api/reports/share/route";
import { GET as getSharedReport } from "../src/app/api/reports/shared/[token]/route";
import { POST as assistantChat } from "../src/app/api/assistant/chat/route";
import { SupabaseDataStore } from "../src/lib/store/supabase-adapter";

describe("Strict Multi-Tenant API Authorization & Security Audit", () => {
  let aliceId = "usr_alice_auth_test";
  let bobId = "usr_bob_auth_test";
  let aliceProject: any;
  let aliceFinding: any;
  let aliceBug: any;
  let demoPrivateProject: any;
  let demoFinding: any;
  let demoBug: any;

  beforeEach(async () => {
    // Ensure Alice and Bob exist in users table to satisfy relational foreign key constraints
    let userA = await db.getUser(aliceId);
    if (!userA) {
      await db.createUser({ id: aliceId, email: "alice@company.com", name: "Alice", role: "qa_lead" });
    }
    let userB = await db.getUser(bobId);
    if (!userB) {
      await db.createUser({ id: bobId, email: "bob@evilcorp.com", name: "Bob", role: "tester" });
    }

    // Setup Alice's private project
    aliceProject = await db.createProject({
      userId: aliceId,
      name: "Alice Financial Vault",
      targetUrl: "https://vault.alice.local",
      environment: "PRODUCTION",
    });

    // Create a finding under Alice's project
    aliceFinding = await db.saveFinding({
      id: `fnd_alice_${Date.now()}`,
      auditRunId: `aud_alice_${Date.now()}`,
      projectId: aliceProject.id,
      testSource: "SECURITY_HEADER",
      title: "Missing CSP header in Alice Vault",
      description: "Missing Content-Security-Policy header in HTTP response",
      confidence: "HIGH",
      status: "NEEDS_REVIEW",
      evidence: {},
      createdAt: new Date().toISOString(),
    });

    // Create a bug under Alice's project
    aliceBug = await db.createBug({
      projectId: aliceProject.id,
      userId: aliceId,
      title: "Alice Vault Balance Overflow",
      description: "Critical integer overflow defect",
      affectedUrl: "https://vault.alice.local/balance",
      severity: "CRITICAL",
      status: "OPEN",
    });

    // Setup a demo-owned private project (NOT the public proj_hackathon_demo)
    demoPrivateProject = await db.createProject({
      userId: "user_demo_1",
      name: "Demo Internal Private Project",
      targetUrl: "https://internal-demo.releaselens.local",
      environment: "PRODUCTION",
    });

    // Seed a finding and bug under public proj_hackathon_demo
    demoFinding = await db.saveFinding({
      id: `fnd_demo_${Date.now()}`,
      auditRunId: `aud_demo_${Date.now()}`,
      projectId: "proj_hackathon_demo",
      testSource: "ROUTER_PROBE",
      title: "Public Demo Navigation Defect",
      description: "Public demo finding description",
      confidence: "MEDIUM",
      status: "NEEDS_REVIEW",
      evidence: {},
      createdAt: new Date().toISOString(),
    });

    demoBug = await db.createBug({
      projectId: "proj_hackathon_demo",
      userId: "user_demo_1",
      title: "Public Demo Checkout Glitch",
      description: "Cart defect in public demo",
      affectedUrl: "https://demo.releaselens.dev/cart",
      severity: "HIGH",
      status: "OPEN",
    });
  });

  it("1. Alice cannot read Bob's project (Tenant Isolation)", async () => {
    // Bob tries to read Alice's project
    vi.spyOn(sessionModule, "getAuthSession").mockResolvedValueOnce({
      user: { id: bobId, email: "bob@evilcorp.com", name: "Bob", role: "tester", createdAt: new Date().toISOString() },
      sessionToken: "bob_token",
      isAuthenticated: true,
    });

    const res = await getProject(new NextRequest("http://localhost/api/projects/" + aliceProject.id), {
      params: Promise.resolve({ id: aliceProject.id }),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("Forbidden: Tenant isolation violation");
  });

  it("2. Bob cannot read demo-owned private projects", async () => {
    vi.spyOn(sessionModule, "getAuthSession").mockResolvedValueOnce({
      user: { id: bobId, email: "bob@evilcorp.com", name: "Bob", role: "tester", createdAt: new Date().toISOString() },
      sessionToken: "bob_token",
      isAuthenticated: true,
    });

    const res = await getProject(new NextRequest("http://localhost/api/projects/" + demoPrivateProject.id), {
      params: Promise.resolve({ id: demoPrivateProject.id }),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("Forbidden: Tenant isolation violation");
  });

  it("3. Alice cannot modify demo-owned projects (DELETE blocked)", async () => {
    vi.spyOn(sessionModule, "getAuthSession").mockResolvedValueOnce({
      user: { id: aliceId, email: "alice@company.com", name: "Alice", role: "qa_lead", createdAt: new Date().toISOString() },
      sessionToken: "alice_token",
      isAuthenticated: true,
    });

    const res = await deleteProject(new NextRequest("http://localhost/api/projects/proj_hackathon_demo"), {
      params: Promise.resolve({ id: "proj_hackathon_demo" }),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("Forbidden");
  });

  it("4. Demo access cannot modify findings or bugs", async () => {
    vi.spyOn(sessionModule, "getAuthSession").mockResolvedValue({
      user: { id: aliceId, email: "alice@company.com", name: "Alice", role: "qa_lead", createdAt: new Date().toISOString() },
      sessionToken: "alice_token",
      isAuthenticated: true,
    });

    // 4a: Alice tries to mutate finding in demo project
    const fRes = await updateFinding(
      new NextRequest(`http://localhost/api/findings/${demoFinding.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "CONFIRMED", triageNotes: "Unauthorized modification" }),
      }),
      { params: Promise.resolve({ id: demoFinding.id }) }
    );
    expect(fRes.status).toBe(403);

    // 4b: Alice tries to mutate bug in demo project
    const bRes = await updateBug(
      new NextRequest(`http://localhost/api/bugs/${demoBug.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "CLOSED" }),
      }),
      { params: Promise.resolve({ id: demoBug.id }) }
    );
    expect(bRes.status).toBe(403);
  });

  it("5. Demo access cannot trigger audits or retests", async () => {
    vi.spyOn(sessionModule, "getAuthSession").mockResolvedValue({
      user: { id: aliceId, email: "alice@company.com", name: "Alice", role: "qa_lead", createdAt: new Date().toISOString() },
      sessionToken: "alice_token",
      isAuthenticated: true,
    });

    // 5a: Attempting to trigger audit on demo project
    const aRes = await triggerAudit(
      new NextRequest("http://localhost/api/projects/proj_hackathon_demo/audit", { method: "POST" }),
      { params: Promise.resolve({ id: "proj_hackathon_demo" }) }
    );
    expect(aRes.status).toBe(403);

    // 5b: Attempting to record retest on demo bug
    const rRes = await retestBug(
      new NextRequest(`http://localhost/api/bugs/${demoBug.id}/retest`, {
        method: "POST",
        body: JSON.stringify({ testerVerdict: "PASS", testerComment: "Fake pass" }),
      }),
      { params: Promise.resolve({ id: demoBug.id }) }
    );
    expect(rRes.status).toBe(403);
  });

  it("6. Unauthenticated users cannot access private resources (401 Unauthorized)", async () => {
    vi.spyOn(sessionModule, "getAuthSession").mockResolvedValue({
      user: null,
      sessionToken: null,
      isAuthenticated: false,
    });

    // 6a: Projects list
    const pList = await getProjects();
    expect(pList.status).toBe(401);

    // 6b: Private project detail
    const pDetail = await getProject(new NextRequest("http://localhost/api/projects/" + aliceProject.id), {
      params: Promise.resolve({ id: aliceProject.id }),
    });
    expect(pDetail.status).toBe(401);

    // 6c: Private project findings
    const pFindings = await getFindings(new NextRequest(`http://localhost/api/findings?projectId=${aliceProject.id}`));
    expect(pFindings.status).toBe(401);

    // 6d: Private project bugs
    const pBugs = await getBugs(new NextRequest(`http://localhost/api/bugs?projectId=${aliceProject.id}`));
    expect(pBugs.status).toBe(401);

    // 6e: Private project audit execution
    const pAudit = await triggerAudit(new NextRequest(`http://localhost/api/projects/${aliceProject.id}/audit`, { method: "POST" }), {
      params: Promise.resolve({ id: aliceProject.id }),
    });
    expect(pAudit.status).toBe(401);
  });

  it("7. Public shared reports expose only approved report fields and zero workspace secrets", async () => {
    vi.spyOn(sessionModule, "getAuthSession").mockResolvedValueOnce({
      user: { id: aliceId, email: "alice@company.com", name: "Alice", role: "qa_lead", createdAt: new Date().toISOString() },
      sessionToken: "alice_token",
      isAuthenticated: true,
    });

    const shareReq = new NextRequest("http://localhost/api/reports/share", {
      method: "POST",
      body: JSON.stringify({ projectId: aliceProject.id }),
    });
    const shareRes = await createShareToken(shareReq);
    expect(shareRes.status).toBe(201);
    const { token } = await shareRes.json();

    // Fetch shared report via public endpoint without authentication
    const reportRes = await getSharedReport(new NextRequest(`http://localhost/api/reports/shared/${token}`), {
      params: Promise.resolve({ token }),
    });
    expect(reportRes.status).toBe(200);
    const report = await reportRes.json();

    // Verify sanitized structure
    expect(report.project).toBeDefined();
    expect(report.project.id).toBe(aliceProject.id);
    expect(report.project.name).toBe(aliceProject.name);
    expect(report.project.targetUrl).toBe(aliceProject.targetUrl);

    // SECURITY CHECK: verificationToken and userId MUST be undefined (not leaked)
    expect(report.project.verificationToken).toBeUndefined();
    expect(report.project.userId).toBeUndefined();

    // SECURITY CHECK: Bugs must not leak userId
    if (report.bugs && report.bugs.length > 0) {
      expect(report.bugs[0].userId).toBeUndefined();
    }
  });

  it("8. Normal project creation assigns the authenticated user's ID and rejects spoofing", async () => {
    vi.spyOn(sessionModule, "getAuthSession").mockResolvedValue({
      user: { id: bobId, email: "bob@evilcorp.com", name: "Bob", role: "tester", createdAt: new Date().toISOString() },
      sessionToken: "bob_token",
      isAuthenticated: true,
    });

    const projectReq = new NextRequest("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify({
        name: "Bob Legitimate Project",
        targetUrl: "https://bob-project.vercel.app",
        userId: "hacked_admin_id", // Client spoof attempt!
      }),
    });
    const projectRes = await createProject(projectReq);
    expect(projectRes.status).toBe(201);
    const created = await projectRes.json();

    expect(created.userId).toBe(bobId);
    expect(created.userId).not.toBe("hacked_admin_id");
    expect(created.userId).not.toBe("user_demo_1");
  });

  it("9. SupabaseDataStore contract verification: Queries strictly filter by session userId without user_demo_1", async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockResolvedValue({ data: [], error: null });

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: mockSelect,
        order: mockOrder,
        eq: mockEq,
      }),
    };

    const store = new SupabaseDataStore("https://mock-test.supabase.co", "mock-service-key");
    (store as any).client = mockClient;

    await store.getProjects(aliceId);

    expect(mockClient.from).toHaveBeenCalledWith("projects");
    expect(mockEq).toHaveBeenCalledWith("user_id", aliceId);
    // Crucial check: user_demo_1 must NOT be queried
    expect(mockEq).not.toHaveBeenCalledWith("user_id", "user_demo_1");
  });
});
