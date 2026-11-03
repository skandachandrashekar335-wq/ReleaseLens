import { AuditRun, AutomatedCheck, BugReport, EnvironmentType } from "../types";
import { inspectTlsCertificate } from "./tls-inspector";
import { inspectSecurityHeaders } from "./security-headers";
import { crawlWebsiteLinks } from "./link-crawler";
import { runPageSpeedAudit } from "./pagespeed-client";
import { generatePotentialFindings } from "./findings-generator";
import { calculateRqiScore } from "./rqi-calculator";

export interface ExecuteAuditOptions {
  projectId: string;
  targetUrl: string;
  environment: EnvironmentType;
  auditTier?: "TIER_1_PUBLIC" | "TIER_2_VERIFIED";
  existingConfirmedBugs?: BugReport[];
}

export async function executeAutomatedAudit(options: ExecuteAuditOptions): Promise<AuditRun> {
  const {
    projectId,
    targetUrl,
    environment,
    auditTier = "TIER_2_VERIFIED",
    existingConfirmedBugs = [],
  } = options;

  const auditRunId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const startedAt = new Date().toISOString();

  // 1. Run TLS & SSL inspection
  const tlsResult = await inspectTlsCertificate(targetUrl, auditRunId);

  // 2. Run Security Headers inspection & HTTPS check
  const secResult = await inspectSecurityHeaders(targetUrl, auditRunId);

  // 3. Run Link Crawler (up to 15 pages)
  const linkResult = await crawlWebsiteLinks(targetUrl, auditRunId, 15);

  // 4. Run PageSpeed Vitals & a11y audit
  const pageSpeedResult = await runPageSpeedAudit(targetUrl, auditRunId);

  // Aggregate all checks
  const checks: AutomatedCheck[] = [
    tlsResult.check,
    ...secResult.checks,
    ...linkResult.checks,
    ...pageSpeedResult.checks,
  ];

  // 5. Generate Potential Findings
  const findings = generatePotentialFindings(
    auditRunId,
    projectId,
    targetUrl,
    checks,
    linkResult.stats.brokenLinks,
    secResult.missingHeaders,
    tlsResult.daysRemaining
  );

  // 6. Compute Tripartite RQI Score
  const rqiScore = calculateRqiScore({
    auditRunId,
    checks,
    findings,
    confirmedBugs: existingConfirmedBugs,
    tlsDaysRemaining: tlsResult.daysRemaining,
    httpsEnforced: secResult.httpsEnforced,
    clickjackingProtected: secResult.clickjackingProtected,
  });

  const completedAt = new Date().toISOString();

  const auditRun: AuditRun = {
    id: auditRunId,
    projectId,
    targetUrl,
    environment,
    auditTier,
    status: "COMPLETED",
    startedAt,
    completedAt,
    checks,
    findings,
    rqiScore,
    summary: `Audit completed in ${Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000)}s. Quality: ${rqiScore.qualityScore}/100, Coverage: ${rqiScore.coveragePercent}%. Found ${findings.length} potential finding(s).`,
  };

  return auditRun;
}
