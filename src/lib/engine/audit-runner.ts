import { AuditRun, AutomatedCheck, BugReport, EnvironmentType } from "../types";
import { inspectTlsCertificate } from "./tls-inspector";
import { inspectSecurityHeaders } from "./security-headers";
import { crawlWebsiteLinks } from "./link-crawler";
import { runPageSpeedAudit } from "./pagespeed-client";
import { generatePotentialFindings } from "./findings-generator";
import { calculateRqiScore } from "./rqi-calculator";
import { PlaywrightBrowserWorker, BrowserExecutionResult } from "./browser-worker";
import { validateTargetUrl } from "./ssrf-guard";

export interface ExecuteAuditOptions {
  projectId: string;
  targetUrl: string;
  environment: EnvironmentType;
  auditTier?: "TIER_1_PUBLIC" | "TIER_2_VERIFIED";
  existingConfirmedBugs?: BugReport[];
  skipBrowserWorker?: boolean;
}

export async function executeAutomatedAudit(options: ExecuteAuditOptions): Promise<AuditRun & { browserResult?: BrowserExecutionResult }> {
  const {
    projectId,
    targetUrl,
    environment,
    auditTier = "TIER_2_VERIFIED",
    existingConfirmedBugs = [],
    skipBrowserWorker = false,
  } = options;

  const auditRunId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const startedAt = new Date().toISOString();

  // 1. SSRF & Protocol Validation
  const ssrfCheck = await validateTargetUrl(targetUrl);
  if (!ssrfCheck.isAllowed) {
    const completedAt = new Date().toISOString();
    const checks: AutomatedCheck[] = [
      {
        id: `check_ssrf_block_${Date.now()}`,
        auditRunId,
        category: "AVAILABILITY",
        dimension: "security",
        name: "Target Network & SSRF Perimeter Gate",
        status: "FAIL",
        score: 0,
        rawEvidence: { blockedUrl: targetUrl, reason: ssrfCheck.reason },
        errorMessage: ssrfCheck.reason,
        timestamp: completedAt,
      },
    ];

    const findings = [
      {
        id: `find_ssrf_${Date.now()}`,
        auditRunId,
        projectId,
        testSource: "SECURITY_PROBE",
        sourceCheck: "ssrf_firewall",
        affectedUrl: targetUrl,
        title: "Target Blocked: SSRF / Private Network Policy",
        description: ssrfCheck.reason || "Target URL points to internal or restricted IP space.",
        recommendedSeverity: "CRITICAL" as const,
        suggestedSeverity: "CRITICAL" as const,
        confidence: "HIGH" as const,
        status: "NEEDS_REVIEW" as const,
        createdAt: completedAt,
      },
    ];

    const rqiScore = calculateRqiScore({
      auditRunId,
      checks,
      findings,
      confirmedBugs: existingConfirmedBugs,
      tlsDaysRemaining: 0,
      httpsEnforced: false,
      clickjackingProtected: false,
    });

    return {
      id: auditRunId,
      projectId,
      targetUrl,
      environment,
      auditTier,
      status: "FAILED",
      startedAt,
      completedAt,
      checks,
      findings,
      rqiScore,
      summary: `Audit aborted by security perimeter: ${ssrfCheck.reason}`,
    };
  }

  // 2. Run TLS Socket Inspection (Independent socket connection)
  const tlsResult = await inspectTlsCertificate(targetUrl, auditRunId);

  // 3. Run Security Headers & Clickjacking Probe
  const secResult = await inspectSecurityHeaders(targetUrl, auditRunId);

  // 4. Run Autonomous Playwright Browser Execution (Real JS execution, DOM, console errors, screenshot)
  let browserResult: BrowserExecutionResult | undefined;
  if (!skipBrowserWorker) {
    try {
      const worker = new PlaywrightBrowserWorker();
      browserResult = await worker.execute({
        targetUrl,
        auditRunId,
        projectId,
        timeoutMs: 15000,
      });
    } catch (err: any) {
      console.warn("Playwright browser worker fallback:", err.message);
    }
  }

  // 5. Run Link Crawler (Traverses internal routes)
  const linkResult = await crawlWebsiteLinks(targetUrl, auditRunId, 15);

  // 6. Run PageSpeed Vitals & Core Web Vitals
  const pageSpeedResult = await runPageSpeedAudit(targetUrl, auditRunId);

  // Aggregate all checks
  const checks: AutomatedCheck[] = [
    tlsResult.check,
    ...secResult.checks,
    ...(browserResult?.checks || []),
    ...linkResult.checks,
    ...pageSpeedResult.checks,
  ];

  // 7. Generate Potential Findings
  const baselineFindings = generatePotentialFindings(
    auditRunId,
    projectId,
    targetUrl,
    checks,
    linkResult.stats.brokenLinks,
    secResult.missingHeaders,
    tlsResult.daysRemaining
  );

  // Merge browser-specific findings (console exceptions, network 4xx/5xx, form defects)
  const findings = [
    ...baselineFindings,
    ...(browserResult?.findings || []),
  ];

  // 8. Compute Tripartite RQI Score (ADR-020 & ADR-023)
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

  const auditRun: AuditRun & { browserResult?: BrowserExecutionResult } = {
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
    browserResult,
  };

  return auditRun;
}
