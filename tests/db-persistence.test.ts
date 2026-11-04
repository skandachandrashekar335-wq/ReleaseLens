import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { PersistentDataStore } from "../src/lib/store/db-adapter";

describe("Persistent Database & Tenant Isolation (node:sqlite)", () => {
  const testDbPath = "./data/test_persistence.db";

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch {}
    }
  });

  it("proves that records survive server restarts (database closure and reopen)", async () => {
    // 1. First process / instance creates project and bug
    const db1 = new PersistentDataStore(testDbPath);
    const user = await db1.createUser({
      id: "usr_alice",
      email: "alice@company.com",
      name: "Alice QA",
      role: "tester",
    });

    const project = await db1.createProject({
      userId: user.id,
      name: "Production Storefront",
      targetUrl: "https://storefront.example.com",
      environment: "PRODUCTION",
      isVerified: true,
    });

    const bug = await db1.createBug({
      projectId: project.id,
      userId: user.id,
      title: "Cart counter resets on page refresh",
      description: "Local storage persistence fails.",
      affectedUrl: "https://storefront.example.com/cart",
      severity: "CRITICAL",
      status: "OPEN",
    });

    // Close db connection to simulate server process termination
    db1.close();

    // 2. Second process / instance boots up from the same file
    const db2 = new PersistentDataStore(testDbPath);

    // Verify user survived
    const retrievedUser = await db2.getUser("usr_alice");
    expect(retrievedUser).not.toBeNull();
    expect(retrievedUser?.email).toBe("alice@company.com");

    // Verify project survived
    const retrievedProject = await db2.getProject(project.id);
    expect(retrievedProject).not.toBeNull();
    expect(retrievedProject?.name).toBe("Production Storefront");

    // Verify bug survived
    const retrievedBug = await db2.getBug(bug.id);
    expect(retrievedBug).not.toBeNull();
    expect(retrievedBug?.title).toBe("Cart counter resets on page refresh");
    expect(retrievedBug?.severity).toBe("CRITICAL");

    db2.close();
  });

  it("enforces tenant isolation between users (User B cannot access User A projects)", async () => {
    const db = new PersistentDataStore(testDbPath);

    // Create User Alice
    await db.createUser({ id: "alice", email: "alice@test.com", name: "Alice", role: "tester" });
    // Create User Bob
    await db.createUser({ id: "bob", email: "bob@test.com", name: "Bob", role: "tester" });

    // Alice creates a private project
    const aliceProject = await db.createProject({
      userId: "alice",
      name: "Alice Secret App",
      targetUrl: "https://alice.internal",
      environment: "STAGING",
    });

    // Alice can see her own project
    const aliceProjects = await db.getProjects("alice");
    expect(aliceProjects.some((p) => p.id === aliceProject.id)).toBe(true);

    // Bob CANNOT see Alice's project in his list
    const bobProjects = await db.getProjects("bob");
    expect(bobProjects.some((p) => p.id === aliceProject.id)).toBe(false);

    // Bob cannot fetch Alice's project with his user ID
    const unauthorizedFetch = await db.getProject(aliceProject.id, "bob");
    expect(unauthorizedFetch).toBeNull();

    // Bob cannot delete Alice's project with his user ID
    const deleteAttempt = await db.deleteProject(aliceProject.id, "bob");
    expect(deleteAttempt).toBe(false);

    // Project still exists for Alice
    const stillExists = await db.getProject(aliceProject.id, "alice");
    expect(stillExists).not.toBeNull();

    db.close();
  });

  it("handles share token creation, retrieval, and 30-day expiration", async () => {
    const db = new PersistentDataStore(testDbPath);
    const token = db.createShareToken("proj_hackathon_demo", undefined, {
      summary: "Verified Handoff Package",
      verdict: "PROVISIONAL_PASS",
    });

    expect(token).toMatch(/^share_/);

    const tokenData = db.getShareTokenData(token);
    expect(tokenData).not.toBeNull();
    expect(tokenData?.projectId).toBe("proj_hackathon_demo");
    expect(tokenData?.data.verdict).toBe("PROVISIONAL_PASS");

    // Invalid token returns null
    const invalid = db.getShareTokenData("invalid_non_existent_token");
    expect(invalid).toBeNull();

    db.close();
  });
});
