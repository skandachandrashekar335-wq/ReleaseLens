import { AuditRun, BugReport, PotentialFinding, Project, ReleaseDelta, RetestHistory } from "../types";

// In-Memory Cloud Store (Resilient fallback when Supabase keys are in initial setup)
class MemoryDataStore {
  private projects: Map<string, Project> = new Map();
  private audits: Map<string, AuditRun> = new Map();
  private findings: Map<string, PotentialFinding> = new Map();
  private bugs: Map<string, BugReport> = new Map();
  private retests: Map<string, RetestHistory> = new Map();
  private shareTokens: Map<string, { projectId: string; auditId?: string; expiresAt: string }> = new Map();

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const defaultProjId = "proj_hackathon_demo";
    const defaultProject: Project = {
      id: defaultProjId,
      userId: "user_demo_1",
      name: "SaaS Preview App (Hackathon QA)",
      targetUrl: "https://v0-optimus-delta.vercel.app",
      environment: "PREVIEW",
      isVerified: true,
      verificationToken: "rl_verify_demo_token_88923a1",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.projects.set(defaultProjId, defaultProject);

    // Seed sample bug
    const sampleBugId = "bug_sample_auth_1";
    const sampleBug: BugReport = {
      id: sampleBugId,
      projectId: defaultProjId,
      userId: "user_demo_1",
      title: "Mobile Navigation Overlay Swallows Close Button Touch Events",
      description: "When the mobile navigation menu is opened on viewports < 400px, tapping the (X) close icon fails to dismiss the drawer.",
      affectedUrl: "https://v0-optimus-delta.vercel.app",
      stepsToReproduce: [
        "Open site on mobile viewport (375x667)",
        "Tap the hamburger menu icon in the navbar",
        "Observe full-screen menu overlay appears",
        "Tap the (X) close button in top right",
        "Observe menu does not dismiss; touch event is blocked by backdrop z-index",
      ],
      expectedResult: "Tapping (X) should dismiss the drawer and return to page content.",
      actualResult: "Touch event swallowed; user is trapped in menu until page refresh.",
      severity: "HIGH",
      status: "OPEN",
      environmentTelemetry: {
        browser: "Mobile Safari 17.2",
        os: "iOS 17",
        viewport: "375x667",
        deviceType: "Mobile",
      },
      evidenceUrls: [],
      developerNotes: "Check z-index and pointer-events on the drawer close container.",
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    };
    this.bugs.set(sampleBugId, sampleBug);
  }

  // Projects
  async getProjects(userId = "user_demo_1"): Promise<Project[]> {
    return Array.from(this.projects.values()).filter((p) => p.userId === userId);
  }

  async getProject(id: string): Promise<Project | null> {
    return this.projects.get(id) || null;
  }

  async createProject(project: Omit<Project, "id" | "createdAt" | "updatedAt" | "verificationToken">): Promise<Project> {
    const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newProject: Project = {
      ...project,
      id,
      verificationToken: `rl_verify_${Math.random().toString(36).substring(2, 12)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.projects.set(id, newProject);
    return newProject;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Audits
  async saveAudit(audit: AuditRun): Promise<AuditRun> {
    this.audits.set(audit.id, audit);
    // Also save its findings
    for (const finding of audit.findings) {
      this.findings.set(finding.id, finding);
    }
    return audit;
  }

  async getAudit(id: string): Promise<AuditRun | null> {
    return this.audits.get(id) || null;
  }

  async getAuditsForProject(projectId: string): Promise<AuditRun[]> {
    return Array.from(this.audits.values())
      .filter((a) => a.projectId === projectId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  // Potential Findings
  async getFindingsForProject(projectId: string): Promise<PotentialFinding[]> {
    return Array.from(this.findings.values())
      .filter((f) => f.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateFindingStatus(
    findingId: string,
    status: PotentialFinding["status"],
    triageNotes?: string,
    convertedBugId?: string
  ): Promise<PotentialFinding | null> {
    const finding = this.findings.get(findingId);
    if (!finding) return null;

    finding.status = status;
    if (triageNotes) finding.triageNotes = triageNotes;
    if (convertedBugId) finding.convertedBugId = convertedBugId;

    this.findings.set(findingId, finding);
    return finding;
  }

  // Bug Reports
  async getBugsForProject(projectId: string): Promise<BugReport[]> {
    return Array.from(this.bugs.values())
      .filter((b) => b.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getBug(bugId: string): Promise<BugReport | null> {
    return this.bugs.get(bugId) || null;
  }

  async createBug(bug: Omit<BugReport, "id" | "createdAt" | "updatedAt">): Promise<BugReport> {
    const id = `bug_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newBug: BugReport = {
      ...bug,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.bugs.set(id, newBug);
    return newBug;
  }

  async updateBug(bugId: string, updates: Partial<BugReport>): Promise<BugReport | null> {
    const bug = this.bugs.get(bugId);
    if (!bug) return null;

    const updated = {
      ...bug,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.bugs.set(bugId, updated);
    return updated;
  }

  // Retests
  async addRetest(retest: Omit<RetestHistory, "id" | "retestedAt">): Promise<RetestHistory> {
    const id = `retest_${Date.now()}`;
    const newRetest: RetestHistory = {
      ...retest,
      id,
      retestedAt: new Date().toISOString(),
    };
    this.retests.set(id, newRetest);

    // Update bug status according to retest verdict
    if (retest.testerVerdict === "PASS") {
      await this.updateBug(retest.bugReportId, { status: "VERIFIED" });
    } else if (retest.testerVerdict === "FAIL") {
      await this.updateBug(retest.bugReportId, { status: "REOPENED" });
    }

    return newRetest;
  }

  async getRetestHistory(bugId: string): Promise<RetestHistory[]> {
    return Array.from(this.retests.values())
      .filter((r) => r.bugReportId === bugId)
      .sort((a, b) => new Date(b.retestedAt).getTime() - new Date(a.retestedAt).getTime());
  }

  // Share tokens
  createShareToken(projectId: string, auditId?: string): string {
    const token = `share_${Math.random().toString(36).substring(2, 14)}`;
    this.shareTokens.set(token, {
      projectId,
      auditId,
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(), // 30 days
    });
    return token;
  }

  getShareTokenData(token: string) {
    return this.shareTokens.get(token) || null;
  }
}

// Global singleton instance
export const db = new MemoryDataStore();
