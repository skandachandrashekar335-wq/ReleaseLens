import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import {
  AuditRun,
  BugReport,
  PotentialFinding,
  Project,
  ReleaseDelta,
  RetestHistory,
} from "../types";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: string;
  createdAt: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface ShareTokenRecord {
  token: string;
  projectId: string;
  auditId?: string;
  data?: any;
  expiresAt: string;
  createdAt: string;
}

export interface IDataStore {
  getUser(id: string): Promise<UserRecord | null>;
  getUserByEmail(email: string): Promise<UserRecord | null>;
  createUser(user: Omit<UserRecord, "createdAt">): Promise<UserRecord>;
  createSession(userId: string): Promise<SessionRecord>;
  getSession(token: string): Promise<SessionRecord | null>;
  deleteSession(token: string): Promise<boolean>;
  getProjects(userId?: string): Promise<Project[]>;
  getProject(id: string, userId?: string): Promise<Project | null>;
  createProject(project: Omit<Project, "id" | "createdAt" | "updatedAt" | "verificationToken">): Promise<Project>;
  deleteProject(id: string, userId?: string): Promise<boolean>;
  saveAudit(audit: AuditRun): Promise<AuditRun>;
  getAudit(id: string): Promise<AuditRun | null>;
  getAuditsForProject(projectId: string): Promise<AuditRun[]>;
  saveFinding(finding: PotentialFinding): Promise<PotentialFinding>;
  getFinding(id: string): Promise<PotentialFinding | null>;
  getFindingsForProject(projectId: string): Promise<PotentialFinding[]>;
  updateFindingStatus(
    findingId: string,
    status: "CONFIRMED" | "REJECTED" | "DUPLICATE" | "ACCEPTED_RISK",
    triageNotes?: string,
    convertedBugId?: string,
    triagedBy?: string
  ): Promise<PotentialFinding | null>;
  createBug(bug: Omit<BugReport, "id" | "createdAt" | "updatedAt">): Promise<BugReport>;
  getBug(id: string): Promise<BugReport | null>;
  getBugsForProject(projectId: string): Promise<BugReport[]>;
  updateBug(bugId: string, updates: Partial<BugReport>): Promise<BugReport | null>;
  addRetest(retest: Omit<RetestHistory, "id" | "retestedAt">): Promise<RetestHistory>;
  getRetestHistory(bugId: string): Promise<RetestHistory[]>;
  createShareToken(projectId: string, auditId?: string, data?: any): Promise<string> | string;
  getShareTokenData(token: string): Promise<ShareTokenRecord | null> | ShareTokenRecord | null;
}

export class PersistentDataStore implements IDataStore {
  private db: DatabaseSync;
  private dbPath: string;

  constructor(dbPath = "./data/releaselens.db") {
    this.dbPath = dbPath;
    if (dbPath !== ":memory:") {
      const dir = path.dirname(path.resolve(dbPath));
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    this.db = new DatabaseSync(dbPath);
    this.initSchema();
    this.seedDefaultData();
  }

  private initSchema() {
    this.db.exec(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        avatar_url TEXT,
        role TEXT DEFAULT 'tester',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        target_url TEXT NOT NULL,
        environment TEXT NOT NULL DEFAULT 'PREVIEW',
        is_verified INTEGER DEFAULT 0,
        verification_token TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS audits (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        target_url TEXT NOT NULL,
        environment TEXT NOT NULL,
        audit_tier TEXT NOT NULL DEFAULT 'TIER_1_PUBLIC',
        status TEXT NOT NULL DEFAULT 'COMPLETED',
        started_at TEXT NOT NULL,
        completed_at TEXT,
        summary TEXT,
        checks_json TEXT DEFAULT '[]',
        rqi_json TEXT DEFAULT '{}',
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS findings (
        id TEXT PRIMARY KEY,
        audit_run_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        test_source TEXT NOT NULL,
        affected_url TEXT,
        title TEXT NOT NULL,
        description TEXT,
        expected_behavior TEXT,
        observed_behavior TEXT,
        recommended_severity TEXT NOT NULL DEFAULT 'MEDIUM',
        confidence TEXT NOT NULL DEFAULT 'HIGH',
        evidence_json TEXT DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
        triage_notes TEXT,
        triaged_by TEXT,
        converted_bug_id TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS bugs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        source_finding_id TEXT,
        title TEXT NOT NULL,
        description TEXT,
        affected_url TEXT NOT NULL,
        steps_to_reproduce_json TEXT DEFAULT '[]',
        expected_result TEXT,
        actual_result TEXT,
        severity TEXT NOT NULL DEFAULT 'HIGH',
        status TEXT NOT NULL DEFAULT 'OPEN',
        environment_telemetry_json TEXT DEFAULT '{}',
        evidence_urls_json TEXT DEFAULT '[]',
        evidence_json TEXT DEFAULT '{}',
        developer_notes TEXT,
        reported_by TEXT DEFAULT 'QA Engineer',
        retest_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS retest_history (
        id TEXT PRIMARY KEY,
        bug_report_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        tester TEXT NOT NULL,
        previous_status TEXT NOT NULL,
        new_status TEXT NOT NULL,
        tester_verdict TEXT NOT NULL,
        tester_comment TEXT,
        retested_at TEXT NOT NULL,
        FOREIGN KEY (bug_report_id) REFERENCES bugs(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS share_tokens (
        token TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        audit_id TEXT,
        data_json TEXT DEFAULT '{}',
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
      CREATE INDEX IF NOT EXISTS idx_audits_project_id ON audits(project_id);
      CREATE INDEX IF NOT EXISTS idx_findings_project_id ON findings(project_id);
      CREATE INDEX IF NOT EXISTS idx_bugs_project_id ON bugs(project_id);
    `);
  }

  private seedDefaultData() {
    const userCount = this.db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
    if (userCount.count === 0) {
      const now = new Date().toISOString();
      this.db.prepare(`
        INSERT INTO users (id, email, name, avatar_url, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run("user_demo_1", "qa-demo@releaselens.dev", "Lead QA Engineer", null, "lead_qa", now);

      this.db.prepare(`
        INSERT INTO projects (id, user_id, name, target_url, environment, is_verified, verification_token, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        "proj_hackathon_demo",
        "user_demo_1",
        "SaaS Preview App (Hackathon QA)",
        "https://v0-optimus-delta.vercel.app",
        "PREVIEW",
        1,
        "rl_verify_demo_token_88923a1",
        new Date(Date.now() - 86400000 * 2).toISOString(),
        now
      );

      const sampleSteps = JSON.stringify([
        "Open site on mobile viewport (375x667)",
        "Tap the hamburger menu icon in the navbar",
        "Observe full-screen menu overlay appears",
        "Tap the (X) close button in top right",
        "Observe menu does not dismiss; touch event is blocked by backdrop z-index",
      ]);

      const sampleTelemetry = JSON.stringify({
        browser: "Mobile Safari 17.2",
        os: "iOS 17",
        viewport: "375x667",
        deviceType: "Mobile",
      });

      this.db.prepare(`
        INSERT INTO bugs (
          id, project_id, user_id, title, description, affected_url,
          steps_to_reproduce_json, expected_result, actual_result, severity, status,
          environment_telemetry_json, evidence_urls_json, evidence_json, developer_notes,
          reported_by, retest_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        "bug_sample_auth_1",
        "proj_hackathon_demo",
        "user_demo_1",
        "Mobile Navigation Overlay Swallows Close Button Touch Events",
        "When the mobile navigation menu is opened on viewports < 400px, tapping the (X) close icon fails to dismiss the drawer.",
        "https://v0-optimus-delta.vercel.app",
        sampleSteps,
        "Tapping (X) should dismiss the drawer and return to page content.",
        "Touch event swallowed; user is trapped in menu until page refresh.",
        "HIGH",
        "OPEN",
        sampleTelemetry,
        "[]",
        "{}",
        "Check z-index and pointer-events on the drawer close container.",
        "Lead QA Engineer",
        0,
        new Date(Date.now() - 3600000 * 4).toISOString(),
        new Date(Date.now() - 3600000 * 4).toISOString()
      );
    }
  }

  // --- Users & Sessions (Auth & Tenant Isolation) ---

  async getUser(id: string): Promise<UserRecord | null> {
    const row = this.db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      avatarUrl: row.avatar_url,
      role: row.role,
      createdAt: row.created_at,
    };
  }

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    const row = this.db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      avatarUrl: row.avatar_url,
      role: row.role,
      createdAt: row.created_at,
    };
  }

  async createUser(user: Omit<UserRecord, "createdAt">): Promise<UserRecord> {
    const createdAt = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO users (id, email, name, avatar_url, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(user.id, user.email, user.name, user.avatarUrl || null, user.role || "tester", createdAt);
    return { ...user, createdAt };
  }

  async createSession(userId: string): Promise<SessionRecord> {
    const token = `rl_sess_${crypto.randomUUID().replace(/-/g, "")}_${Date.now()}`;
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 86400000 * 14).toISOString(); // 14-day persistent session

    this.db.prepare(`
      INSERT INTO sessions (token, user_id, created_at, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(token, userId, createdAt, expiresAt);

    return { token, userId, createdAt, expiresAt };
  }

  async getSession(token: string): Promise<SessionRecord | null> {
    const row = this.db.prepare(`
      SELECT * FROM sessions WHERE token = ? AND expires_at > ?
    `).get(token, new Date().toISOString()) as any;
    if (!row) return null;
    return {
      token: row.token,
      userId: row.user_id,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    };
  }

  async deleteSession(token: string): Promise<boolean> {
    const res = this.db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return res.changes > 0;
  }

  // --- Projects (Tenant-Scoped) ---

  async getProjects(userId?: string): Promise<Project[]> {
    let rows: any[];
    if (userId) {
      rows = this.db.prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC").all(userId);
    } else {
      rows = this.db.prepare("SELECT * FROM projects ORDER BY created_at DESC").all();
    }
    return rows.map(this.mapProjectRow);
  }

  async getProject(id: string, userId?: string): Promise<Project | null> {
    let row: any;
    if (userId) {
      row = this.db.prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?").get(id, userId);
    } else {
      row = this.db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
    }
    return row ? this.mapProjectRow(row) : null;
  }

  async createProject(
    project: Omit<Project, "id" | "createdAt" | "updatedAt" | "verificationToken">
  ): Promise<Project> {
    const id = `proj_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    const verificationToken = `rl_verify_${crypto.randomUUID().replace(/-/g, "")}`;
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO projects (id, user_id, name, target_url, environment, is_verified, verification_token, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      project.userId || "user_demo_1",
      project.name,
      project.targetUrl,
      project.environment || "PREVIEW",
      project.isVerified ? 1 : 0,
      verificationToken,
      now,
      now
    );

    return {
      ...project,
      id,
      userId: project.userId || "user_demo_1",
      isVerified: !!project.isVerified,
      verificationToken,
      createdAt: now,
      updatedAt: now,
    };
  }

  async deleteProject(id: string, userId?: string): Promise<boolean> {
    let res: any;
    if (userId) {
      res = this.db.prepare("DELETE FROM projects WHERE id = ? AND user_id = ?").run(id, userId);
    } else {
      res = this.db.prepare("DELETE FROM projects WHERE id = ?").run(id);
    }
    return res.changes > 0;
  }

  // --- Audits ---

  async saveAudit(audit: AuditRun): Promise<AuditRun> {
    const checksJson = JSON.stringify(audit.checks || []);
    const rqiJson = JSON.stringify(audit.rqiScore || {});

    this.db.prepare(`
      INSERT OR REPLACE INTO audits (
        id, project_id, target_url, environment, audit_tier, status,
        started_at, completed_at, summary, checks_json, rqi_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      audit.id,
      audit.projectId,
      audit.targetUrl,
      audit.environment,
      audit.auditTier,
      audit.status,
      audit.startedAt,
      audit.completedAt || new Date().toISOString(),
      audit.summary || null,
      checksJson,
      rqiJson
    );

    // Save potential findings generated by this audit
    if (audit.findings && audit.findings.length > 0) {
      for (const f of audit.findings) {
        this.saveFinding(f);
      }
    }

    return audit;
  }

  async getAudit(id: string): Promise<AuditRun | null> {
    const row = this.db.prepare("SELECT * FROM audits WHERE id = ?").get(id) as any;
    if (!row) return null;
    return this.mapAuditRow(row);
  }

  async getAuditsForProject(projectId: string): Promise<AuditRun[]> {
    const rows = this.db.prepare("SELECT * FROM audits WHERE project_id = ? ORDER BY started_at DESC").all(projectId) as any[];
    return rows.map(this.mapAuditRow);
  }

  // --- Potential Findings ---

  async saveFinding(finding: PotentialFinding): Promise<PotentialFinding> {
    const evidenceJson = JSON.stringify(finding.evidence || finding.evidencePayload || {});
    this.db.prepare(`
      INSERT OR REPLACE INTO findings (
        id, audit_run_id, project_id, test_source, affected_url, title,
        description, expected_behavior, observed_behavior, recommended_severity,
        confidence, evidence_json, status, triage_notes, triaged_by, converted_bug_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      finding.id,
      finding.auditRunId,
      finding.projectId,
      finding.sourceCheck || finding.testSource || "AUDIT_PROBE",
      finding.affectedUrl || null,
      finding.title,
      finding.description || null,
      finding.expectedBehavior || null,
      finding.observedBehavior || null,
      finding.suggestedSeverity || finding.recommendedSeverity || "MEDIUM",
      finding.confidence || "HIGH",
      evidenceJson,
      finding.status || "NEEDS_REVIEW",
      finding.triageNotes || null,
      finding.triagedBy || null,
      finding.convertedBugId || null,
      finding.createdAt || new Date().toISOString()
    );
    return finding;
  }

  async getFinding(id: string): Promise<PotentialFinding | null> {
    const row = this.db.prepare("SELECT * FROM findings WHERE id = ?").get(id) as any;
    return row ? this.mapFindingRow(row) : null;
  }

  async getFindingsForProject(projectId: string): Promise<PotentialFinding[]> {
    const rows = this.db.prepare("SELECT * FROM findings WHERE project_id = ? ORDER BY created_at DESC").all(projectId) as any[];
    return rows.map(this.mapFindingRow);
  }

  async updateFindingStatus(
    findingId: string,
    status: PotentialFinding["status"],
    triageNotes?: string,
    convertedBugId?: string,
    triagedBy?: string
  ): Promise<PotentialFinding | null> {
    const existing = await this.getFinding(findingId);
    if (!existing) return null;

    this.db.prepare(`
      UPDATE findings
      SET status = ?, triage_notes = COALESCE(?, triage_notes), converted_bug_id = COALESCE(?, converted_bug_id), triaged_by = COALESCE(?, triaged_by)
      WHERE id = ?
    `).run(status, triageNotes || null, convertedBugId || null, triagedBy || null, findingId);

    return this.getFinding(findingId);
  }

  // --- Bug Reports ---

  async getBugsForProject(projectId: string): Promise<BugReport[]> {
    const rows = this.db.prepare("SELECT * FROM bugs WHERE project_id = ? ORDER BY created_at DESC").all(projectId) as any[];
    return rows.map(this.mapBugRow);
  }

  async getBug(bugId: string): Promise<BugReport | null> {
    const row = this.db.prepare("SELECT * FROM bugs WHERE id = ?").get(bugId) as any;
    return row ? this.mapBugRow(row) : null;
  }

  async createBug(bug: Omit<BugReport, "id" | "createdAt" | "updatedAt">): Promise<BugReport> {
    const id = `bug_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    const now = new Date().toISOString();
    const stepsJson = JSON.stringify(bug.stepsToReproduce || []);
    const telemetryJson = JSON.stringify(bug.environmentTelemetry || {});
    const urlsJson = JSON.stringify(bug.evidenceUrls || []);
    const evidenceJson = JSON.stringify(bug.evidence || {});

    this.db.prepare(`
      INSERT INTO bugs (
        id, project_id, user_id, source_finding_id, title, description,
        affected_url, steps_to_reproduce_json, expected_result, actual_result,
        severity, status, environment_telemetry_json, evidence_urls_json, evidence_json,
        developer_notes, reported_by, retest_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      bug.projectId,
      bug.userId || "user_demo_1",
      bug.sourceFindingId || null,
      bug.title,
      bug.description || null,
      bug.affectedUrl || "https://target-app.local",
      stepsJson,
      bug.expectedBehavior || bug.expectedResult || null,
      bug.actualBehavior || bug.actualResult || null,
      bug.severity || "HIGH",
      bug.status || "OPEN",
      telemetryJson,
      urlsJson,
      evidenceJson,
      bug.developerNotes || null,
      bug.reportedBy || "QA Engineer",
      bug.retestCount || 0,
      now,
      now
    );

    return (await this.getBug(id))!;
  }

  async updateBug(bugId: string, updates: Partial<BugReport>): Promise<BugReport | null> {
    const existing = await this.getBug(bugId);
    if (!existing) return null;

    const newStatus = updates.status !== undefined ? updates.status : existing.status;
    const newSeverity = updates.severity !== undefined ? updates.severity : existing.severity;
    const newRetestCount = updates.retestCount !== undefined ? updates.retestCount : (existing.retestCount ?? 0);
    const now = new Date().toISOString();

    this.db.prepare(`
      UPDATE bugs
      SET status = ?, severity = ?, retest_count = ?, updated_at = ?
      WHERE id = ?
    `).run(newStatus, newSeverity, newRetestCount, now, bugId);

    return this.getBug(bugId);
  }

  // --- Retest Verification History ---

  async addRetest(retest: Omit<RetestHistory, "id" | "retestedAt">): Promise<RetestHistory> {
    const randomSuffix = crypto.randomUUID().substring(0, 8);
    const id = `retest_${Date.now()}_${randomSuffix}`;
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO retest_history (
        id, bug_report_id, user_id, tester, previous_status, new_status,
        tester_verdict, tester_comment, retested_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      retest.bugReportId,
      retest.userId || "user_demo_1",
      retest.tester || "QA Tester",
      retest.previousStatus,
      retest.newStatus,
      retest.testerVerdict || retest.verdict || "PASS",
      retest.testerComment || retest.comments || null,
      now
    );

    // Update bug status and increment retest count
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
    const rows = this.db.prepare("SELECT * FROM retest_history WHERE bug_report_id = ? ORDER BY retested_at DESC").all(bugId) as any[];
    return rows.map((r) => ({
      id: r.id,
      bugReportId: r.bug_report_id,
      userId: r.user_id,
      tester: r.tester,
      previousStatus: r.previous_status,
      newStatus: r.new_status,
      testerVerdict: r.tester_verdict,
      testerComment: r.tester_comment,
      retestedAt: r.retested_at,
    }));
  }

  // --- Secure Share Tokens ---

  createShareToken(projectId: string, auditId?: string, data?: any): string {
    const token = `share_${crypto.randomUUID().replace(/-/g, "")}`;
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 86400000 * 30).toISOString(); // 30-day expiry
    const dataJson = JSON.stringify(data || {});

    this.db.prepare(`
      INSERT INTO share_tokens (token, project_id, audit_id, data_json, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(token, projectId, auditId || null, dataJson, expiresAt, now);

    return token;
  }

  getShareTokenData(token: string): ShareTokenRecord | null {
    const row = this.db.prepare(`
      SELECT * FROM share_tokens WHERE token = ? AND expires_at > ?
    `).get(token, new Date().toISOString()) as any;
    if (!row) return null;

    let parsedData = {};
    try {
      parsedData = JSON.parse(row.data_json || "{}");
    } catch {
      parsedData = {};
    }

    return {
      token: row.token,
      projectId: row.project_id,
      auditId: row.audit_id,
      data: parsedData,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    };
  }

  // --- Row Mappers ---

  private mapProjectRow(r: any): Project {
    return {
      id: r.id,
      userId: r.user_id,
      name: r.name,
      targetUrl: r.target_url,
      environment: r.environment,
      isVerified: Boolean(r.is_verified),
      verificationToken: r.verification_token,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  private mapAuditRow(r: any): AuditRun {
    let checks = [];
    let rqiScore = undefined;
    try {
      checks = JSON.parse(r.checks_json || "[]");
    } catch {}
    try {
      rqiScore = JSON.parse(r.rqi_json || "{}");
    } catch {}

    return {
      id: r.id,
      projectId: r.project_id,
      targetUrl: r.target_url,
      environment: r.environment,
      auditTier: r.audit_tier,
      status: r.status,
      startedAt: r.started_at,
      completedAt: r.completed_at,
      summary: r.summary,
      checks,
      findings: [],
      rqiScore,
    };
  }

  private mapFindingRow(r: any): PotentialFinding {
    let evidence = {};
    try {
      evidence = JSON.parse(r.evidence_json || "{}");
    } catch {}

    return {
      id: r.id,
      auditRunId: r.audit_run_id,
      projectId: r.project_id,
      testSource: r.test_source,
      sourceCheck: r.test_source,
      affectedUrl: r.affected_url,
      title: r.title,
      description: r.description,
      expectedBehavior: r.expected_behavior,
      observedBehavior: r.observed_behavior,
      recommendedSeverity: r.recommended_severity,
      suggestedSeverity: r.recommended_severity,
      confidence: r.confidence,
      evidencePayload: evidence,
      evidence,
      status: r.status,
      triageNotes: r.triage_notes,
      triagedBy: r.triaged_by,
      convertedBugId: r.converted_bug_id,
      createdAt: r.created_at,
    };
  }

  private mapBugRow(r: any): BugReport {
    let steps = [];
    let telemetry = {};
    let urls = [];
    let evidence = {};

    try { steps = JSON.parse(r.steps_to_reproduce_json || "[]"); } catch {}
    try { telemetry = JSON.parse(r.environment_telemetry_json || "{}"); } catch {}
    try { urls = JSON.parse(r.evidence_urls_json || "[]"); } catch {}
    try { evidence = JSON.parse(r.evidence_json || "{}"); } catch {}

    return {
      id: r.id,
      projectId: r.project_id,
      userId: r.user_id,
      sourceFindingId: r.source_finding_id,
      title: r.title,
      description: r.description,
      affectedUrl: r.affected_url,
      stepsToReproduce: steps,
      expectedResult: r.expected_result,
      expectedBehavior: r.expected_result,
      actualResult: r.actual_result,
      actualBehavior: r.actual_result,
      severity: r.severity,
      status: r.status,
      environmentTelemetry: telemetry,
      evidenceUrls: urls,
      evidence,
      developerNotes: r.developer_notes,
      reportedBy: r.reported_by,
      retestCount: r.retest_count || 0,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  close() {
    this.db.close();
  }

  transaction<T>(fn: () => T): T {
    this.db.exec("BEGIN TRANSACTION");
    try {
      const result = fn();
      this.db.exec("COMMIT");
      return result;
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
  }
}

export function createDataStore(): IDataStore {
  const provider = process.env.DATABASE_PROVIDER;

  if (provider === "supabase") {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder")) {
      throw new Error(
        "FATAL PRODUCTION CONFIGURATION ERROR: DATABASE_PROVIDER is set to 'supabase', but valid NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are missing. Silent fallback to SQLite is disallowed."
      );
    }

    const { SupabaseDataStore } = require("./supabase-adapter");
    return new SupabaseDataStore(supabaseUrl, supabaseKey);
  }

  return new PersistentDataStore(
    process.env.DATABASE_URL?.startsWith("file:")
      ? process.env.DATABASE_URL.replace("file:", "")
      : "./data/releaselens.db"
  );
}

// Global persistent database singleton
export const db: IDataStore = createDataStore();
