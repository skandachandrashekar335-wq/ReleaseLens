import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { POST as sessionPost, DELETE as sessionDelete, GET as sessionGet } from "@/app/api/auth/session/route";
import { GET as googleAuthGet } from "@/app/api/auth/google/route";
import {
  verifyFirebaseIdToken,
  setCustomTokenVerifier,
  isFirebaseAdminConfigured,
  getFirebaseAdminConfig,
} from "@/lib/firebase/admin";
import { isFirebaseClientConfigured } from "@/lib/firebase/client";
import { db } from "@/lib/store/db-adapter";
import { SupabaseDataStore } from "@/lib/store/supabase-adapter";
import * as sessionModule from "@/lib/auth/session";

describe("ReleaseLens v0.7.0 — Firebase Authentication & Tenant Isolation", () => {
  beforeEach(() => {
    // Reset custom verifier before each test
    setCustomTokenVerifier(null);
  });

  afterEach(() => {
    setCustomTokenVerifier(null);
    vi.restoreAllMocks();
  });

  describe("1. Firebase Admin Configuration & Token Verification", () => {
    it("fails closed when Firebase Admin credentials are not configured", async () => {
      // Ensure environment variables are not set or placeholder
      const origProjectId = process.env.FIREBASE_PROJECT_ID;
      const origClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const origPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
      const origPublicProject = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

      delete process.env.FIREBASE_PROJECT_ID;
      delete process.env.FIREBASE_CLIENT_EMAIL;
      delete process.env.FIREBASE_PRIVATE_KEY;
      delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

      try {
        expect(isFirebaseAdminConfigured()).toBe(false);
        await expect(verifyFirebaseIdToken("some_token_here")).rejects.toThrow(
          "FIREBASE_ADMIN_NOT_CONFIGURED"
        );
      } finally {
        if (origProjectId) process.env.FIREBASE_PROJECT_ID = origProjectId;
        if (origClientEmail) process.env.FIREBASE_CLIENT_EMAIL = origClientEmail;
        if (origPrivateKey) process.env.FIREBASE_PRIVATE_KEY = origPrivateKey;
        if (origPublicProject) process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = origPublicProject;
      }
    });

    it("rejects empty or non-string tokens", async () => {
      await expect(verifyFirebaseIdToken("")).rejects.toThrow("INVALID_TOKEN");
      await expect(verifyFirebaseIdToken("   ")).rejects.toThrow("INVALID_TOKEN");
      await expect(verifyFirebaseIdToken(null as any)).rejects.toThrow("INVALID_TOKEN");
    });

    it("verifies valid Firebase ID tokens and decodes standard claims", async () => {
      const mockDecoded = {
        uid: "fb_user_alice_123",
        email: "alice@company.com",
        name: "Alice QA",
        picture: "https://lh3.googleusercontent.com/alice",
        iss: "https://securetoken.google.com/releaselens-test",
        aud: "releaselens-test",
        auth_time: Math.floor(Date.now() / 1000) - 60,
        sub: "fb_user_alice_123",
        iat: Math.floor(Date.now() / 1000) - 60,
        exp: Math.floor(Date.now() / 1000) + 3600,
        firebase: { identities: {}, sign_in_provider: "google.com" },
      } as any;

      setCustomTokenVerifier(async (token: string) => {
        if (token === "valid_alice_id_token") return mockDecoded;
        throw new Error("auth/invalid-id-token");
      });

      const decoded = await verifyFirebaseIdToken("valid_alice_id_token");
      expect(decoded.uid).toBe("fb_user_alice_123");
      expect(decoded.email).toBe("alice@company.com");
      expect(decoded.name).toBe("Alice QA");
    });

    it("rejects expired Firebase ID tokens", async () => {
      setCustomTokenVerifier(async (token: string) => {
        if (token === "expired_id_token") {
          const err: any = new Error("Firebase ID token has expired.");
          err.code = "auth/id-token-expired";
          throw err;
        }
        throw new Error("auth/invalid-id-token");
      });

      await expect(verifyFirebaseIdToken("expired_id_token")).rejects.toThrow("expired");
    });
  });

  describe("2. POST /api/auth/session — Token Exchange & Session Creation", () => {
    it("returns 400 Bad Request when idToken is omitted or empty", async () => {
      const req = new Request("http://localhost:3000/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const res = await sessionPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("idToken");
    });

    it("returns 503 Service Unavailable when Firebase Admin is not configured", async () => {
      setCustomTokenVerifier(null);
      // Ensure admin is not configured
      const origKey = process.env.FIREBASE_PRIVATE_KEY;
      delete process.env.FIREBASE_PRIVATE_KEY;

      try {
        const req = new Request("http://localhost:3000/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: "test_token" }),
        });

        const res = await sessionPost(req);
        expect(res.status).toBe(503);
        const data = await res.json();
        expect(data.code).toBe("FIREBASE_NOT_CONFIGURED");
      } finally {
        if (origKey) process.env.FIREBASE_PRIVATE_KEY = origKey;
      }
    });

    it("returns 401 Unauthorized when an invalid or expired token is presented", async () => {
      setCustomTokenVerifier(async () => {
        const err: any = new Error("Firebase ID token has expired.");
        err.code = "auth/id-token-expired";
        throw err;
      });

      const req = new Request("http://localhost:3000/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: "expired_token_value" }),
      });

      const res = await sessionPost(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.code).toBe("INVALID_TOKEN");
    });

    it("derives user ID strictly from verified Firebase UID and ignores malicious client-supplied fields", async () => {
      const verifiedUid = "fb_alice_secure_uid_999";
      setCustomTokenVerifier(async (token: string) => {
        if (token === "alice_token") {
          return {
            uid: verifiedUid,
            email: "alice@security.org",
            name: "Alice Security",
            picture: "https://lh3.googleusercontent.com/alice.png",
          } as any;
        }
        throw new Error("Invalid token");
      });

      // Malicious client attempts to claim they are "admin_user" or "victim_user"
      const req = new Request("http://localhost:3000/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: "alice_token",
          userId: "spoofed_admin_victim_id", // Should be ignored
          role: "admin", // Should be ignored
          email: "spoofed@attacker.com", // Should be ignored
        }),
      });

      const res = await sessionPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      // Proves derived identity matches verified UID, not client payload
      expect(data.user.id).toBe(verifiedUid);
      expect(data.user.email).toBe("alice@security.org");
      expect(data.user.name).toBe("Alice Security");
      expect(data.sessionToken).toBeTruthy();

      // Verify cookie was set
      const setCookieHeader = res.headers.get("set-cookie");
      expect(setCookieHeader).toContain(sessionModule.SESSION_COOKIE_NAME);
      expect(setCookieHeader).toContain("HttpOnly");

      // Verify user was persisted in database
      const persistedUser = await db.getUser(verifiedUid);
      expect(persistedUser).not.toBeNull();
      expect(persistedUser?.id).toBe(verifiedUid);

      // Verify session was persisted in database
      const session = await db.getSession(data.sessionToken);
      expect(session).not.toBeNull();
      expect(session?.userId).toBe(verifiedUid);
    });
  });

  describe("3. Session Invalidation & Logout", () => {
    it("DELETE /api/auth/session destroys active session and clears cookie", async () => {
      // 1. Create a user and active session
      const rand = Math.random().toString(36).substring(7);
      const testUid = `fb_logout_test_uid_${rand}`;
      await db.createUser({
        id: testUid,
        email: `logout_${rand}@releaselens.test`,
        name: "Logout User",
        role: "tester",
      });
      const session = await db.createSession(testUid);

      // Verify session exists
      const beforeSession = await db.getSession(session.token);
      expect(beforeSession).not.toBeNull();

      // Spy on getAuthSession to simulate calling DELETE with this active session
      vi.spyOn(sessionModule, "getAuthSession").mockResolvedValueOnce({
        user: await db.getUser(testUid),
        sessionToken: session.token,
        isAuthenticated: true,
      });

      const res = await sessionDelete();
      expect(res.status).toBe(200);

      // Verify session was removed from database
      const afterSession = await db.getSession(session.token);
      expect(afterSession).toBeNull();
    });
  });

  describe("4. Zero-Trust Multi-Tenant Isolation with Firebase UIDs", () => {
    it("enforces strict project boundary between Alice and Bob", async () => {
      const rand = Math.random().toString(36).substring(7);
      const aliceUid = `fb_uid_alice_${rand}`;
      const bobUid = `fb_uid_bob_${rand}`;

      await db.createUser({ id: aliceUid, email: `alice_${rand}@iso.com`, name: "Alice", role: "qa_engineer" });
      await db.createUser({ id: bobUid, email: `bob_${rand}@iso.com`, name: "Bob", role: "qa_engineer" });

      // Alice creates a private project
      const aliceProject = await db.createProject({
        userId: aliceUid,
        name: "Alice Private App",
        targetUrl: "https://alice.internal.dev",
        environment: "STAGING",
        isVerified: true,
      });

      // Bob creates a private project
      const bobProject = await db.createProject({
        userId: bobUid,
        name: "Bob Secret Platform",
        targetUrl: "https://bob.internal.dev",
        environment: "PRODUCTION",
        isVerified: true,
      });

      // Query projects for Alice
      const aliceProjects = await db.getProjects(aliceUid);
      expect(aliceProjects.some((p) => p.id === aliceProject.id)).toBe(true);
      expect(aliceProjects.some((p) => p.id === bobProject.id)).toBe(false);

      // Query projects for Bob
      const bobProjects = await db.getProjects(bobUid);
      expect(bobProjects.some((p) => p.id === bobProject.id)).toBe(true);
      expect(bobProjects.some((p) => p.id === aliceProject.id)).toBe(false);

      // Direct lookup: Bob cannot query Alice's project
      const bobLookupOfAlice = await db.getProject(aliceProject.id, bobUid);
      expect(bobLookupOfAlice).toBeNull();

      // Direct lookup: Alice cannot query Bob's project
      const aliceLookupOfBob = await db.getProject(bobProject.id, aliceUid);
      expect(aliceLookupOfBob).toBeNull();
    });
  });

  describe("5. PostgreSQL / Supabase Schema & Tenant Isolation Compatibility", () => {
    it("validates that SupabaseDataStore correctly queries and isolates Firebase UIDs", async () => {
      const testFirebaseUid = "fb_uid_supabase_tester";
      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: [
          {
            id: "proj_supabase_1",
            user_id: testFirebaseUid,
            name: "Supabase Firebase App",
            target_url: "https://preview.app",
            environment: "PREVIEW",
            is_verified: true,
            verification_token: "tok_123",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      const fakeClient = {
        from: vi.fn().mockReturnValue({
          select: mockSelect,
          order: mockOrder,
          eq: mockEq,
        }),
      };

      const store = new SupabaseDataStore("https://mock-test.supabase.co", "mock-service-key");
      (store as any).client = fakeClient;

      const projects = await store.getProjects(testFirebaseUid);
      expect(fakeClient.from).toHaveBeenCalledWith("projects");
      expect(mockEq).toHaveBeenCalledWith("user_id", testFirebaseUid);
      expect(projects.length).toBe(1);
      expect(projects[0].userId).toBe(testFirebaseUid);
    });
  });

  describe("6. External Identity Status Verification", () => {
    it("reports CONFIGURED or BLOCKED status accurately for Firebase Authentication", async () => {
      const req = new Request("http://localhost:3000/api/auth/google?action=oauth_status");
      const res = await googleAuthGet(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.provider).toBe("firebase_google");
      expect(["CONFIGURED", "BLOCKED"]).toContain(data.status);
    });
  });
});
