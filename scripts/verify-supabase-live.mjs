import { createClient } from "@supabase/supabase-js";
import fs from "fs";

async function verifySupabaseLive() {
  console.log("=== ReleaseLens Supabase Cloud Database Integration Audit ===");

  // 1. Audit Environment Variables
  const provider = process.env.DATABASE_PROVIDER;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  console.log("\n[Phase 1 & 2] Database Environment Configuration Audit:");
  console.log(`  - DATABASE_PROVIDER: ${provider || "NOT_SET (Defaults to SQLite)"}`);
  console.log(`  - NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL: ${supabaseUrl ? "PRESENT" : "MISSING"}`);
  console.log(`  - SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? "PRESENT" : "MISSING"}`);
  console.log(`  - NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY: ${anonKey ? "PRESENT" : "MISSING"}`);

  if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes("placeholder") || serviceRoleKey.includes("placeholder")) {
    console.log("\n[Phase 4 & 5 Status: BLOCKED]");
    console.log("  -> Reason: Valid Supabase cloud credentials are not configured in .env.local.");
    console.log("  -> Required Variables:");
    console.log("     1. DATABASE_PROVIDER=supabase");
    console.log("     2. NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co");
    console.log("     3. SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...");
    console.log("\n[How to Obtain from Supabase Dashboard]:");
    console.log("  1. Go to https://supabase.com/dashboard/projects and open your project.");
    console.log("  2. In the left navigation, click Project Settings (gear icon) -> API.");
    console.log("  3. Copy 'Project URL' into NEXT_PUBLIC_SUPABASE_URL.");
    console.log("  4. Under 'Project API keys', copy the 'service_role' (secret) key into SUPABASE_SERVICE_ROLE_KEY.");
    console.log("  5. In SQL Editor, run the migrations from supabase/migrations/20261104000000_init_schema.sql and 20261104000001_rls_hardening.sql.");
    console.log("\n=== Audit Completed (Connection Blocked pending user credentials) ===");
    return;
  }

  // 2. Real Connection & Persistence Test
  console.log("\n[Phase 4] Connecting to live Supabase PostgreSQL instance...");
  const client = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  // Test basic query
  const { data: pingData, error: pingError } = await client.from("projects").select("id").limit(1);
  if (pingError) {
    throw new Error(`Supabase connection failed: ${pingError.message}`);
  }
  console.log("  -> Connection successful! PostgreSQL tables responding.");

  // 3. Phase 5: Real Isolated Persistence Lifecycle
  console.log("\n[Phase 5] Executing Real Persistence Lifecycle with Dedicated Test Tenant...");
  const { SupabaseDataStore } = await import("../src/lib/store/supabase-adapter.js");
  const store = new SupabaseDataStore(supabaseUrl, serviceRoleKey);

  const testUid = `test_usr_supabase_${Date.now()}`;
  const testEmail = `${testUid}@releaselens.audit`;

  try {
    // 1. Create User
    console.log(`  -> 1. Creating isolated test user: ${testUid}`);
    const user = await store.createUser({
      id: testUid,
      email: testEmail,
      name: "Supabase QA Auditor",
      role: "tester",
    });
    console.log("     User created successfully.");

    // 2. Create Project
    console.log("  -> 2. Creating isolated project...");
    const project = await store.createProject({
      userId: user.id,
      name: "Live Supabase E2E Target",
      targetUrl: "https://preview.releaselens.live",
      environment: "PREVIEW",
      isVerified: true,
    });
    console.log(`     Project created with ID: ${project.id}`);

    // 3. Create Audit
    console.log("  -> 3. Persisting automated audit results...");
    const auditRun = {
      id: `audit_sb_${Date.now()}`,
      projectId: project.id,
      targetUrl: project.targetUrl,
      environment: "PREVIEW",
      auditTier: "TIER_1_PUBLIC",
      status: "COMPLETED",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      summary: "Live Supabase Cloud Audit Verification",
      checks: [{ name: "TLS", status: "PASS", category: "TLS" }],
      rqiScore: { overallScore: 98, verdict: "RELEASE_READY" },
      findings: [],
    };
    await store.saveAudit(auditRun);
    console.log(`     Audit run persisted: ${auditRun.id}`);

    // 4. Save Finding
    console.log("  -> 4. Persisting potential finding...");
    const finding = {
      id: `fnd_sb_${Date.now()}`,
      auditRunId: auditRun.id,
      projectId: project.id,
      testSource: "SECURITY_PROBE",
      affectedUrl: project.targetUrl,
      title: "Missing CSP Directive",
      description: "Directive missing on preview deployment",
      recommendedSeverity: "HIGH",
      confidence: "HIGH",
      evidence: { probe: "header" },
      status: "NEEDS_REVIEW",
    };
    await store.saveFinding(finding);
    console.log(`     Finding persisted: ${finding.id}`);

    // 5. Update Finding Triage
    console.log("  -> 5. Updating finding triage status to CONFIRMED...");
    await store.updateFindingStatus(finding.id, "CONFIRMED", "Confirmed by auditor");
    console.log("     Finding triage updated.");

    // 6. Create Bug Report
    console.log("  -> 6. Creating verified bug report...");
    const bug = await store.createBug({
      projectId: project.id,
      userId: user.id,
      sourceFindingId: finding.id,
      title: "CSP Header Regression",
      description: "Confirmed bug from audit",
      affectedUrl: project.targetUrl,
      stepsToReproduce: ["Load preview"],
      severity: "HIGH",
      status: "OPEN",
    });
    console.log(`     Bug report created: ${bug.id}`);

    // 7. Add Retest
    console.log("  -> 7. Logging retest verification result...");
    const retest = await store.addRetest({
      bugReportId: bug.id,
      userId: user.id,
      tester: "Supabase QA Auditor",
      previousStatus: "OPEN",
      newStatus: "VERIFIED",
      testerVerdict: "PASS",
      testerComment: "Confirmed fix in PostgreSQL",
    });
    console.log(`     Retest history logged: ${retest.id}, status updated to VERIFIED.`);

    // 8. Cross-Tenant Isolation Verification
    console.log("  -> 8. Verifying cross-tenant isolation...");
    const bobProjects = await store.getProjects("different_user_bob");
    const containsAliceProject = bobProjects.some((p) => p.id === project.id);
    if (containsAliceProject) {
      throw new Error("Cross-tenant leak: Bob queried Alice's private project!");
    }
    console.log("     Cross-tenant isolation asserted: Bob cannot query Alice's project.");

    // 9. Clean up dedicated test records
    console.log("  -> 9. Cleaning up isolated test records...");
    await store.deleteProject(project.id, user.id);
    await client.from("users").delete().eq("id", user.id);
    console.log("     Dedicated test records purged cleanly.");

    console.log("\n=== Real Supabase Cloud Persistence VERIFIED SUCCEEDED ===");
  } catch (err) {
    // Cleanup attempt on failure
    await client.from("users").delete().eq("id", testUid);
    throw err;
  }
}

verifySupabaseLive().catch((err) => {
  console.error("Supabase verification failed:", err);
  process.exit(1);
});
