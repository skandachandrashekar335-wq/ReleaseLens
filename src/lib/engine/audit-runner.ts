import { AuditRun, AutomatedCheck, BugReport, EnvironmentType, AuditExecutionTier, AuditStatus } from "../types";
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
  auditMode?: "SYNTHETIC" | "BROWSER" | "FULL" | string;
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

  const auditRunId = `run_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
  const startedAt = new Date().toISOString();
  const tiersExecuted: AuditExecutionTier[] = [];
  const executionLimitations: string[] = [];

  // 1. SSRF & Protocol Perimeter Guard (Must precede any network connection)
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
      executionTier: "TIER_1_HTTP",
      tiersExecuted: [],
      executionLimitations: [`Audit aborted by security perimeter: ${ssrfCheck.reason}`],
      startedAt,
      completedAt,
      checks,
      findings,
      rqiScore,
      summary: `Audit aborted by security perimeter: ${ssrfCheck.reason}`,
    };
  }

  // 2. Parallel Probes: Tier 1 (Lightweight HTTP) and Tier 2 (Performance API)
  const [tlsPromise, secPromise, linkPromise, pageSpeedPromise] = [
    inspectTlsCertificate(targetUrl, auditRunId),
    inspectSecurityHeaders(targetUrl, auditRunId),
    crawlWebsiteLinks(targetUrl, auditRunId, 15),
    runPageSpeedAudit(targetUrl, auditRunId),
  ];

  // Optional Tier 3: Browser Interaction Worker
  const isServerlessCloud = process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
  const shouldRunBrowser = !skipBrowserWorker && !isServerlessCloud;

  let browserPromise: Promise<BrowserExecutionResult | null>;
  if (shouldRunBrowser) {
    const worker = new PlaywrightBrowserWorker();
    browserPromise = worker.execute({
      targetUrl,
      auditRunId,
      projectId,
      timeoutMs: 15000,
    }).catch((err) => {
      console.warn("Playwright browser worker unavailable in this runtime:", err.message);
      return null;
    });
  } else {
    browserPromise = Promise.resolve(null);
  }

  // Execute probes concurrently via Promise.allSettled
  const [tlsSettled, secSettled, linkSettled, pageSpeedSettled, browserSettled] = await Promise.allSettled([
    tlsPromise,
    secPromise,
    linkPromise,
    pageSpeedPromise,
    browserPromise,
  ]);

  const checks: AutomatedCheck[] = [];
  let tlsDaysRemaining = 90;
  let httpsEnforced = false;
  let clickjackingProtected = false;

  // Process Tier 1 (TLS, Security Headers, Link Crawler)
  if (tlsSettled.status === "fulfilled") {
    checks.push(tlsSettled.value.check);
    tlsDaysRemaining = tlsSettled.value.daysRemaining;
  } else {
    checks.push({
      id: `check_tls_err_${Date.now()}`,
      auditRunId,
      category: "TLS",
      name: "TLS Certificate Validity",
      status: "INCONCLUSIVE",
      errorMessage: `TLS inspection failed: ${tlsSettled.reason?.message || "Unknown error"}`,
      timestamp: new Date().toISOString(),
    });
  }

  if (secSettled.status === "fulfilled") {
    checks.push(...secSettled.value.checks);
    httpsEnforced = secSettled.value.httpsEnforced;
    clickjackingProtected = secSettled.value.clickjackingProtected;
  } else {
    checks.push({
      id: `check_sec_err_${Date.now()}`,
      auditRunId,
      category: "HEADERS",
      name: "Security Headers Audit",
      status: "INCONCLUSIVE",
      errorMessage: `Security headers inspection failed: ${secSettled.reason?.message || "Unknown error"}`,
      timestamp: new Date().toISOString(),
    });
  }

  let brokenLinks: any[] = [];
  if (linkSettled.status === "fulfilled") {
    checks.push(...linkSettled.value.checks);
    brokenLinks = linkSettled.value.stats.brokenLinks;
    tiersExecuted.push("TIER_1_HTTP");
  } else {
    checks.push({
      id: `check_link_err_${Date.now()}`,
      auditRunId,
      category: "BROKEN_LINKS",
      name: "Internal Route Reachability",
      status: "INCONCLUSIVE",
      errorMessage: `Link crawler failed: ${linkSettled.reason?.message || "Unknown error"}`,
      timestamp: new Date().toISOString(),
    });
  }

  // Process Tier 2 (Performance Audit via PageSpeed Insights)
  if (pageSpeedSettled.status === "fulfilled") {
    checks.push(...pageSpeedSettled.value.checks);
    tiersExecuted.push("TIER_2_PERF");
  } else {
    checks.push({
      id: `check_perf_err_${Date.now()}`,
      auditRunId,
      category: "PAGESPEED",
      name: "Core Web Vitals & Synthetic Performance",
      status: "NOT_RUN",
      errorMessage: `PageSpeed performance audit unavailable: ${pageSpeedSettled.reason?.message || "Provider error"}`,
      timestamp: new Date().toISOString(),
    });
    executionLimitations.push("Tier 2 PageSpeed API call timed out or provider key was unavailable; performance checks marked NOT_RUN.");
  }

  // Process Tier 3 (Browser Interaction Audit)
  let browserResult: BrowserExecutionResult | undefined;
  if (browserSettled.status === "fulfilled" && browserSettled.value) {
    browserResult = browserSettled.value;
    checks.push(...(browserResult.checks || []));
    tiersExecuted.push("TIER_3_BROWSER");
  } else {
    // Explicitly record Tier 3 as NOT_RUN rather than faking or silently passing
    checks.push({
      id: `check_tier3_browser_${Date.now()}`,
      auditRunId,
      category: "AVAILABILITY",
      dimension: "interactive",
      name: "Tier 3 Browser Interaction Audit",
      checkName: "Tier 3 Browser Interaction Audit",
      status: "NOT_RUN",
      score: 0,
      summary: "Browser interaction audit (Playwright Chromium) was not executed in this runtime environment.",
      rawEvidence: {
        reason: isServerlessCloud
          ? "Serverless cloud execution limit (Hobby plan): Cloud container browser worker required for Tier 3."
          : "Local headless browser binary not installed or execution skipped.",
      },
      timestamp: new Date().toISOString(),
    });
    executionLimitations.push("Tier 3 Browser Interaction Audit not executed: genuine cloud browser worker required for deployed production runs.");
  }

  // 3. Generate Potential Findings
  const baselineFindings = generatePotentialFindings(
    auditRunId,
    projectId,
    targetUrl,
    checks,
    brokenLinks,
    secSettled.status === "fulfilled" ? secSettled.value.missingHeaders : [],
    tlsDaysRemaining
  );

  const findings = [
    ...baselineFindings,
    ...(browserResult?.findings || []),
  ];

  // 4. Compute Tripartite RQI Score (ADR-020 & ADR-023)
  const rqiScore = calculateRqiScore({
    auditRunId,
    checks,
    findings,
    confirmedBugs: existingConfirmedBugs,
    tlsDaysRemaining,
    httpsEnforced,
    clickjackingProtected,
  });

  const completedAt = new Date().toISOString();
  const requestedTier3 = !options.skipBrowserWorker && options.auditMode !== "SYNTHETIC";
  const overallStatus: AuditStatus = (!requestedTier3 || tiersExecuted.includes("TIER_3_BROWSER")) ? "COMPLETED" : "PARTIAL";

  const auditRun: AuditRun & { browserResult?: BrowserExecutionResult } = {
    id: auditRunId,
    projectId,
    targetUrl,
    environment,
    auditTier,
    status: overallStatus,
    executionTier: tiersExecuted.includes("TIER_3_BROWSER") ? "TIER_3_BROWSER" : "TIER_2_PERF",
    tiersExecuted,
    executionLimitations,
    startedAt,
    completedAt,
    checks,
    findings,
    rqiScore,
    summary: `Audit finished (${overallStatus}) in ${Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000)}s. Tiers executed: [${tiersExecuted.join(", ")}]. Quality: ${rqiScore.qualityScore}/100, Coverage: ${rqiScore.coveragePercent}%. Found ${findings.length} potential finding(s).`,
    browserResult,
  };

  return auditRun;
}
