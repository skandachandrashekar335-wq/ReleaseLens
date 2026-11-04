import { AutomatedCheck, BugReport, CheckStatus, PotentialFinding, ReleaseVerdict, RqiScore } from "../types";

export interface RqiCalculationInput {
  auditRunId: string;
  checks: AutomatedCheck[];
  findings: PotentialFinding[];
  confirmedBugs: BugReport[];
  tlsDaysRemaining: number;
  httpsEnforced: boolean;
  clickjackingProtected: boolean;
}

export function calculateRqiScore(input: RqiCalculationInput): RqiScore {
  const {
    auditRunId,
    checks,
    findings,
    confirmedBugs,
    tlsDaysRemaining,
    httpsEnforced,
    clickjackingProtected,
  } = input;

  // 1. Evaluate Layer 1: Independent Hard Release Gates
  let gateSecurity: CheckStatus = "PASS";
  if (!httpsEnforced || tlsDaysRemaining <= 2) {
    gateSecurity = "FAIL";
  } else if (!clickjackingProtected && tlsDaysRemaining <= 14) {
    gateSecurity = "INCONCLUSIVE";
  }

  // Functional Gate: Checked against confirmed critical defects
  let gateFunctional: CheckStatus = "PASS";
  const criticalBugs = confirmedBugs.filter(
    (b) => b.severity === "CRITICAL" && b.status !== "FIXED" && b.status !== "VERIFIED"
  );
  const brokenLinkCheck = checks.find((c) => c.category === "BROKEN_LINKS");

  if (criticalBugs.length > 0 || (brokenLinkCheck && brokenLinkCheck.status === "FAIL" && (brokenLinkCheck.score || 0) < 50)) {
    gateFunctional = "FAIL";
  } else if (brokenLinkCheck?.status === "INCONCLUSIVE") {
    gateFunctional = "INCONCLUSIVE";
  }

  // 2. Evaluate Layer 2: Tested Quality Score
  let totalTestedWeight = 0;
  let weightedPoints = 0;

  const categoryScores = {
    security: 100,
    performance: 100,
    accessibility: 100,
    links: 100,
  };

  for (const check of checks) {
    if (check.status !== "NOT_RUN" && check.score !== undefined) {
      const weight = check.weight ?? 0.2;
      totalTestedWeight += weight;
      weightedPoints += check.score * weight;

      if (check.category === "TLS" || check.category === "HEADERS") {
        categoryScores.security = Math.min(categoryScores.security, check.score);
      } else if (check.category === "PAGESPEED") {
        categoryScores.performance = check.score;
      } else if (check.category === "ACCESSIBILITY") {
        categoryScores.accessibility = check.score;
      } else if (check.category === "BROKEN_LINKS") {
        categoryScores.links = check.score;
      }
    }
  }

  const baseScore = totalTestedWeight > 0 ? weightedPoints / totalTestedWeight : 0;

  // Deductions for CONFIRMED open bugs (Unreviewed findings apply 0 deduction)
  let bugDeductions = 0;
  for (const bug of confirmedBugs) {
    if (bug.status !== "FIXED" && bug.status !== "VERIFIED") {
      if (bug.severity === "CRITICAL") bugDeductions += 30;
      else if (bug.severity === "HIGH") bugDeductions += 15;
      else if (bug.severity === "MEDIUM") bugDeductions += 5;
      else if (bug.severity === "LOW") bugDeductions += 2;
    }
  }

  const qualityScore = Math.max(0, Math.min(100, Math.round(baseScore - bugDeductions)));

  // 3. Evaluate Layer 3: Audit Coverage
  // Max possible automated weight across all 4 categories = 0.15 + 0.15 + 0.10 + 0.25 + 0.15 + 0.35
  const coveragePercent = Math.min(100, Math.round((totalTestedWeight / 1.0) * 100));

  // Count unreviewed findings
  const openFindingsCount = findings.filter((f) => f.status === "NEEDS_REVIEW" || f.status === "DETECTED").length;
  const activeConfirmedBugsCount = confirmedBugs.filter(
    (b) => b.status !== "FIXED" && b.status !== "VERIFIED"
  ).length;

  // 4. Determine Operational Release Verdict
  let releaseVerdict: ReleaseVerdict = "VERIFIED_READY";

  if (gateSecurity === "FAIL" || gateFunctional === "FAIL" || qualityScore < 70) {
    releaseVerdict = "RELEASE_BLOCKED";
  } else if (gateSecurity === "INCONCLUSIVE" || gateFunctional === "INCONCLUSIVE") {
    releaseVerdict = "REVIEW_REQUIRED";
  } else if (openFindingsCount > 0 || coveragePercent < 100 || activeConfirmedBugsCount > 0) {
    releaseVerdict = "PROVISIONAL_PASS";
  } else if (qualityScore >= 85 && coveragePercent === 100 && openFindingsCount === 0) {
    releaseVerdict = "VERIFIED_READY";
  } else {
    releaseVerdict = "REVIEW_REQUIRED";
  }

  return {
    id: `rqi_${Date.now()}`,
    auditRunId,
    releaseVerdict,
    qualityScore,
    overallScore: releaseVerdict === "RELEASE_BLOCKED" ? null : qualityScore,
    coveragePercent,
    gateSecurity,
    gateFunctional,
    openFindingsCount,
    confirmedBugsCount: activeConfirmedBugsCount,
    categoryScores,
  };
}
