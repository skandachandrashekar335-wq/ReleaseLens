import { describe, it, expect, vi, beforeEach } from "vitest";
import { inspectHtmlDom } from "../src/lib/engine/html-inspector";
import * as ssrfModule from "../src/lib/engine/ssrf-guard";

describe("HTML DOM & Accessibility Inspector", () => {
  beforeEach(() => {
    vi.spyOn(ssrfModule, "validateTargetUrl").mockResolvedValue({
      isAllowed: true,
      resolvedIp: "93.184.216.34",
    });
  });
  it("detects missing title, meta description, lang attribute, and unlabeled inputs", async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head></head>
        <body>
          <form>
            <input type="text" name="username" />
          </form>
          <img src="/logo.png" />
        </body>
      </html>
    `;

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      status: 200,
      ok: true,
      text: async () => mockHtml,
    } as any);

    const result = await inspectHtmlDom(
      "https://example.com/test",
      "run_test_01",
      "proj_test_01"
    );

    expect(result.checks.length).toBeGreaterThan(0);
    expect(result.metadata.title).toBeNull();
    expect(result.metadata.htmlLang).toBeNull();
    expect(result.metadata.imagesMissingAlt).toBe(1);
    expect(result.metadata.inputsMissingLabels).toBe(1);

    const titleFinding = result.findings.find((f) => f.sourceCheck === "document_title");
    expect(titleFinding).toBeDefined();
    expect(titleFinding?.id).toMatch(/^fnd_/);

    const langFinding = result.findings.find((f) => f.sourceCheck === "html_lang");
    expect(langFinding).toBeDefined();

    const altFinding = result.findings.find((f) => f.sourceCheck === "image_alt_text");
    expect(altFinding).toBeDefined();

    const inputFinding = result.findings.find((f) => f.sourceCheck === "form_accessible_labels");
    expect(inputFinding).toBeDefined();
    expect(inputFinding?.recommendedSeverity).toBe("HIGH");
  });

  it("detects passive and active mixed content when target origin is HTTPS", async () => {
    const mockHtmlWithMixedContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>Secure App</title>
          <meta name="description" content="A secure app with mixed content" />
          <link rel="stylesheet" href="http://insecure-cdn.com/style.css" />
        </head>
        <body>
          <h1>Main Dashboard</h1>
          <img src="http://insecure-cdn.com/tracker.png" alt="tracker" />
        </body>
      </html>
    `;

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      status: 200,
      ok: true,
      text: async () => mockHtmlWithMixedContent,
    } as any);

    const result = await inspectHtmlDom(
      "https://secure-bank.example.com",
      "run_test_02",
      "proj_test_02"
    );

    const mixedContentFinding = result.findings.find((f) => f.sourceCheck === "mixed_content");
    expect(mixedContentFinding).toBeDefined();
    expect(mixedContentFinding?.recommendedSeverity).toBe("CRITICAL");
    expect(result.metadata.mixedContentUrls.length).toBe(2);
  });
});
