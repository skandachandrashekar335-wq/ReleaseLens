import { describe, it, expect } from "vitest";
import { PlaywrightBrowserWorker } from "../src/lib/engine/browser-worker";

describe("Autonomous Playwright Browser Worker", () => {
  it("launches headless browser, navigates, captures screenshot, and monitors console errors", async () => {
    const worker = new PlaywrightBrowserWorker();

    // Test with real data URL containing DOM elements, buttons, and a deliberate console error
    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>ReleaseLens Autonomous QA Test</title></head>
        <body>
          <header>
            <nav>
              <a href="https://example.com/about">About</a>
              <a href="https://example.com/pricing">Pricing</a>
            </nav>
          </header>
          <main>
            <h1>Autonomous Browser Test Page</h1>
            <button id="safe-tab" aria-label="Toggle Details">Expand Details</button>
            <button id="del-btn" class="danger">Delete Account</button>
            <form id="contact-form">
              <input type="text" name="username" placeholder="Enter username" />
            </form>
          </main>
          <script>
            console.error("Test Synthetic Runtime Error: Hydration mismatch detected");
          </script>
        </body>
      </html>
    `;

    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(testHtml)}`;

    const result = await worker.execute({
      targetUrl: dataUrl,
      auditRunId: "run_browser_test_1",
      projectId: "proj_test_1",
      timeoutMs: 8000,
      maxInteractiveActions: 2,
      allowDataUrls: true,
    });

    expect(result.driver).toBe("PLAYWRIGHT_HEADLESS");
    expect(result.executionTraces.length).toBeGreaterThan(0);
    expect(result.screenshotBase64).toBeDefined();
    expect(result.screenshotBase64?.startsWith("data:image/jpeg;base64,")).toBe(true);

    // Console error check
    expect(result.consoleErrors.length).toBeGreaterThan(0);
    expect(result.consoleErrors.some((e) => e.text.includes("Hydration mismatch"))).toBe(true);

    // Check that button safety classification worked
    expect(result.discoveredButtons.length).toBeGreaterThanOrEqual(2);
    const deleteBtn = result.discoveredButtons.find((b) => b.text.includes("delete"));
    expect(deleteBtn?.isSafeToInteract).toBe(false); // Destructive control identified!

    const safeBtn = result.discoveredButtons.find((b) => b.text.includes("expand"));
    expect(safeBtn?.isSafeToInteract).toBe(true);

    // Check generated checks and findings
    expect(result.checks.some((c) => c.name?.includes("Console Stability"))).toBe(true);
    expect(result.findings.some((f) => f.title.includes("Console Errors Detected"))).toBe(true);
  });

  it("aborts safely and records failure check if SSRF guard trips", async () => {
    const worker = new PlaywrightBrowserWorker();
    const result = await worker.execute({
      targetUrl: "http://169.254.169.254/latest/meta-data/",
      auditRunId: "run_ssrf_test",
      projectId: "proj_test_2",
    });

    expect(result.checks.some((c) => c.status === "FAIL")).toBe(true);
    expect(result.findings.some((f) => f.title.includes("SSRF Firewall"))).toBe(true);
  });
});
