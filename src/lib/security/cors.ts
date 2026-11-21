import { NextResponse } from "next/server";

/**
 * ReleaseLens Strict CORS Middleware / Guard
 * Enforces explicit origin allowlisting; disallows wildcard '*' on authenticated endpoints.
 */

const ALLOWED_ORIGIN_PATTERNS = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/releaselens-psi\.vercel\.app$/,
  /^https:\/\/releaselens\.dev$/,
  /^https:\/\/.*\.releaselens\.dev$/,
  /^https:\/\/.*-skandachandrashekar335-wqs-projects\.vercel\.app$/,
];

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const originString = url.origin.toLowerCase();
    for (const pattern of ALLOWED_ORIGIN_PATTERNS) {
      if (pattern.test(originString)) {
        return true;
      }
    }
    const envOrigin = process.env.NEXT_PUBLIC_APP_URL;
    if (envOrigin && new URL(envOrigin).origin.toLowerCase() === originString) {
      return true;
    }
  } catch {}
  return false;
}

export function applyCorsHeaders(req: Request, res: NextResponse): NextResponse {
  const origin = req.headers.get("origin");

  if (origin && isAllowedOrigin(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-ReleaseLens-Signature, X-ReleaseLens-Timestamp, X-Requested-With"
    );
    res.headers.set("Vary", "Origin");
  }

  return res;
}

export function handleCorsPreflight(req: Request): NextResponse | null {
  if (req.method.toUpperCase() === "OPTIONS") {
    const origin = req.headers.get("origin");
    if (origin && isAllowedOrigin(origin)) {
      const res = new NextResponse(null, { status: 204 });
      return applyCorsHeaders(req, res);
    }
    return new NextResponse(null, { status: 403 });
  }
  return null;
}
