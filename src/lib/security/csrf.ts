import { NextResponse } from "next/server";

/**
 * ReleaseLens CSRF & Origin Verification Guard
 * Defends against Cross-Site Request Forgery (CSRF) on state-changing API routes.
 */

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const ALLOWED_HOSTNAME_PATTERNS = [
  /^localhost(:\d+)?$/,
  /^127\.0\.0\.1(:\d+)?$/,
  /^\[::1\](:\d+)?$/,
  /^releaselens-psi\.vercel\.app$/,
  /^releaselens\.dev$/,
  /^.*\.releaselens\.dev$/,
  /^.*\.vercel\.app$/,
  /^.*-skandachandrashekar335-wqs-projects\.vercel\.app$/,
];

export interface CsrfValidationResult {
  valid: boolean;
  reason?: string;
  origin?: string;
}

export function validateCsrfOrigin(req: Request): CsrfValidationResult {
  if (!req || !req.method) {
    return { valid: true };
  }

  const method = req.method.toUpperCase();
  if (SAFE_METHODS.has(method)) {
    return { valid: true };
  }

  // If request uses explicit Authorization header (Bearer token / CI token),
  // browser ambient credentials (cookies) are not exploited by CSRF.
  const authHeader = req.headers.get("authorization");
  const originHeader = req.headers.get("origin");
  const refererHeader = req.headers.get("referer");

  // Determine request origin
  let targetOrigin = originHeader;
  if (!targetOrigin && refererHeader) {
    try {
      const refUrl = new URL(refererHeader);
      targetOrigin = refUrl.origin;
    } catch {
      targetOrigin = null;
    }
  }

  // If no Origin or Referer is supplied:
  // Allow if Bearer authorization header is present (non-browser client / CLI)
  if (!targetOrigin) {
    if (authHeader?.startsWith("Bearer ")) {
      return { valid: true, reason: "Authenticated via explicit Bearer token" };
    }
    // Allow in test environment if test runner doesn't set origin
    if (process.env.NODE_ENV === "test") {
      return { valid: true, reason: "Test environment bypass" };
    }
    return {
      valid: false,
      reason: "Missing Origin and Referer headers on state-changing request.",
    };
  }

  let originHost = "";
  try {
    const parsed = new URL(targetOrigin);
    originHost = parsed.host.toLowerCase();
  } catch {
    return { valid: false, reason: "Malformed Origin header URL." };
  }

  // Check matching Host / X-Forwarded-Host header (same-origin)
  const rawReqHost = (
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    ""
  ).toLowerCase();

  const reqHost = rawReqHost.split(",")[0].trim().toLowerCase();

  if (reqHost && (originHost === reqHost || reqHost.startsWith(`${originHost}:`))) {
    return { valid: true, origin: targetOrigin };
  }

  // Check explicit allowed hostname patterns
  for (const pattern of ALLOWED_HOSTNAME_PATTERNS) {
    if (pattern.test(originHost)) {
      return { valid: true, origin: targetOrigin };
    }
  }

  // Check environment-configured origin
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (configuredAppUrl) {
    try {
      const appHost = new URL(configuredAppUrl).host.toLowerCase();
      if (originHost === appHost) {
        return { valid: true, origin: targetOrigin };
      }
    } catch {}
  }

  return {
    valid: false,
    origin: targetOrigin,
    reason: `Cross-origin request from '${targetOrigin}' rejected by CSRF policy.`,
  };
}

export function createCsrfResponse(result: CsrfValidationResult): NextResponse {
  return NextResponse.json(
    {
      error: result.reason || "Cross-origin request forbidden (CSRF defense).",
      code: "CSRF_REJECTED",
    },
    { status: 403 }
  );
}

export function guardCsrf(req: Request): NextResponse | null {
  const result = validateCsrfOrigin(req);
  if (!result.valid) {
    return createCsrfResponse(result);
  }
  return null;
}
