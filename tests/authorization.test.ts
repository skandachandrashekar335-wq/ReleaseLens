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

describe("Strict Multi-Tenant API Authorization & Security Audit", () => {
  let aliceId = "usr_alice_auth_test";
  let bobId = "usr_bob_auth_test";
  let aliceProject: any;
  let aliceFinding: any;
  let aliceBug: any;

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
  });

  it("Enforces tenant isolation on GET /api/projects/[id] when accessed by Bob", async () => {
    // Mock Bob's session
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

  it("Enforces tenant isolation on DELETE /api/projects/[id] when attempted by Bob", async () => {
    vi.spyOn(sessionModule, "getAuthSession").mockResolvedValueOnce({
      user: { id: bobId, email: "bob@evilcorp.com", name: "Bob", role: "tester", createdAt: new Date().toISOString() },
      sessionToken: "bob_token",
      isAuthenticated: true,
    });

    const res = await deleteProject(new NextRequest("http://localhost/api/projects/" + aliceProject.id), {
      params: Promise.resolve({ id: aliceProject.id }),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("Forbidden: Tenant isolation violation");
  });

  it("Blocks Bob from triggering an audit on Alice's private project", async () => {
    vi.spyOn(sessionModule, "getAuthSession").mockResolvedValueOnce({
      user: { id: bobId, email: "bob@evilcorp.com", name: "Bob", role: "tester", createdAt: new Date().toISOString() },
      sessionToken: "bob_token",
      isAuthenticated: true,
    });

    const res = await triggerAudit(new NextRequest("http://localhost/api/projects/" + aliceProject.id + "/audit", { method: "POST" }), {
      params: Promise.resolve({ id: aliceProject.id }),
    });

    expect(res.status).toBe(403);
  });

  it("Blocks Bob from retrieving Alice's project audits", async () => {
    vi.spyOn(sessionModule, "getAuthSession").mockResolvedValueOnce({
      user: { id: bobId, email: "bob@evilcorp.com", name: "Bob", role: "tester", createdAt: new Date().toISOString() },
      sessionToken: "bob_token",
      isAuthenticated: true,
    });

    const res = await getAudits(new NextRequest("http://localhost/api/projects/" + aliceProject.id + "/audit"), {
      params: Promise.resolve({ id: aliceProject.id }),
    });

    expect(res.status).toBe(403);
  });

  it("Blocks Bob from querying findings of Alice's project", async () => {
    vi.spyOn(sessionModule, "getAuthSession").mockResolvedValueOnce({
      user: { id: bobId, email: "bob@evilcorp.com", name: "Bob", role: "tester", createdAt: new Date().toISOString() },
      sessionToken: "bob_token",
      isAuthenticated: true,
    });

    const req = new NextRequest(`http://localhost/api/findings?projectId=${aliceProject.id}`);
    const res = await getFindings(req);

    expect(res.status).toBe(403);
  });

  it("Blocks Bob from modifying or confirming Alice's findings", async () => {
    vi.spyOn(sessionModule, "getAuthSession").mockResolvedValueOnce({
      user: { id: bobId, email: "bob@evilcorp.com", name: "Bob", role: "tester", createdAt: new Date().toISOString() },
      sessionToken: "bob_token",
      isAuthenticated: true,
    });

    const req = new NextRequest(`http://localhost/api/findings/${aliceFinding.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "CONFIRMED", triageNotes: "Malicious modification" }),
    });
    const res = await updateFinding(req, { params: Promise.resolve({ id: aliceFinding.id }) });

    expect(res.status).toBe(403);
  });

  it("Blocks Bob from retrieving bugs for Alice's project", async () => {
    vi.spyOn(sessionModule, "getAuthSession").mockResolvedValueOnce({
      user: { id: bobId, email: "bob@evilcorp.com", name: "Bob", role: "tester", createdAt: new Date().toISOString() },
      sessionToken: "bob_token",
      isAuthenticated: true,
    });

    const req = new NextRequest(`http://localhost/api/bugs?projectId=${aliceProject.id}`);
    const res = await getBugs(req);

    expect(res.status).toBe(403);
  });

  it("Blocks Bob from viewing or patching Alice's bug", async () => {
    vi.spyOn(sessionModule, "getAuthSession").mockResolvedValue({
      user: { id: bobId, email: "bob@evilcorp.com", name: "Bob", role: "tester", createdAt: new Date().toISOString() },
      sessionToken: "bob_token",
      isAuthenticated: true,
    });

    const getRes = await getBug(new NextRequest(`http://localhost/api/bugs/${aliceBug.id}`), {
      params: Promise.resolve({ id: aliceBug.id }),
    });
    expect(getRes.status).toBe(403);

    const patchReq = new NextRequest(`http://localhost/api/bugs/${aliceBug.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "FIXED" }),
    });
    const patchRes = await updateBug(patchReq, { params: Promise.resolve({ id: aliceBug.id }) });
    expect(patchRes.status).toBe(403);
  });

  it("Blocks Bob from submitting retest verification for Alice's bug", async () => {
    vi.spyOn(sessionModule, "getAuthSession").mockResolvedValueOnce({
      user: { id: bobId, email: "bob@evilcorp.com", name: "Bob", role: "tester", createdAt: new Date().toISOString() },
      sessionToken: "bob_token",
      isAuthenticated: true,
    });

    const req = new NextRequest(`http://localhost/api/bugs/${aliceBug.id}/retest`, {
      method: "POST",
      body: JSON.stringify({ testerVerdict: "PASS", testerComment: "Fake pass" }),
    });
    const res = await retestBug(req, { params: Promise.resolve({ id: aliceBug.id }) });

    expect(res.status).toBe(403);
  });

  it("Blocks Bob from generating a share token for Alice's project", async () => {
    vi.spyOn(sessionModule, "getAuthSession").mockResolvedValueOnce({
      user: { id: bobId, email: "bob@evilcorp.com", name: "Bob", role: "tester", createdAt: new Date().toISOString() },
      sessionToken: "bob_token",
      isAuthenticated: true,
    });

    const req = new NextRequest("http://localhost/api/reports/share", {
      method: "POST",
      body: JSON.stringify({ projectId: aliceProject.id }),
    });
    const res = await createShareToken(req);

    expect(res.status).toBe(403);
  });

  it("Blocks Bob from chatting with the AI assistant about Alice's project", async () => {
    vi.spyOn(sessionModule, "getAuthSession").mockResolvedValueOnce({
      user: { id: bobId, email: "bob@evilcorp.com", name: "Bob", role: "tester", createdAt: new Date().toISOString() },
      sessionToken: "bob_token",
      isAuthenticated: true,
    });

    const req = new NextRequest("http://localhost/api/assistant/chat", {
      method: "POST",
      body: JSON.stringify({ projectId: aliceProject.id, message: "Summarize vulnerabilities" }),
    });
    const res = await assistantChat(req);

    expect(res.status).toBe(403);
  });

  it("Returns 404 for invalid resource IDs across all endpoints", async () => {
    const invalidId = "invalid_non_existent_resource_999";

    const pRes = await getProject(new NextRequest("http://localhost/api/projects/" + invalidId), {
      params: Promise.resolve({ id: invalidId }),
    });
    expect(pRes.status).toBe(404);

    const bRes = await getBug(new NextRequest("http://localhost/api/bugs/" + invalidId), {
      params: Promise.resolve({ id: invalidId }),
    });
    expect(bRes.status).toBe(404);

    const fRes = await updateFinding(
      new NextRequest("http://localhost/api/findings/" + invalidId, { method: "PATCH", body: JSON.stringify({ status: "CONFIRMED" }) }),
      { params: Promise.resolve({ id: invalidId }) }
    );
    expect(fRes.status).toBe(404);

    const rRes = await retestBug(
      new NextRequest("http://localhost/api/bugs/" + invalidId + "/retest", { method: "POST", body: JSON.stringify({ testerVerdict: "PASS" }) }),
      { params: Promise.resolve({ id: invalidId }) }
    );
    expect(rRes.status).toBe(404);

    const sRes = await getSharedReport(new NextRequest("http://localhost/api/reports/shared/" + invalidId), {
      params: Promise.resolve({ token: invalidId }),
    });
    expect(sRes.status).toBe(404);
  });

  it("Ignores client-supplied spoofed userId on project creation and bug creation", async () => {
    // Bob tries to spoof Alice's userId in request body
    vi.spyOn(sessionModule, "getAuthSession").mockResolvedValue({
      user: { id: bobId, email: "bob@evilcorp.com", name: "Bob", role: "tester", createdAt: new Date().toISOString() },
      sessionToken: "bob_token",
      isAuthenticated: true,
    });

    // 1. Project creation with spoofed userId
    const projectReq = new NextRequest("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify({
        name: "Bob Malicious Project",
        targetUrl: "https://example.org",
        userId: aliceId, // Attempted spoof!
      }),
    });
    const projectRes = await createProject(projectReq);
    expect(projectRes.status).toBe(201);
    const createdProject = await projectRes.json();
    // Must be assigned to Bob (the session user), NOT Alice!
    expect(createdProject.userId).toBe(bobId);
    expect(createdProject.userId).not.toBe(aliceId);

    // 2. Bug creation with spoofed userId
    const bugReq = new NextRequest("http://localhost/api/bugs", {
      method: "POST",
      body: JSON.stringify({
        projectId: createdProject.id,
        title: "Bob Bug",
        userId: "admin_superuser", // Attempted spoof!
      }),
    });
    const bugRes = await createBug(bugReq);
    expect(bugRes.status).toBe(201);
    const createdBug = await bugRes.json();
    expect(createdBug.userId).toBe(bobId);
    expect(createdBug.userId).not.toBe("admin_superuser");
  });
});
