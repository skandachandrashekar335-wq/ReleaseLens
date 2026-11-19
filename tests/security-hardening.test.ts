import { describe, it, expect, beforeEach, vi } from "vitest";
import { validateTargetUrl } from "@/lib/engine/ssrf-guard";
import { safeFetchWithSsrfRedirectGuard } from "@/lib/engine/link-crawler";
import {
  checkRateLimit,
  createRateLimitResponse,
  resetRateLimits,
} from "@/lib/security/rate-limit";

describe("ReleaseLens Security Hardening & Perimeter Defense Suite", () => {
  beforeEach(() => {
    resetRateLimits();
    vi.restoreAllMocks();
  });

  describe("1. SSRF Perimeter & Embedded Userinfo Rejection", () => {
    it("rejects URLs containing embedded userinfo credentials (user:password@host)", async () => {
      const targets = [
        "http://admin:secret@example.com",
        "https://user:pass@google.com/path",
        "http://root:@example.org",
        "https://:password@example.net",
      ];

      for (const target of targets) {
        const result = await validateTargetUrl(target);
        expect(result.isAllowed).toBe(false);
        expect(result.reason).toContain("userinfo credentials");
      }
    });

    it("rejects multicast, broadcast, and reserved addresses", async () => {
      const targets = [
        "http://224.0.0.1",
        "http://239.255.255.250",
        "http://240.0.0.1",
        "http://255.255.255.255",
      ];

      for (const target of targets) {
        const result = await validateTargetUrl(target);
        expect(result.isAllowed).toBe(false);
      }
    });

    it("rejects IPv6 loopback, link-local, and cloud metadata literals", async () => {
      const targets = [
        "http://[::1]",
        "http://[fe80::1]",
        "http://[fd00:ec2::254]",
      ];

      for (const target of targets) {
        const result = await validateTargetUrl(target);
        expect(result.isAllowed).toBe(false);
      }
    });

    it("allows standard public HTTPS web applications", async () => {
      const result = await validateTargetUrl("https://example.com");
      expect(result.isAllowed).toBe(true);
    });
  });

  describe("2. Redirect-Chain SSRF Defense in Crawler", () => {
    it("blocks redirect chains leading to internal/metadata addresses", async () => {
      // Mock global fetch returning a 302 redirecting to cloud metadata
      const mockFetch = vi.fn().mockImplementation((url) => {
        if (url === "https://example.com/initial") {
          return Promise.resolve(
            new Response(null, {
              status: 302,
              headers: { Location: "http://169.254.169.254/latest/meta-data/" },
            })
          );
        }
        return Promise.resolve(new Response("OK", { status: 200 }));
      });

      vi.stubGlobal("fetch", mockFetch);

      await expect(
        safeFetchWithSsrfRedirectGuard("https://example.com/initial")
      ).rejects.toThrow(/SSRF Block/);
    });

    it("aborts when maximum redirect hops (5) are exceeded", async () => {
      let hopCount = 0;
      const mockFetch = vi.fn().mockImplementation((url) => {
        hopCount++;
        return Promise.resolve(
          new Response(null, {
            status: 302,
            headers: { Location: `https://example.com/hop-${hopCount}` },
          })
        );
      });

      vi.stubGlobal("fetch", mockFetch);

      await expect(
        safeFetchWithSsrfRedirectGuard("https://example.com/hop-0", {}, 5)
      ).rejects.toThrow(/Maximum redirect hops/);
    });
  });

  describe("3. Sliding-Window Rate Limiter & RFC Header Enforcement", () => {
    it("allows requests up to configured limit and blocks with 429 when exhausted", () => {
      const clientKey = "test_client_123";
      const options = {
        limit: 3,
        windowSeconds: 60,
        prefix: "test_ratelimit_strict",
      };

      // Requests 1, 2, 3 succeed
      expect(checkRateLimit(clientKey, options).success).toBe(true);
      expect(checkRateLimit(clientKey, options).success).toBe(true);
      expect(checkRateLimit(clientKey, options).success).toBe(true);

      // Request 4 blocked
      const blockedResult = checkRateLimit(clientKey, options);
      expect(blockedResult.success).toBe(false);
      expect(blockedResult.remaining).toBe(0);
      expect(blockedResult.retryAfter).toBeGreaterThan(0);

      // Verify HTTP 429 response helper
      const response = createRateLimitResponse(blockedResult);
      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBeDefined();
      expect(response.headers.get("X-RateLimit-Limit")).toBe("3");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
    });
  });
});
