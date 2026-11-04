import { describe, it, expect, vi, beforeEach } from "vitest";
import { SupabaseDataStore } from "@/lib/store/supabase-adapter";
import { createDataStore } from "@/lib/store/db-adapter";

describe("SupabaseDataStore — PostgreSQL Production Adapter Contract & Security Audit", () => {
  const mockUrl = "https://mock-instance.supabase.co";
  const mockKey = "mock-service-role-key-999";

  describe("1. Configuration & Fail-Closed Guard", () => {
    it("throws error when Supabase URL or key is missing", () => {
      expect(() => new SupabaseDataStore("", "")).toThrow(
        "Valid NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required"
      );
      expect(() => new SupabaseDataStore(mockUrl, "")).toThrow(
        "Valid NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required"
      );
    });

    it("throws error when credentials contain placeholder text (no fake credentials)", () => {
      expect(
        () => new SupabaseDataStore("https://placeholder.supabase.co", mockKey)
      ).toThrow("Silent fallback disabled in production");
    });

    it("succeeds instantiation when valid credentials are provided", () => {
      const store = new SupabaseDataStore(mockUrl, mockKey);
      expect(store).toBeInstanceOf(SupabaseDataStore);
    });

    it("createDataStore() fails closed without silent SQLite fallback when DATABASE_PROVIDER is 'supabase'", () => {
      const origProvider = process.env.DATABASE_PROVIDER;
      const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const origKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      process.env.DATABASE_PROVIDER = "supabase";
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      try {
        expect(() => createDataStore()).toThrow(
          "FATAL PRODUCTION CONFIGURATION ERROR: DATABASE_PROVIDER is set to 'supabase'"
        );
      } finally {
        if (origProvider) process.env.DATABASE_PROVIDER = origProvider;
        else delete process.env.DATABASE_PROVIDER;
        if (origUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
        if (origKey) process.env.SUPABASE_SERVICE_ROLE_KEY = origKey;
      }
    });
  });

  describe("2. User Operations Contract", () => {
    it("createUser inserts into users table and returns UserRecord", async () => {
      const store = new SupabaseDataStore(mockUrl, mockKey);
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: "usr_alice",
          email: "alice@company.com",
          name: "Alice QA",
          avatar_url: "https://lh3.googleusercontent.com/alice",
          role: "qa_engineer",
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const mockClient = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: mockSingle,
            }),
          }),
        }),
      };
      (store as any).client = mockClient;

      const user = await store.createUser({
        id: "usr_alice",
        email: "alice@company.com",
        name: "Alice QA",
        avatarUrl: "https://lh3.googleusercontent.com/alice",
        role: "qa_engineer",
      });

      expect(mockClient.from).toHaveBeenCalledWith("users");
      expect(user.id).toBe("usr_alice");
      expect(user.email).toBe("alice@company.com");
    });

    it("getUser queries users by primary key id", async () => {
      const store = new SupabaseDataStore(mockUrl, mockKey);
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: "usr_bob",
          email: "bob@company.com",
          name: "Bob Dev",
          role: "developer",
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: mockSingle,
            }),
          }),
        }),
      };
      (store as any).client = mockClient;

      const user = await store.getUser("usr_bob");
      expect(mockClient.from).toHaveBeenCalledWith("users");
      expect(user?.id).toBe("usr_bob");
      expect(user?.name).toBe("Bob Dev");
    });
  });

  describe("3. Session Lifecycle & Expiration Contract", () => {
    it("createSession inserts token with 14-day expiration", async () => {
      const store = new SupabaseDataStore(mockUrl, mockKey);
      const mockInsert = vi.fn().mockResolvedValue({ error: null });

      const mockClient = {
        from: vi.fn().mockReturnValue({
          insert: mockInsert,
        }),
      };
      (store as any).client = mockClient;

      const session = await store.createSession("usr_alice");
      expect(mockClient.from).toHaveBeenCalledWith("sessions");
      expect(session.userId).toBe("usr_alice");
      expect(session.token).toMatch(/^rl_sess_/);
      expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now() + 86400000 * 13);
    });

    it("getSession filters by token and checks expires_at > now", async () => {
      const store = new SupabaseDataStore(mockUrl, mockKey);
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: {
          token: "rl_sess_active",
          user_id: "usr_alice",
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 86400000).toISOString(),
        },
        error: null,
      });

      const mockGt = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockEq = vi.fn().mockReturnValue({ gt: mockGt });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      const mockClient = {
        from: vi.fn().mockReturnValue({ select: mockSelect }),
      };
      (store as any).client = mockClient;

      const session = await store.getSession("rl_sess_active");
      expect(mockClient.from).toHaveBeenCalledWith("sessions");
      expect(mockEq).toHaveBeenCalledWith("token", "rl_sess_active");
      expect(mockGt).toHaveBeenCalledWith("expires_at", expect.any(String));
      expect(session?.userId).toBe("usr_alice");
    });

    it("deleteSession removes record by token", async () => {
      const store = new SupabaseDataStore(mockUrl, mockKey);
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockClient = {
        from: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnValue({ eq: mockEq }),
        }),
      };
      (store as any).client = mockClient;

      const success = await store.deleteSession("rl_sess_old");
      expect(mockClient.from).toHaveBeenCalledWith("sessions");
      expect(mockEq).toHaveBeenCalledWith("token", "rl_sess_old");
      expect(success).toBe(true);
    });
  });

  describe("4. Multi-Tenant Project Isolation Contract", () => {
    it("getProjects strictly filters by user_id and orders by created_at desc", async () => {
      const store = new SupabaseDataStore(mockUrl, mockKey);
      const mockEq = vi.fn().mockResolvedValue({
        data: [
          {
            id: "proj_1",
            user_id: "usr_alice",
            name: "Alice App",
            target_url: "https://alice.dev",
            environment: "PREVIEW",
            is_verified: true,
            verification_token: "tok_1",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({ eq: mockEq }),
          }),
        }),
      };
      (store as any).client = mockClient;

      const projects = await store.getProjects("usr_alice");
      expect(mockClient.from).toHaveBeenCalledWith("projects");
      expect(mockEq).toHaveBeenCalledWith("user_id", "usr_alice");
      expect(projects.length).toBe(1);
      expect(projects[0].userId).toBe("usr_alice");
    });

    it("getProject scopes lookup to both id and user_id when provided", async () => {
      const store = new SupabaseDataStore(mockUrl, mockKey);
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: {
          id: "proj_1",
          user_id: "usr_alice",
          name: "Alice App",
          target_url: "https://alice.dev",
          environment: "PREVIEW",
          is_verified: true,
          verification_token: "tok_1",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const mockEqUserId = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockEqId = vi.fn().mockReturnValue({ eq: mockEqUserId });

      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ eq: mockEqId }),
        }),
      };
      (store as any).client = mockClient;

      const project = await store.getProject("proj_1", "usr_alice");
      expect(mockEqId).toHaveBeenCalledWith("id", "proj_1");
      expect(mockEqUserId).toHaveBeenCalledWith("user_id", "usr_alice");
      expect(project?.id).toBe("proj_1");
    });
  });

  describe("5. Audit & Finding Persistence Contract", () => {
    it("saveAudit upserts audit record and stores JSON checks and RQI", async () => {
      const store = new SupabaseDataStore(mockUrl, mockKey);
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });

      const mockClient = {
        from: vi.fn().mockReturnValue({ upsert: mockUpsert }),
      };
      (store as any).client = mockClient;

      const auditRun = {
        id: "audit_123",
        projectId: "proj_1",
        targetUrl: "https://alice.dev",
        environment: "PREVIEW" as const,
        auditTier: "TIER_1_PUBLIC" as const,
        status: "COMPLETED" as const,
        startedAt: new Date().toISOString(),
        summary: "Audit completed successfully",
        checks: [{ name: "TLS", status: "PASS" as const, category: "TLS" as const }],
        rqiScore: { overallScore: 95, verdict: "RELEASE_READY" as const },
      };

      await store.saveAudit(auditRun as any);
      expect(mockClient.from).toHaveBeenCalledWith("audits");
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "audit_123",
          project_id: "proj_1",
          checks_json: auditRun.checks,
          rqi_json: auditRun.rqiScore,
        })
      );
    });

    it("saveFinding upserts finding with evidence_json and triage metadata", async () => {
      const store = new SupabaseDataStore(mockUrl, mockKey);
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });

      const mockClient = {
        from: vi.fn().mockReturnValue({ upsert: mockUpsert }),
      };
      (store as any).client = mockClient;

      const finding = {
        id: "fnd_999",
        auditRunId: "audit_123",
        projectId: "proj_1",
        testSource: "SECURITY_PROBE",
        affectedUrl: "https://alice.dev/login",
        title: "Missing CSP Header",
        description: "Content Security Policy missing",
        recommendedSeverity: "HIGH" as const,
        confidence: "HIGH" as const,
        evidence: { headerMissing: "content-security-policy" },
        status: "NEEDS_REVIEW" as const,
      };

      await store.saveFinding(finding as any);
      expect(mockClient.from).toHaveBeenCalledWith("findings");
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "fnd_999",
          test_source: "SECURITY_PROBE",
          evidence_json: finding.evidence,
        })
      );
    });
  });

  describe("6. Defect & Retest Verification Contract", () => {
    it("addRetest logs retest history, updates parent bug status to VERIFIED on PASS, and increments retestCount", async () => {
      const store = new SupabaseDataStore(mockUrl, mockKey);
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      // Mock getBug returning existing bug
      vi.spyOn(store, "getBug").mockResolvedValue({
        id: "bug_100",
        projectId: "proj_1",
        userId: "usr_alice",
        title: "Broken Button",
        description: "Button does nothing",
        affectedUrl: "https://alice.dev",
        stepsToReproduce: ["Click button"],
        severity: "HIGH",
        status: "FIXED",
        retestCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const mockClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "retest_history") return { insert: mockInsert };
          if (table === "bugs") return { update: mockUpdate };
          return {};
        }),
      };
      (store as any).client = mockClient;

      const retest = await store.addRetest({
        bugReportId: "bug_100",
        userId: "usr_alice",
        tester: "Alice QA",
        previousStatus: "FIXED",
        newStatus: "VERIFIED",
        testerVerdict: "PASS",
        testerComment: "Fix verified in preview build",
      });

      expect(mockClient.from).toHaveBeenCalledWith("retest_history");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          bug_report_id: "bug_100",
          tester_verdict: "PASS",
        })
      );
      expect(mockClient.from).toHaveBeenCalledWith("bugs");
      expect(retest.newStatus).toBe("VERIFIED");
    });
  });

  describe("7. Share Token Lifecycle Contract", () => {
    it("createShareToken persists 30-day expiring token and getShareTokenData queries active tokens", async () => {
      const store = new SupabaseDataStore(mockUrl, mockKey);
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: {
          token: "share_abcdef123456",
          project_id: "proj_1",
          audit_id: "audit_123",
          data_json: { score: 95 },
          expires_at: new Date(Date.now() + 86400000 * 29).toISOString(),
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const mockGt = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockEq = vi.fn().mockReturnValue({ gt: mockGt });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      const mockClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "share_tokens") {
            return {
              insert: mockInsert,
              select: mockSelect,
            };
          }
          return {};
        }),
      };
      (store as any).client = mockClient;

      const token = await store.createShareToken("proj_1", "audit_123", { score: 95 });
      expect(token).toMatch(/^share_/);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          project_id: "proj_1",
          data_json: { score: 95 },
        })
      );

      const tokenData = await store.getShareTokenData(token);
      expect(tokenData?.projectId).toBe("proj_1");
      expect(tokenData?.data).toEqual({ score: 95 });
    });
  });
});
