import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  AuditRun,
  BugReport,
  PotentialFinding,
  Project,
  RetestHistory,
} from "../types";
import {
  IDataStore,
  UserRecord,
  SessionRecord,
  ShareTokenRecord,
} from "./db-adapter";

export class SupabaseDataStore implements IDataStore {
  private client: SupabaseClient;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      supabaseKey ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key || url.includes("placeholder")) {
      throw new Error(
        "SupabaseDataStore configuration error: Valid NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required. Silent fallback disabled in production."
      );
    }

    this.client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }

  async getUser(id: string): Promise<UserRecord | null> {
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      avatarUrl: data.avatar_url,
      role: data.role || "tester",
      createdAt: data.created_at,
    };
  }

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      avatarUrl: data.avatar_url,
      role: data.role || "tester",
      createdAt: data.created_at,
    };
  }

  async createUser(user: Omit<UserRecord, "createdAt">): Promise<UserRecord> {
    const createdAt = new Date().toISOString();
    const { data, error } = await this.client
      .from("users")
      .insert({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatarUrl || null,
        role: user.role || "tester",
        created_at: createdAt,
      })
      .select()
      .single();

    if (error) throw new Error(`Supabase createUser error: ${error.message}`);
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      avatarUrl: data.avatar_url,
      role: data.role,
      createdAt: data.created_at,
    };
  }

  async createSession(userId: string): Promise<SessionRecord> {
    const token = `rl_sess_${crypto.randomUUID().replace(/-/g, "")}_${Date.now()}`;
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 86400000 * 14).toISOString();

    const { error } = await this.client.from("sessions").insert({
      token,
      user_id: userId,
      created_at: createdAt,
      expires_at: expiresAt,
    });

    if (error) throw new Error(`Supabase createSession error: ${error.message}`);
    return { token, userId, createdAt, expiresAt };
  }

  async getSession(token: string): Promise<SessionRecord | null> {
    const { data, error } = await this.client
      .from("sessions")
      .select("*")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error || !data) return null;
    return {
      token: data.token,
      userId: data.user_id,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
    };
  }

  async deleteSession(token: string): Promise<boolean> {
    const { error } = await this.client.from("sessions").delete().eq("token", token);
    return !error;
  }

  async getProjects(userId?: string): Promise<Project[]> {
    let query = this.client.from("projects").select("*").order("created_at", { ascending: false });
    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.eq.user_demo_1`);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      name: r.name,
      targetUrl: r.target_url,
      environment: r.environment,
      isVerified: Boolean(r.is_verified),
      verificationToken: r.verification_token,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async getProject(id: string, userId?: string): Promise<Project | null> {
    let query = this.client.from("projects").select("*").eq("id", id);
    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.eq.user_demo_1`);
    }

    const { data, error } = await query.maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      targetUrl: data.target_url,
      environment: data.environment,
      isVerified: Boolean(data.is_verified),
      verificationToken: data.verification_token,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async createProject(
    project: Omit<Project, "id" | "createdAt" | "updatedAt" | "verificationToken">
  ): Promise<Project> {
    const id = `proj_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    const verificationToken = `rl_verify_${crypto.randomUUID().replace(/-/g, "")}`;
    const now = new Date().toISOString();

    const { data, error } = await this.client
      .from("projects")
      .insert({
        id,
        user_id: project.userId || "user_demo_1",
        name: project.name,
        target_url: project.targetUrl,
        environment: project.environment || "PREVIEW",
        is_verified: project.isVerified ? true : false,
        verification_token: verificationToken,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw new Error(`Supabase createProject error: ${error.message}`);
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      targetUrl: data.target_url,
      environment: data.environment,
      isVerified: Boolean(data.is_verified),
      verificationToken: data.verification_token,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async deleteProject(id: string, userId?: string): Promise<boolean> {
    let query = this.client.from("projects").delete().eq("id", id);
    if (userId) query = query.eq("user_id", userId);
    const { error } = await query;
    return !error;
  }

  async saveAudit(audit: AuditRun): Promise<AuditRun> {
    const { error } = await this.client.from("audits").upsert({
      id: audit.id,
      project_id: audit.projectId,
      target_url: audit.targetUrl,
      environment: audit.environment,
      audit_tier: audit.auditTier,
      status: audit.status,
      started_at: audit.startedAt,
      completed_at: audit.completedAt || new Date().toISOString(),
      summary: audit.summary || null,
      checks_json: audit.checks || [],
      rqi_json: audit.rqiScore || {},
    });

    if (error) throw new Error(`Supabase saveAudit error: ${error.message}`);

    if (audit.findings && audit.findings.length > 0) {
      for (const f of audit.findings) {
        await this.saveFinding(f);
      }
    }

    return audit;
  }

  async getAudit(id: string): Promise<AuditRun | null> {
    const { data, error } = await this.client.from("audits").select("*").eq("id", id).maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      projectId: data.project_id,
      targetUrl: data.target_url,
      environment: data.environment,
      auditTier: data.audit_tier,
      status: data.status,
      startedAt: data.started_at,
      completedAt: data.completed_at,
      summary: data.summary,
      checks: data.checks_json || [],
      findings: [],
      rqiScore: data.rqi_json || undefined,
    };
  }

  async getAuditsForProject(projectId: string): Promise<AuditRun[]> {
    const { data, error } = await this.client
      .from("audits")
      .select("*")
      .eq("project_id", projectId)
      .order("started_at", { ascending: false });

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      projectId: d.project_id,
      targetUrl: d.target_url,
      environment: d.environment,
      auditTier: d.audit_tier,
      status: d.status,
      startedAt: d.started_at,
      completedAt: d.completed_at,
      summary: d.summary,
      checks: d.checks_json || [],
      findings: [],
      rqiScore: d.rqi_json || undefined,
    }));
  }

  async saveFinding(finding: PotentialFinding): Promise<PotentialFinding> {
    const { error } = await this.client.from("findings").upsert({
      id: finding.id,
      audit_run_id: finding.auditRunId,
      project_id: finding.projectId,
      test_source: finding.sourceCheck || finding.testSource || "AUDIT_PROBE",
      affected_url: finding.affectedUrl || null,
      title: finding.title,
      description: finding.description || null,
      expected_behavior: finding.expectedBehavior || null,
      observed_behavior: finding.observedBehavior || null,
      recommended_severity: finding.suggestedSeverity || finding.recommendedSeverity || "MEDIUM",
      confidence: finding.confidence || "HIGH",
      evidence_json: finding.evidence || finding.evidencePayload || {},
      status: finding.status || "NEEDS_REVIEW",
      triage_notes: finding.triageNotes || null,
      triaged_by: finding.triagedBy || null,
      converted_bug_id: finding.convertedBugId || null,
      created_at: finding.createdAt || new Date().toISOString(),
    });

    if (error) throw new Error(`Supabase saveFinding error: ${error.message}`);
    return finding;
  }

  async getFinding(id: string): Promise<PotentialFinding | null> {
    const { data, error } = await this.client.from("findings").select("*").eq("id", id).maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      auditRunId: data.audit_run_id,
      projectId: data.project_id,
      testSource: data.test_source,
      affectedUrl: data.affected_url,
      title: data.title,
      description: data.description,
      expectedBehavior: data.expected_behavior,
      observedBehavior: data.observed_behavior,
      recommendedSeverity: data.recommended_severity,
      confidence: data.confidence,
      evidence: data.evidence_json || {},
      status: data.status,
      triageNotes: data.triage_notes,
      triagedBy: data.triaged_by,
      convertedBugId: data.converted_bug_id,
      createdAt: data.created_at,
    };
  }

  async getFindingsForProject(projectId: string): Promise<PotentialFinding[]> {
    const { data, error } = await this.client
      .from("findings")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      auditRunId: d.audit_run_id,
      projectId: d.project_id,
      testSource: d.test_source,
      affectedUrl: d.affected_url,
      title: d.title,
      description: d.description,
      expectedBehavior: d.expected_behavior,
      observedBehavior: d.observed_behavior,
      recommendedSeverity: d.recommended_severity,
      confidence: d.confidence,
      evidence: d.evidence_json || {},
      status: d.status,
      triageNotes: d.triage_notes,
      triagedBy: d.triaged_by,
      convertedBugId: d.converted_bug_id,
      createdAt: d.created_at,
    }));
  }

  async updateFindingStatus(
    findingId: string,
    status: "CONFIRMED" | "REJECTED" | "DUPLICATE" | "ACCEPTED_RISK",
    triageNotes?: string,
    convertedBugId?: string,
    triagedBy?: string
  ): Promise<PotentialFinding | null> {
    const updates: any = { status };
    if (triageNotes !== undefined) updates.triage_notes = triageNotes;
    if (convertedBugId !== undefined) updates.converted_bug_id = convertedBugId;
    if (triagedBy !== undefined) updates.triaged_by = triagedBy;

    const { error } = await this.client.from("findings").update(updates).eq("id", findingId);
    if (error) return null;
    return this.getFinding(findingId);
  }

  async createBug(bug: Omit<BugReport, "id" | "createdAt" | "updatedAt">): Promise<BugReport> {
    const id = `bug_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    const now = new Date().toISOString();

    const { data, error } = await this.client
      .from("bugs")
      .insert({
        id,
        project_id: bug.projectId,
        user_id: bug.userId || "user_demo_1",
        source_finding_id: bug.sourceFindingId || null,
        title: bug.title,
        description: bug.description || null,
        affected_url: bug.affectedUrl || "https://target-app.local",
        steps_to_reproduce_json: bug.stepsToReproduce || [],
        expected_result: bug.expectedBehavior || bug.expectedResult || null,
        actual_result: bug.actualBehavior || bug.actualResult || null,
        severity: bug.severity || "HIGH",
        status: bug.status || "OPEN",
        environment_telemetry_json: bug.environmentTelemetry || {},
        evidence_urls_json: bug.evidenceUrls || [],
        evidence_json: bug.evidence || {},
        developer_notes: bug.developerNotes || null,
        reported_by: bug.reportedBy || "QA Engineer",
        retest_count: bug.retestCount || 0,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw new Error(`Supabase createBug error: ${error.message}`);
    return this.getBug(data.id) as Promise<BugReport>;
  }

  async getBug(id: string): Promise<BugReport | null> {
    const { data, error } = await this.client.from("bugs").select("*").eq("id", id).maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      projectId: data.project_id,
      userId: data.user_id,
      sourceFindingId: data.source_finding_id,
      title: data.title,
      description: data.description,
      affectedUrl: data.affected_url,
      stepsToReproduce: data.steps_to_reproduce_json || [],
      expectedResult: data.expected_result,
      actualResult: data.actual_result,
      severity: data.severity,
      status: data.status,
      environmentTelemetry: data.environment_telemetry_json || {},
      evidenceUrls: data.evidence_urls_json || [],
      evidence: data.evidence_json || {},
      developerNotes: data.developer_notes,
      reportedBy: data.reported_by,
      retestCount: data.retest_count || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async getBugsForProject(projectId: string): Promise<BugReport[]> {
    const { data, error } = await this.client
      .from("bugs")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      projectId: d.project_id,
      userId: d.user_id,
      sourceFindingId: d.source_finding_id,
      title: d.title,
      description: d.description,
      affectedUrl: d.affected_url,
      stepsToReproduce: d.steps_to_reproduce_json || [],
      expectedResult: d.expected_result,
      actualResult: d.actual_result,
      severity: d.severity,
      status: d.status,
      environmentTelemetry: d.environment_telemetry_json || {},
      evidenceUrls: d.evidence_urls_json || [],
      evidence: d.evidence_json || {},
      developerNotes: d.developer_notes,
      reportedBy: d.reported_by,
      retestCount: d.retest_count || 0,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  }

  async updateBug(bugId: string, updates: Partial<BugReport>): Promise<BugReport | null> {
    const existing = await this.getBug(bugId);
    if (!existing) return null;

    const patch: any = { updated_at: new Date().toISOString() };
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.severity !== undefined) patch.severity = updates.severity;
    if (updates.retestCount !== undefined) patch.retest_count = updates.retestCount;
    if (updates.developerNotes !== undefined) patch.developer_notes = updates.developerNotes;

    const { error } = await this.client.from("bugs").update(patch).eq("id", bugId);
    if (error) return null;
    return this.getBug(bugId);
  }

  async addRetest(retest: Omit<RetestHistory, "id" | "retestedAt">): Promise<RetestHistory> {
    const randomSuffix = crypto.randomUUID().substring(0, 8);
    const id = `retest_${Date.now()}_${randomSuffix}`;
    const now = new Date().toISOString();

    const { error } = await this.client.from("retest_history").insert({
      id,
      bug_report_id: retest.bugReportId,
      user_id: retest.userId || "user_demo_1",
      tester: retest.tester || "QA Tester",
      previous_status: retest.previousStatus,
      new_status: retest.newStatus,
      tester_verdict: retest.testerVerdict || retest.verdict || "PASS",
      tester_comment: retest.testerComment || retest.comments || null,
      retested_at: now,
    });

    if (error) throw new Error(`Supabase addRetest error: ${error.message}`);

    const existingBug = await this.getBug(retest.bugReportId);
    const updatedStatus = (retest.testerVerdict || retest.verdict) === "PASS" ? "VERIFIED" : "REOPENED";
    await this.updateBug(retest.bugReportId, {
      status: updatedStatus,
      retestCount: (existingBug?.retestCount || 0) + 1,
    });

    return {
      id,
      bugReportId: retest.bugReportId,
      userId: retest.userId || "user_demo_1",
      tester: retest.tester || "QA Tester",
      previousStatus: retest.previousStatus,
      newStatus: updatedStatus,
      testerVerdict: retest.testerVerdict || retest.verdict || "PASS",
      testerComment: retest.testerComment || retest.comments || "",
      retestedAt: now,
    };
  }

  async getRetestHistory(bugId: string): Promise<RetestHistory[]> {
    const { data, error } = await this.client
      .from("retest_history")
      .select("*")
      .eq("bug_report_id", bugId)
      .order("retested_at", { ascending: false });

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      bugReportId: d.bug_report_id,
      userId: d.user_id,
      tester: d.tester,
      previousStatus: d.previous_status,
      newStatus: d.new_status,
      testerVerdict: d.tester_verdict,
      testerComment: d.tester_comment,
      retestedAt: d.retested_at,
    }));
  }

  async createShareToken(projectId: string, auditId?: string, data?: any): Promise<string> {
    const token = `share_${crypto.randomUUID().replace(/-/g, "")}`;
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 86400000 * 30).toISOString();

    const { error } = await this.client.from("share_tokens").insert({
      token,
      project_id: projectId,
      audit_id: auditId || null,
      data_json: data || {},
      expires_at: expiresAt,
      created_at: now,
    });

    if (error) throw new Error(`Supabase createShareToken error: ${error.message}`);
    return token;
  }

  async getShareTokenData(token: string): Promise<ShareTokenRecord | null> {
    const { data, error } = await this.client
      .from("share_tokens")
      .select("*")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error || !data) return null;
    return {
      token: data.token,
      projectId: data.project_id,
      auditId: data.audit_id,
      data: data.data_json,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
    };
  }
}
