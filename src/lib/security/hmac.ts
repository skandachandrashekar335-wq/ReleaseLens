import crypto from "crypto";
import { NextResponse } from "next/server";

/**
 * ReleaseLens HMAC-SHA256 Request Signature Verification
 * Defends against payload tampering and replay attacks on CI/Webhook ingress.
 */

const DEFAULT_MAX_AGE_SECONDS = 300; // 5 minutes

export interface HmacVerificationResult {
  valid: boolean;
  reason?: string;
}

export function createHmacSignature(
  payload: string,
  secret: string,
  timestamp: number = Math.floor(Date.now() / 1000)
): { signature: string; timestamp: number; headerValue: string } {
  const message = `${timestamp}.${payload}`;
  const hmac = crypto.createHmac("sha256", secret).update(message).digest("hex");
  return {
    signature: hmac,
    timestamp,
    headerValue: `t=${timestamp},v1=${hmac}`,
  };
}

export function verifyHmacSignature(
  payload: string,
  rawSignatureHeader: string,
  secret: string,
  options: { maxAgeSeconds?: number; currentTimestamp?: number } = {}
): HmacVerificationResult {
  if (!rawSignatureHeader || !secret) {
    return { valid: false, reason: "Missing signature header or secret key." };
  }

  const maxAge = options.maxAgeSeconds || DEFAULT_MAX_AGE_SECONDS;
  const now = options.currentTimestamp || Math.floor(Date.now() / 1000);

  // Parse header format: t=1234567890,v1=abcdef...
  let timestamp: number | null = null;
  let signature: string | null = null;

  if (rawSignatureHeader.includes("t=") && rawSignatureHeader.includes("v1=")) {
    const parts = rawSignatureHeader.split(",");
    for (const part of parts) {
      const [k, v] = part.split("=").map((s) => s.trim());
      if (k === "t") timestamp = parseInt(v, 10);
      if (k === "v1") signature = v;
    }
  } else if (rawSignatureHeader.startsWith("sha256=")) {
    signature = rawSignatureHeader.substring(7).trim();
  } else {
    signature = rawSignatureHeader.trim();
  }

  if (!signature) {
    return { valid: false, reason: "Unable to parse signature from header." };
  }

  // Validate timestamp replay window if timestamp was provided
  if (timestamp !== null) {
    if (isNaN(timestamp)) {
      return { valid: false, reason: "Invalid timestamp in signature header." };
    }
    const age = Math.abs(now - timestamp);
    if (age > maxAge) {
      return {
        valid: false,
        reason: `Request timestamp skewed or expired (${age}s > ${maxAge}s limit). Replay protection triggered.`,
      };
    }
  }

  // Compute expected HMAC
  const message = timestamp !== null ? `${timestamp}.${payload}` : payload;
  const expectedHmac = crypto.createHmac("sha256", secret).update(message).digest("hex");

  const expectedBuffer = Buffer.from(expectedHmac, "hex");
  const providedBuffer = Buffer.from(signature, "hex");

  if (expectedBuffer.length !== providedBuffer.length) {
    return { valid: false, reason: "Signature length mismatch." };
  }

  // Timing-safe constant-time comparison
  const isValid = crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  if (!isValid) {
    return { valid: false, reason: "Cryptographic signature verification failed." };
  }

  return { valid: true };
}

export function guardWebhookHmac(
  req: Request,
  rawBody: string,
  secretEnvKey = "CI_WEBHOOK_SECRET"
): NextResponse | null {
  const secret = process.env[secretEnvKey];
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret is not configured on server.", code: "CONFIG_ERROR" },
      { status: 500 }
    );
  }

  const sigHeader =
    req.headers.get("x-releaselens-signature") ||
    req.headers.get("x-hub-signature-256") ||
    "";

  const result = verifyHmacSignature(rawBody, sigHeader, secret);
  if (!result.valid) {
    return NextResponse.json(
      { error: result.reason || "Unauthorized webhook request.", code: "INVALID_SIGNATURE" },
      { status: 401 }
    );
  }

  return null;
}
