import { describe, it, expect } from "vitest";
import { inspectSecurityHeaders } from "../src/lib/engine/security-headers";

describe("Security Headers Inspector", () => {
  it("correctly identifies secure headers and reports high score when present", async () => {
    const mockHeaders = new Headers({
      "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
      "content-security-policy": "default-src 'self'",
      "x-frame-options": "DENY",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
      "permissions-policy": "camera=(), microphone=()",
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      return new Response("<html><body>Secure Site</body></html>", {
        status: 200,
        headers: mockHeaders,
      });
    };

    try {
      const result = await inspectSecurityHeaders("https://secure.example.com", "run_test_1");
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.missingHeaders.length).toBe(0);
      expect(result.clickjackingProtected).toBe(true);
      expect(result.checks.length).toBeGreaterThan(0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("identifies missing critical headers and flags clickjacking vulnerability", async () => {
    const mockHeaders = new Headers({
      "x-content-type-options": "nosniff",
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      return new Response("<html><body>Insecure Site</body></html>", {
        status: 200,
        headers: mockHeaders,
      });
    };

    try {
      const result = await inspectSecurityHeaders("https://insecure.example.com", "run_test_2");
      expect(result.score).toBeLessThan(70);
      expect(result.missingHeaders).toContain("strict-transport-security");
      expect(result.missingHeaders).toContain("content-security-policy");
      expect(result.clickjackingProtected).toBe(false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
