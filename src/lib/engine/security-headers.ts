import { AutomatedCheck } from "../types";

export interface SecurityHeaderInspectionResult {
  checks: AutomatedCheck[];
  score: number; // 0-100
  presentHeaders: Record<string, string>;
  missingHeaders: string[];
  httpsEnforced: boolean;
  clickjackingProtected: boolean;
}

export async function inspectSecurityHeaders(
  targetUrl: string,
  auditRunId: string
): Promise<SecurityHeaderInspectionResult> {
  const urlObj = new URL(targetUrl);
  const checks: AutomatedCheck[] = [];
  const presentHeaders: Record<string, string> = {};
  const missingHeaders: string[] = [];

  let httpsEnforced = false;
  let clickjackingProtected = false;

  // 1. Check HTTP to HTTPS redirect
  try {
    const httpTestUrl = `http://${urlObj.hostname}${urlObj.pathname || "/"}`;
    const redirectRes = await fetch(httpTestUrl, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(4000),
    });

    const location = redirectRes.headers.get("location");
    if (
      (redirectRes.status === 301 || redirectRes.status === 308 || redirectRes.status === 302) &&
      location?.startsWith("https://")
    ) {
      httpsEnforced = true;
    }
  } catch {
    // If port 80 is closed, site may be HTTPS-only natively
    httpsEnforced = urlObj.protocol === "https:";
  }

  checks.push({
    id: `check_https_enforce_${Date.now()}`,
    auditRunId,
    category: "HEADERS",
    checkName: "HTTPS Enforcement",
    status: httpsEnforced ? "PASS" : "FAIL",
    score: httpsEnforced ? 100 : 0,
    weight: 0.10,
    rawEvidence: { httpsEnforced, protocol: urlObj.protocol },
    errorMessage: httpsEnforced ? undefined : "HTTP requests are not redirected to HTTPS.",
    timestamp: new Date().toISOString(),
  });

  // 2. Inspect target response headers
  let resHeaders: Headers | null = null;
  let responseStatus = 0;

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "ReleaseLens-Audit-Agent/1.0 (+https://releaselens.dev)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(6000),
    });
    resHeaders = response.headers;
    responseStatus = response.status;
  } catch (err: any) {
    checks.push({
      id: `check_headers_fetch_${Date.now()}`,
      auditRunId,
      category: "HEADERS",
      checkName: "HTTP Security Headers",
      status: "INCONCLUSIVE",
      score: 50,
      weight: 0.15,
      rawEvidence: { error: err.message },
      errorMessage: `Could not reach target URL: ${err.message}`,
      timestamp: new Date().toISOString(),
    });

    return {
      checks,
      score: 50,
      presentHeaders: {},
      missingHeaders: ["ALL"],
      httpsEnforced,
      clickjackingProtected: false,
    };
  }

  // Evaluate the standard security headers
  const securityHeaderDefs = [
    {
      name: "strict-transport-security",
      label: "HSTS (Strict-Transport-Security)",
      weight: 25,
      validator: (val: string) => val.includes("max-age="),
    },
    {
      name: "x-frame-options",
      label: "Clickjacking Protection (X-Frame-Options / frame-ancestors)",
      weight: 25,
      validator: (val: string) => /deny|sameorigin/i.test(val),
    },
    {
      name: "x-content-type-options",
      label: "MIME-Type Sniffing Protection (X-Content-Type-Options)",
      weight: 15,
      validator: (val: string) => val.toLowerCase().includes("nosniff"),
    },
    {
      name: "content-security-policy",
      label: "Content Security Policy (CSP)",
      weight: 20,
      validator: (val: string) => val.length > 10,
    },
    {
      name: "referrer-policy",
      label: "Referrer Policy",
      weight: 10,
      validator: (val: string) => val.length > 0,
    },
    {
      name: "permissions-policy",
      label: "Permissions Policy",
      weight: 5,
      validator: (val: string) => val.length > 0,
    },
  ];

  let headerScore = 0;
  let totalHeaderWeight = 0;

  for (const def of securityHeaderDefs) {
    totalHeaderWeight += def.weight;
    const headerVal = resHeaders.get(def.name);

    if (headerVal && def.validator(headerVal)) {
      presentHeaders[def.name] = headerVal;
      headerScore += def.weight;
    } else {
      missingHeaders.push(def.name);
    }
  }

  // Check clickjacking specifically (X-Frame-Options or CSP frame-ancestors)
  const csp = resHeaders.get("content-security-policy") || "";
  const xfo = resHeaders.get("x-frame-options") || "";
  clickjackingProtected = /deny|sameorigin/i.test(xfo) || csp.includes("frame-ancestors");

  const normalizedScore = Math.round((headerScore / totalHeaderWeight) * 100);

  checks.push({
    id: `check_sec_headers_${Date.now()}`,
    auditRunId,
    category: "HEADERS",
    checkName: "Security Headers Evaluation",
    status: normalizedScore >= 60 ? "PASS" : "FAIL",
    score: normalizedScore,
    weight: 0.15,
    rawEvidence: {
      responseStatus,
      presentHeaders,
      missingHeaders,
      clickjackingProtected,
    },
    errorMessage:
      missingHeaders.length > 0
        ? `Missing recommended headers: ${missingHeaders.join(", ")}`
        : undefined,
    timestamp: new Date().toISOString(),
  });

  return {
    checks,
    score: normalizedScore,
    presentHeaders,
    missingHeaders,
    httpsEnforced,
    clickjackingProtected,
  };
}
