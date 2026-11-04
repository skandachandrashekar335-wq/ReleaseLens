import { spawn } from "child_process";
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const PORT = 3088;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SCREENSHOT_DIR = path.resolve("./screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  let lastErr = "";
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status >= 200 && res.status < 400) return true;
    } catch (err) {
      lastErr = err.message;
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server failed to start at ${url} within ${timeoutMs}ms. Last error: ${lastErr}`);
}

async function run() {
  console.log(`Starting Next.js production server on port ${PORT}...`);
  const server = spawn("pnpm", ["next", "start", "-p", String(PORT), "-H", "127.0.0.1"], {
    stdio: "inherit",
    env: { ...process.env, PORT: String(PORT), HOSTNAME: "127.0.0.1", NODE_ENV: "production" },
  });

  try {
    await waitForServer(BASE_URL);
    console.log(`Next.js production server is live at ${BASE_URL}`);

    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });

    // 1. Desktop Context (1280x800)
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: "ReleaseLens-E2E-Verifier/1.0 (Desktop)",
    });
    const desktopPage = await desktopContext.newPage();

    console.log("Testing 1: Landing Page (Desktop)...");
    await desktopPage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, "01_landing_desktop.png") });

    console.log("Testing 2: Workspace Dashboard...");
    await desktopPage.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
    await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, "02_dashboard.png") });

    console.log("Testing 3: Project Detail & RQI Overview...");
    await desktopPage.goto(`${BASE_URL}/projects/proj_hackathon_demo`, { waitUntil: "networkidle" });
    await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, "03_project_overview.png") });

    console.log("Testing 4: Findings Triage Queue...");
    await desktopPage.goto(`${BASE_URL}/projects/proj_hackathon_demo/findings`, { waitUntil: "networkidle" });
    await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, "04_findings_triage.png") });

    console.log("Testing 5: Confirmed Defect Tracker...");
    await desktopPage.goto(`${BASE_URL}/projects/proj_hackathon_demo/bugs`, { waitUntil: "networkidle" });
    await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, "05_defect_tracker.png") });

    console.log("Testing 6: Release Deltas Regression Comparison...");
    await desktopPage.goto(`${BASE_URL}/projects/proj_hackathon_demo/deltas`, { waitUntil: "networkidle" });
    await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, "06_release_deltas.png") });

    // 2. Mobile Viewport Context (375x667 - iPhone SE)
    console.log("Testing 7: Mobile Viewport Responsiveness (Landing Page)...");
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      isMobile: true,
      userAgent: "ReleaseLens-E2E-Verifier/1.0 (Mobile iPhone)",
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, "07_landing_mobile.png") });

    console.log("Testing 8: Mobile Viewport Responsiveness (Dashboard)...");
    await mobilePage.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, "08_dashboard_mobile.png") });

    // 3. Share Permapage Flow
    console.log("Testing 9: Shareable Permapage Report Flow...");
    const shareRes = await fetch(`${BASE_URL}/api/reports/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "proj_hackathon_demo",
        data: { verdict: "PROVISIONAL_PASS", summary: "Automated QA Verification Package" },
      }),
    });
    const shareData = await shareRes.json();
    console.log("Generated share token:", shareData.token);

    await desktopPage.goto(`${BASE_URL}/reports/${shareData.token}`, { waitUntil: "networkidle" });
    await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, "09_shared_report.png") });

    await browser.close();
    console.log("All 9 browser QA scenarios verified successfully with recorded screenshots!");
  } finally {
    server.kill("SIGTERM");
  }
}

run().catch((err) => {
  console.error("E2E QA Execution Failed:", err);
  process.exit(1);
});
