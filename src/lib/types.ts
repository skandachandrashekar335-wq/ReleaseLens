export type EnvironmentType = "PRODUCTION" | "STAGING" | "PREVIEW";

export type FindingStatus =
  | "DETECTED"
  | "NEEDS_REVIEW"
  | "CONFIRMED"
  | "REJECTED"
  | "DUPLICATE"
  | "ACCEPTED_RISK";

export type BugSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type Severity = BugSeverity;

export type BugStatus =
  | "OPEN"
  | "ACKNOWLEDGED"
  | "IN_PROGRESS"
  | "FIXED"
  | "RETEST_REQUIRED"
  | "VERIFIED"
  | "REOPENED"
  | "CLOSED";

export type CheckStatus = "PASS" | "FAIL" | "NOT_RUN" | "INCONCLUSIVE" | "PASSED" | "FAILED" | "WARNING";
export type RetestVerdict = "PASS" | "FAIL" | "INCONCLUSIVE";

export type ReleaseVerdict =
  | "VERIFIED_READY"
  | "PROVISIONAL_PASS"
  | "REVIEW_REQUIRED"
  | "RELEASE_BLOCKED";

export interface Project {
  id: string;
  userId?: string;
  name: string;
  targetUrl: string;
  environment: EnvironmentType;
  isVerified?: boolean;
  verificationToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutomatedCheck {
  id: string;
  auditRunId: string;
  category?: "AVAILABILITY" | "TLS" | "HEADERS" | "BROKEN_LINKS" | "PAGESPEED" | "ACCESSIBILITY";
  dimension?: string;
  checkName?: string;
  name?: string;
  status: CheckStatus;
  score?: number; // 0-100
  weight?: number;
  rawEvidence?: Record<string, any>;
  evidence?: any;
  summary?: string;
  errorMessage?: string;
  durationMs?: number;
  executedAt?: string;
  timestamp?: string;
}

export interface PotentialFinding {
  id: string;
  auditRunId: string;
  projectId: string;
  testSource?: "LINK_CRAWLER" | "SECURITY_PROBE" | "CONSOLE_SNIFFER" | "PAGESPEED" | string;
  sourceCheck?: string;
  affectedUrl?: string;
  title: string;
  description: string;
  expectedBehavior?: string;
  observedBehavior?: string;
  recommendedSeverity?: BugSeverity;
  suggestedSeverity?: BugSeverity;
  confidence?: "HIGH" | "MEDIUM" | "LOW";
  evidencePayload?: Record<string, any>;
  evidence?: any;
  status: FindingStatus;
  triageNotes?: string;
  triagedBy?: string;
  convertedBugId?: string;
  createdAt: string;
}

export interface BugReport {
  id: string;
  projectId: string;
  userId?: string;
  sourceFindingId?: string;
  title: string;
  description: string;
  affectedUrl?: string;
  stepsToReproduce?: string[];
  expectedResult?: string;
  expectedBehavior?: string;
  actualResult?: string;
  actualBehavior?: string;
  severity: BugSeverity;
  status: BugStatus;
  reportedBy?: string;
  retestCount?: number;
  environment?: string;
  environmentTelemetry?: {
    browser?: string;
    os?: string;
    viewport?: string;
    deviceType?: string;
  };
  evidenceUrls?: string[];
  evidence?: any;
  developerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RetestHistory {
  id: string;
  bugReportId: string;
  userId?: string;
  previousStatus: BugStatus;
  newStatus: BugStatus;
  testerVerdict: RetestVerdict;
  verdict?: RetestVerdict;
  testerComment: string;
  comments?: string;
  tester?: string;
  retestedAt: string;
}

export interface RqiScore {
  id?: string;
  auditRunId?: string;
  releaseVerdict?: ReleaseVerdict;
  verdict?: ReleaseVerdict;
  qualityScore?: number; // 0-100
  overallScore?: number | null; // 0-100 or null if blocked
  coveragePercent?: number; // 0-100
  coveragePercentage?: number; // 0-100
  gateSecurity?: CheckStatus;
  gateFunctional?: CheckStatus;
  gateSecurityPassed?: boolean;
  gateFunctionalPassed?: boolean;
  openFindingsCount?: number;
  confirmedBugsCount?: number;
  categoryScores?: {
    security: number;
    performance: number;
    accessibility: number;
    links: number;
  };
  securityScore?: number;
  availabilityScore?: number;
  linksScore?: number;
  performanceScore?: number;
  reasons?: string[];
}

export interface AuditRun {
  id: string;
  projectId: string;
  targetUrl: string;
  environment: EnvironmentType;
  auditTier: "TIER_1_PUBLIC" | "TIER_2_VERIFIED";
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  startedAt: string;
  completedAt?: string;
  checks: AutomatedCheck[];
  findings: PotentialFinding[];
  rqiScore?: RqiScore;
  summary?: string;
}

export interface ReleaseDelta {
  previousRunId?: string;
  currentRunId?: string;
  previousAuditId?: string;
  currentAuditId?: string;
  rqiDelta?: number;
  scoreDelta?: number;
  qualityDelta?: number;
  coverageDelta?: number;
  newBrokenLinks: string[];
  resolvedBrokenLinks?: string[];
  fixedBrokenLinks?: string[];
  regressedSecurityHeaders?: string[];
  improvedSecurityHeaders?: string[];
  newCriticalFindings?: number;
  newConfirmedBugs?: number;
  resolvedBugs?: number;
  verdictChanged?: boolean;
  verdictTransition?: {
    from: string;
    to: string;
  };
  regressionDetected?: boolean;
  previousVerdict?: ReleaseVerdict;
  currentVerdict?: ReleaseVerdict;
  notes: string[];
}
