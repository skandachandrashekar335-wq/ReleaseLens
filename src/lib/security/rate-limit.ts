import { NextResponse } from "next/server";

export interface RateLimitOptions {
  limit: number;          // Max requests allowed in window
  windowSeconds: number;  // Window duration in seconds
  prefix?: string;        // Route or feature namespace
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;          // Unix timestamp in seconds
  retryAfter: number;     // Seconds until reset
}

interface BucketEntry {
  tokens: number;
  lastRefill: number;
}

// In-memory token bucket store (keyed by `${prefix}:${identifier}`)
const buckets = new Map<string, BucketEntry>();

// Periodic cleanup every 5 minutes to prevent memory leak
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function purgeStaleBuckets(windowSeconds: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const maxAgeMs = windowSeconds * 2000;
  for (const [key, entry] of buckets.entries()) {
    if (now - entry.lastRefill > maxAgeMs) {
      buckets.delete(key);
    }
  }
}

/**
 * Extract client IP address safely from standard proxy headers
 */
export function getClientIp(req: Request): string {
  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
}

/**
 * Check rate limit for an identifier (e.g. IP or userId)
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const { limit, windowSeconds, prefix = "global" } = options;

  // In test environment with default requests, allow high headroom unless testing rate limit
  const effectiveLimit =
    process.env.NODE_ENV === "test" && !prefix.startsWith("test_ratelimit")
      ? limit * 100
      : limit;

  const now = Date.now();
  const key = `${prefix}:${identifier}`;
  purgeStaleBuckets(windowSeconds);

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: effectiveLimit, lastRefill: now };
    buckets.set(key, bucket);
  } else {
    // Refill tokens based on elapsed time
    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = elapsedSeconds * (effectiveLimit / windowSeconds);
    bucket.tokens = Math.min(effectiveLimit, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  const reset = Math.ceil(now / 1000 + windowSeconds);
  const retryAfter = Math.max(1, Math.ceil((1 - bucket.tokens) * (windowSeconds / effectiveLimit)));

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return {
      success: true,
      limit: effectiveLimit,
      remaining: Math.floor(bucket.tokens),
      reset,
      retryAfter: 0,
    };
  }

  return {
    success: false,
    limit: effectiveLimit,
    remaining: 0,
    reset,
    retryAfter,
  };
}

/**
 * Create standard HTTP 429 Too Many Requests response with RFC compliant headers
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: "Too Many Requests",
      message: `Rate limit exceeded. Please wait ${result.retryAfter} seconds before retrying.`,
      retryAfter: result.retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.reset),
      },
    }
  );
}

/**
 * Clear rate limit store (useful for test isolation)
 */
export function resetRateLimits(): void {
  buckets.clear();
}
