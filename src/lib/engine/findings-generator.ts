import { AutomatedCheck, PotentialFinding } from "../types";
import { BrokenLink } from "./link-crawler";

export function generatePotentialFindings(
  auditRunId: string,
  projectId: string,
  targetUrl: string,
  checks: AutomatedCheck[],
  brokenLinks: BrokenLink[],
  missingHeaders: string[],
  tlsDaysRemaining: number
): PotentialFinding[] {
  const findings: PotentialFinding[] = [];

  // 1. Broken links findings
  for (const b of brokenLinks) {
    findings.push({
      id: `find_link_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
      auditRunId,
      projectId,
      testSource: "LINK_CRAWLER",
      affectedUrl: b.url,
      title: `Broken Internal Route (${b.statusCode || "Timeout"}): ${b.url}`,
      description: `The internal route ${b.url} linked from ${b.sourceUrl} returned an error status (${b.statusCode || b.error}).`,
      expectedBehavior: `Internal link should resolve to a valid page with HTTP 200 OK.`,
      observedBehavior: `Server returned HTTP ${b.statusCode || b.error || "Connection Error"}.`,
      recommendedSeverity: b.statusCode === 404 ? "HIGH" : "CRITICAL",
      confidence: "HIGH",
      evidencePayload: {
        brokenUrl: b.url,
        linkedFrom: b.sourceUrl,
        statusCode: b.statusCode,
        error: b.error,
      },
      status: "NEEDS_REVIEW",
      createdAt: new Date().toISOString(),
    });
  }

  // 2. Critical TLS findings
  if (tlsDaysRemaining <= 0) {
    findings.push({
      id: `find_tls_${Date.now()}`,
      auditRunId,
      projectId,
      testSource: "SECURITY_PROBE",
      affectedUrl: targetUrl,
      title: "Expired TLS/SSL Certificate",
      description: "The SSL/TLS certificate for this domain has expired, causing browsers to show immediate security warning blocks.",
      expectedBehavior: "Valid, trusted TLS certificate with future expiration date.",
      observedBehavior: `Certificate is expired (days remaining: ${tlsDaysRemaining}).`,
      recommendedSeverity: "CRITICAL",
      confidence: "HIGH",
      evidencePayload: { daysRemaining: tlsDaysRemaining },
      status: "NEEDS_REVIEW",
      createdAt: new Date().toISOString(),
    });
  } else if (tlsDaysRemaining <= 2) {
    findings.push({
      id: `find_tls_warn_${Date.now()}`,
      auditRunId,
      projectId,
      testSource: "SECURITY_PROBE",
      affectedUrl: targetUrl,
      title: "TLS Certificate in Imminent Expiration Window",
      description: `The SSL certificate expires in ${tlsDaysRemaining} days. Automated renewal appears stalled or unconfigured.`,
      expectedBehavior: "Certificate renewed at least 14-30 days prior to expiry.",
      observedBehavior: `${tlsDaysRemaining} days remaining until certificate expiration.`,
      recommendedSeverity: "HIGH",
      confidence: "HIGH",
      evidencePayload: { daysRemaining: tlsDaysRemaining },
      status: "NEEDS_REVIEW",
      createdAt: new Date().toISOString(),
    });
  }

  // 3. Security Header findings (Clickjacking, HSTS, CSP)
  if (missingHeaders.includes("x-frame-options") && missingHeaders.includes("content-security-policy")) {
    findings.push({
      id: `find_clickjack_${Date.now()}`,
      auditRunId,
      projectId,
      testSource: "SECURITY_PROBE",
      affectedUrl: targetUrl,
      title: "Missing Anti-Clickjacking Protection",
      description: "Neither X-Frame-Options nor CSP frame-ancestors is configured. The application can be embedded in malicious iframes.",
      expectedBehavior: "Header X-Frame-Options: DENY or SAMEORIGIN, or Content-Security-Policy frame-ancestors.",
      observedBehavior: "No framing restriction headers returned on target origin.",
      recommendedSeverity: "HIGH",
      confidence: "HIGH",
      evidencePayload: { missingHeaders },
      status: "NEEDS_REVIEW",
      createdAt: new Date().toISOString(),
    });
  }

  if (missingHeaders.includes("strict-transport-security")) {
    findings.push({
      id: `find_hsts_${Date.now()}`,
      auditRunId,
      projectId,
      testSource: "SECURITY_PROBE",
      affectedUrl: targetUrl,
      title: "Missing HTTP Strict Transport Security (HSTS)",
      description: "The Strict-Transport-Security header is missing, allowing potential downgrade attacks on insecure Wi-Fi.",
      expectedBehavior: "Strict-Transport-Security: max-age=31536000; includeSubDomains.",
      observedBehavior: "Header not returned in response.",
      recommendedSeverity: "MEDIUM",
      confidence: "HIGH",
      evidencePayload: { header: "strict-transport-security" },
      status: "NEEDS_REVIEW",
      createdAt: new Date().toISOString(),
    });
  }

  // 4. Performance findings
  const perfCheck = checks.find((c) => c.category === "PAGESPEED");
  if (perfCheck && perfCheck.score !== undefined && perfCheck.score < 50) {
    findings.push({
      id: `find_perf_${Date.now()}`,
      auditRunId,
      projectId,
      testSource: "PAGESPEED",
      affectedUrl: targetUrl,
      title: "Severe Mobile Performance Degradation (Lighthouse < 50)",
      description: `Lighthouse mobile performance score is ${perfCheck.score}/100. Core Web Vitals exhibit significant latency.`,
      expectedBehavior: "Mobile performance score >= 75 with LCP < 2.5s.",
      observedBehavior: `Score: ${perfCheck.score}/100. LCP: ${perfCheck.rawEvidence?.largestContentfulPaint || "N/A"}.`,
      recommendedSeverity: "MEDIUM",
      confidence: "MEDIUM",
      evidencePayload: perfCheck.rawEvidence || {},
      status: "NEEDS_REVIEW",
      createdAt: new Date().toISOString(),
    });
  }

  return findings;
}
