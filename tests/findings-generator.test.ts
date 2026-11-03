import { describe, it, expect } from "vitest";
import { generatePotentialFindings } from "../src/lib/engine/findings-generator";
import { BrokenLink } from "../src/lib/engine/link-crawler";

describe("Findings Generator (Automate First, Human Review Second)", () => {
  it("converts broken links, expired TLS, and missing headers into potential findings in NEEDS_REVIEW status", () => {
    const brokenLinks: BrokenLink[] = [
      {
        url: "https://example.com/missing-page",
        sourceUrl: "https://example.com",
        statusCode: 404,
      },
    ];

    const missingHeaders = ["x-frame-options", "content-security-policy", "strict-transport-security"];
    const tlsDaysRemaining = -1; // Expired

    const findings = generatePotentialFindings(
      "run_1",
      "proj_1",
      "https://example.com",
      [],
      brokenLinks,
      missingHeaders,
      tlsDaysRemaining
    );

    expect(findings.length).toBeGreaterThanOrEqual(3);
    expect(findings.every((f) => f.status === "NEEDS_REVIEW")).toBe(true);

    const linkFinding = findings.find((f) => f.testSource === "LINK_CRAWLER");
    expect(linkFinding).toBeDefined();
    expect(linkFinding?.recommendedSeverity).toBe("HIGH");

    const tlsFinding = findings.find((f) => f.title.includes("Expired TLS"));
    expect(tlsFinding).toBeDefined();
    expect(tlsFinding?.recommendedSeverity).toBe("CRITICAL");

    const hstsFinding = findings.find((f) => f.title.includes("Strict Transport Security"));
    expect(hstsFinding).toBeDefined();
    expect(hstsFinding?.recommendedSeverity).toBe("MEDIUM");
  });
});
