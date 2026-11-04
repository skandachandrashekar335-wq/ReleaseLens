import { chromium, Browser, Page } from "playwright";
import { AutomatedCheck, PotentialFinding } from "../types";
import { validateTargetUrl } from "./ssrf-guard";

export interface BrowserExecutionOptions {
  targetUrl: string;
  auditRunId: string;
  projectId: string;
  timeoutMs?: number;
  viewport?: { width: number; height: number };
  maxInteractiveActions?: number;
  allowDataUrls?: boolean;
}

export interface BrowserExecutionResult {
  driver: "PLAYWRIGHT_HEADLESS" | "HTTP_FALLBACK";
  screenshotBase64?: string;
  consoleErrors: Array<{ type: string; text: string; location?: string }>;
  networkFailures: Array<{ url: string; status: number; statusText: string }>;
  discoveredRoutes: string[];
  discoveredButtons: Array<{ text: string; role?: string; isSafeToInteract: boolean }>;
  formDefects: Array<{ formId?: string; issue: string; severity: "HIGH" | "MEDIUM" | "LOW" }>;
  checks: AutomatedCheck[];
  findings: PotentialFinding[];
  executionTraces: Array<{ step: string; timestamp: string; durationMs: number; status: "OK" | "WARN" | "FAIL" }>;
}

export interface IBrowserWorker {
  execute(options: BrowserExecutionOptions): Promise<BrowserExecutionResult>;
}

// Destructive patterns that MUST NEVER be automatically clicked in autonomous testing
const DESTRUCTIVE_KEYWORDS = [
  "delete",
  "destroy",
  "remove",
  "drop",
  "pay",
  "payment",
  "checkout",
  "purchase",
  "buy",
  "order",
  "logout",
  "signout",
  "sign out",
  "reset",
  "terminate",
  "purge",
  "erase",
  "cancel order",
];

export class PlaywrightBrowserWorker implements IBrowserWorker {
  async execute(options: BrowserExecutionOptions): Promise<BrowserExecutionResult> {
    const {
      targetUrl,
      auditRunId,
      projectId,
      timeoutMs = 15000,
      viewport = { width: 1280, height: 720 },
      maxInteractiveActions = 5,
    } = options;

    const traces: BrowserExecutionResult["executionTraces"] = [];
    const consoleErrors: BrowserExecutionResult["consoleErrors"] = [];
    const networkFailures: BrowserExecutionResult["networkFailures"] = [];
    const discoveredRoutes: string[] = [];
    const discoveredButtons: BrowserExecutionResult["discoveredButtons"] = [];
    const formDefects: BrowserExecutionResult["formDefects"] = [];
    const checks: AutomatedCheck[] = [];
    const findings: PotentialFinding[] = [];
    let screenshotBase64: string | undefined;

    const logTrace = (step: string, startTime: number, status: "OK" | "WARN" | "FAIL" = "OK") => {
      traces.push({
        step,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        status,
      });
    };

    // 1. SSRF & Network Boundary Guard
    const ssrfStart = Date.now();
    const ssrfValidation = await validateTargetUrl(targetUrl, { allowDataUrls: options.allowDataUrls });
    if (!ssrfValidation.isAllowed) {
      logTrace(`SSRF Check Blocked: ${ssrfValidation.reason}`, ssrfStart, "FAIL");
      checks.push({
        id: `check_browser_ssrf_${Date.now()}`,
        auditRunId,
        category: "AVAILABILITY",
        dimension: "security",
        name: "Autonomous Browser SSRF Gate",
        status: "FAIL",
        score: 0,
        rawEvidence: { blockedUrl: targetUrl, reason: ssrfValidation.reason },
        errorMessage: ssrfValidation.reason,
        timestamp: new Date().toISOString(),
      });

      return {
        driver: "PLAYWRIGHT_HEADLESS",
        consoleErrors: [],
        networkFailures: [],
        discoveredRoutes: [],
        discoveredButtons: [],
        formDefects: [],
        checks,
        findings: [
          {
            id: `find_ssrf_${Date.now()}`,
            auditRunId,
            projectId,
            testSource: "SECURITY_PROBE",
            sourceCheck: "ssrf_firewall",
            affectedUrl: targetUrl,
            title: "Autonomous Inspection Blocked by SSRF Firewall",
            description: ssrfValidation.reason || "Target URL points to internal or restricted IP space.",
            recommendedSeverity: "CRITICAL",
            suggestedSeverity: "CRITICAL",
            confidence: "HIGH",
            status: "NEEDS_REVIEW",
            createdAt: new Date().toISOString(),
          },
        ],
        executionTraces: traces,
      };
    }
    logTrace("SSRF Validation Passed", ssrfStart, "OK");

    let browser: Browser | null = null;
    try {
      const launchStart = Date.now();
      browser = await chromium.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      });
      logTrace("Browser Instance Spawned", launchStart, "OK");

      const context = await browser.newContext({
        viewport,
        userAgent: "ReleaseLens-Autonomous-QA/0.1 (+https://github.com/skandachandrashekar335-wq/ReleaseLens)",
      });

      const page: Page = await context.newPage();

      // Listen for JavaScript Console Errors & Exceptions
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push({
            type: msg.type(),
            text: msg.text(),
            location: msg.location().url,
          });
        }
      });

      page.on("pageerror", (err) => {
        consoleErrors.push({
          type: "uncaught_exception",
          text: err.message,
          location: err.stack?.split("\n")[1]?.trim(),
        });
      });

      // Listen for Network Request Failures (4xx / 5xx)
      page.on("response", (res) => {
        if (res.status() >= 400) {
          networkFailures.push({
            url: res.url(),
            status: res.status(),
            statusText: res.statusText(),
          });
        }
      });

      // Universal Browser Route Interception for Subresource & Redirect SSRF Defense
      await page.route("**/*", async (route) => {
        const req = route.request();
        const reqUrl = req.url();

        if (reqUrl.startsWith("data:")) {
          if (options.allowDataUrls) {
            return route.continue();
          }
        }

        try {
          const check = await validateTargetUrl(reqUrl, { allowDataUrls: options.allowDataUrls });
          if (!check.isAllowed) {
            networkFailures.push({
              url: reqUrl,
              status: 403,
              statusText: `Blocked by SSRF Perimeter: ${check.reason}`,
            });
            return route.abort("accessdenied");
          }
          return route.continue();
        } catch {
          return route.abort("blockedbyclient");
        }
      });

      // 2. Real Browser Navigation
      const navStart = Date.now();
      await page.goto(targetUrl, {
        timeout: timeoutMs,
        waitUntil: "domcontentloaded",
      });
      logTrace("DOM Content Loaded", navStart, "OK");

      // Give dynamic SPAs 1 second to hydrate
      await page.waitForTimeout(1000);

      // 3. Take Real Viewport Screenshot Evidence
      const shotStart = Date.now();
      try {
        const shotBuffer = await page.screenshot({ fullPage: false, type: "jpeg", quality: 80 });
        screenshotBase64 = `data:image/jpeg;base64,${shotBuffer.toString("base64")}`;
        logTrace("Viewport Screenshot Captured", shotStart, "OK");
      } catch (err: any) {
        logTrace(`Screenshot Failed: ${err.message}`, shotStart, "WARN");
      }

      // 4. Discover Internal Routes and Links in the DOM
      const linkStart = Date.now();
      const rawLinks = await page.$$eval("a[href]", (anchors) =>
        anchors.map((a) => (a as HTMLAnchorElement).href)
      );

      const urlObj = new URL(targetUrl);
      const internalRoutes = Array.from(
        new Set(
          rawLinks
            .filter((href) => {
              try {
                const h = new URL(href);
                return h.hostname === urlObj.hostname;
              } catch {
                return false;
              }
            })
            .slice(0, 15)
        )
      );
      discoveredRoutes.push(...internalRoutes);
      logTrace(`Discovered ${discoveredRoutes.length} Internal Routes`, linkStart, "OK");

      // 5. Inspect Interactive Controls (Buttons, Inputs) & Distinguish Safe vs Destructive
      const domInspectStart = Date.now();
      const rawButtons = await page.$$eval("button, [role='button'], input[type='submit']", (elements) =>
        elements.map((el) => {
          const text = (el.textContent || (el as HTMLInputElement).value || "").trim().toLowerCase();
          const role = el.getAttribute("role") || el.tagName.toLowerCase();
          const ariaLabel = el.getAttribute("aria-label") || "";
          return { text: text || ariaLabel || "Icon Button", role };
        })
      );

      for (const b of rawButtons.slice(0, 20)) {
        const isDestructive = DESTRUCTIVE_KEYWORDS.some((kw) => b.text.includes(kw));
        discoveredButtons.push({
          text: b.text,
          role: b.role,
          isSafeToInteract: !isDestructive,
        });
      }
      logTrace(`Inspected ${discoveredButtons.length} Interactive Elements`, domInspectStart, "OK");

      // 6. Safe Non-Destructive Interactive Testing (Clicking tabs / disclosures)
      let testedActionCount = 0;
      const safeButtons = await page.$$("button:not([disabled]), [role='button']");

      for (const btn of safeButtons) {
        if (testedActionCount >= maxInteractiveActions) break;

        try {
          const btnText = ((await btn.textContent()) || "").toLowerCase();
          const isDestructive = DESTRUCTIVE_KEYWORDS.some((kw) => btnText.includes(kw));

          if (!isDestructive && btnText.length > 0) {
            const beforeErrorCount = consoleErrors.length;
            await btn.click({ timeout: 2000 });
            await page.waitForTimeout(400);

            if (consoleErrors.length > beforeErrorCount) {
              const newErr = consoleErrors[consoleErrors.length - 1];
              findings.push({
                id: `find_click_err_${Date.now()}_${testedActionCount}`,
                auditRunId,
                projectId,
                testSource: "CONSOLE_SNIFFER",
                sourceCheck: "interactive_interaction",
                affectedUrl: targetUrl,
                title: `Uncaught JS Exception Triggered on Button Click: "${btnText.slice(0, 30)}"`,
                description: `Tapping button "${btnText}" raised an uncaught runtime error: ${newErr.text}`,
                expectedBehavior: "Interactive buttons should handle click events without unhandled exceptions.",
                observedBehavior: newErr.text,
                recommendedSeverity: "HIGH",
                suggestedSeverity: "HIGH",
                confidence: "HIGH",
                evidencePayload: { buttonText: btnText, error: newErr },
                status: "NEEDS_REVIEW",
                createdAt: new Date().toISOString(),
              });
            }
            testedActionCount++;
          }
        } catch {
          // If button is hidden or detached, proceed safely
        }
      }

      // 7. Inspect Forms & Accessibility Defects
      const formInspectStart = Date.now();
      const formIssues = await page.$$eval("form, input", (nodes) => {
        const issues: Array<{ issue: string; severity: "HIGH" | "MEDIUM" | "LOW" }> = [];
        const inputs = Array.from(document.querySelectorAll("input:not([type='hidden'])"));

        for (const input of inputs) {
          const id = input.id;
          const hasLabel = id ? document.querySelector(`label[for='${id}']`) : null;
          const hasAria = input.getAttribute("aria-label") || input.getAttribute("aria-labelledby");

          if (!hasLabel && !hasAria && !input.getAttribute("placeholder")) {
            issues.push({
              issue: `Input field (${(input as HTMLInputElement).name || (input as HTMLInputElement).type}) lacks visible <label> or aria-label.`,
              severity: "LOW",
            });
          }
        }
        return issues.slice(0, 5);
      });

      formDefects.push(...formIssues);
      logTrace(`Inspected Form Controls (${formDefects.length} issues)`, formInspectStart, "OK");

      // 8. Generate Automated Checks & Findings from Real Execution
      // Check A: JS Console Health
      checks.push({
        id: `check_console_${Date.now()}`,
        auditRunId,
        category: "AVAILABILITY",
        dimension: "availability",
        checkName: "Browser JavaScript Console Stability",
        name: "Browser JavaScript Console Stability",
        status: consoleErrors.length === 0 ? "PASS" : consoleErrors.some((e) => e.type === "uncaught_exception") ? "FAIL" : "WARNING",
        score: Math.max(0, 100 - consoleErrors.length * 20),
        weight: 0.20,
        rawEvidence: { errorCount: consoleErrors.length, errors: consoleErrors.slice(0, 5) },
        summary: consoleErrors.length === 0 ? "Zero uncaught console errors observed during browser execution." : `${consoleErrors.length} console errors detected during runtime execution.`,
        durationMs: Date.now() - navStart,
        timestamp: new Date().toISOString(),
      });

      if (consoleErrors.length > 0) {
        findings.push({
          id: `find_console_${Date.now()}`,
          auditRunId,
          projectId,
          testSource: "CONSOLE_SNIFFER",
          sourceCheck: "browser_console",
          affectedUrl: targetUrl,
          title: `Browser Console Errors Detected (${consoleErrors.length} errors)`,
          description: `Headless Chromium detected ${consoleErrors.length} runtime error(s) during page lifecycle. Top error: ${consoleErrors[0]?.text}`,
          expectedBehavior: "Application should mount and execute without uncaught JavaScript exceptions.",
          observedBehavior: consoleErrors[0]?.text || "Console errors detected",
          recommendedSeverity: consoleErrors.some((e) => e.type === "uncaught_exception") ? "HIGH" : "MEDIUM",
          suggestedSeverity: consoleErrors.some((e) => e.type === "uncaught_exception") ? "HIGH" : "MEDIUM",
          confidence: "HIGH",
          evidencePayload: { consoleErrors },
          status: "NEEDS_REVIEW",
          createdAt: new Date().toISOString(),
        });
      }

      // Check B: Network Resource Integrity
      checks.push({
        id: `check_network_${Date.now()}`,
        auditRunId,
        category: "AVAILABILITY",
        dimension: "availability",
        checkName: "Network Subresource Integrity (4xx/5xx)",
        name: "Network Subresource Integrity (4xx/5xx)",
        status: networkFailures.length === 0 ? "PASS" : "WARNING",
        score: Math.max(0, 100 - networkFailures.length * 25),
        weight: 0.15,
        rawEvidence: { failedCount: networkFailures.length, failures: networkFailures.slice(0, 5) },
        summary: networkFailures.length === 0 ? "All network subresources resolved with HTTP 2xx/3xx." : `${networkFailures.length} failed subresource requests detected.`,
        durationMs: Date.now() - navStart,
        timestamp: new Date().toISOString(),
      });

      if (networkFailures.length > 0) {
        findings.push({
          id: `find_network_${Date.now()}`,
          auditRunId,
          projectId,
          testSource: "LINK_CRAWLER",
          sourceCheck: "subresource_integrity",
          affectedUrl: networkFailures[0].url,
          title: `Subresource HTTP ${networkFailures[0].status} Error (${networkFailures.length} failures)`,
          description: `Browser network trace detected failure loading subresource: ${networkFailures[0].url} (${networkFailures[0].statusText}).`,
          expectedBehavior: "All images, scripts, and API assets should return HTTP 200 OK.",
          observedBehavior: `HTTP ${networkFailures[0].status} ${networkFailures[0].statusText}`,
          recommendedSeverity: "MEDIUM",
          suggestedSeverity: "MEDIUM",
          confidence: "HIGH",
          evidencePayload: { networkFailures },
          status: "NEEDS_REVIEW",
          createdAt: new Date().toISOString(),
        });
      }

      return {
        driver: "PLAYWRIGHT_HEADLESS",
        screenshotBase64,
        consoleErrors,
        networkFailures,
        discoveredRoutes,
        discoveredButtons,
        formDefects,
        checks,
        findings,
        executionTraces: traces,
      };
    } catch (err: any) {
      logTrace(`Browser Execution Failure: ${err.message}`, Date.now(), "FAIL");
      checks.push({
        id: `check_browser_err_${Date.now()}`,
        auditRunId,
        category: "AVAILABILITY",
        dimension: "availability",
        checkName: "Browser Execution Resilience",
        name: "Browser Execution Resilience",
        status: "FAIL",
        score: 0,
        rawEvidence: { error: err.message, stack: err.stack },
        errorMessage: `Autonomous browser crashed or timed out: ${err.message}`,
        durationMs: timeoutMs,
        timestamp: new Date().toISOString(),
      });

      return {
        driver: "PLAYWRIGHT_HEADLESS",
        consoleErrors,
        networkFailures,
        discoveredRoutes,
        discoveredButtons,
        formDefects,
        checks,
        findings,
        executionTraces: traces,
      };
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }
}
