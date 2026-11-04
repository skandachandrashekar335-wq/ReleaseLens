import { chromium } from "playwright";
import { spawn } from "child_process";
import fs from "fs";

async function verifyFirebaseLive() {
  console.log("=== ReleaseLens Firebase Live Authentication Verification ===");

  // 1. Audit Environment Variables
  const requiredVars = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
  ];

  console.log("\n[Step 1] Environment Variable Audit (.env.local):");
  for (const v of requiredVars) {
    const val = process.env[v];
    if (!val) {
      console.log(`  - ${v}: MISSING`);
    } else if (val.includes("placeholder") || val === "undefined") {
      console.log(`  - ${v}: MALFORMED (placeholder)`);
    } else {
      console.log(`  - ${v}: PRESENT`);
    }
  }

  // 2. Launch Server
  const PORT = 3099;
  console.log(`\n[Step 2] Starting Next.js server on port ${PORT}...`);
  const server = spawn("pnpm", ["next", "start", "-p", String(PORT)], {
    stdio: "pipe",
    env: { ...process.env, PORT: String(PORT) },
  });

  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}/login`);
      if (res.ok) {
        console.log(`  -> Server live at http://localhost:${PORT}`);
        break;
      }
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 3. Open Login Page
  console.log(`\n[Step 3] Navigating to http://localhost:${PORT}/login...`);
  await page.goto(`http://localhost:${PORT}/login`, { waitUntil: "networkidle" });

  const title = await page.title();
  console.log(`  -> Page title: "${title}"`);
  const configAlert = await page.$("text=Firebase Configuration Required");
  console.log(`  -> Configuration alert displayed: ${Boolean(configAlert)} (Expected: false)`);

  if (!fs.existsSync("screenshots")) fs.mkdirSync("screenshots", { recursive: true });
  await page.screenshot({ path: "screenshots/login_page_live.png" });
  console.log("  -> Saved screenshot: screenshots/login_page_live.png");

  // 4. Initiate Google Sign-In
  console.log("\n[Step 4] Initiating Google Sign-In interaction...");
  const signInBtn = await page.$("button:has-text('Sign in with Google')");
  if (!signInBtn) {
    throw new Error("Sign in with Google button not found on /login");
  }

  let identityToolkitStatus = null;
  let identityToolkitError = null;

  const popupPromise = page.waitForEvent("popup", { timeout: 8000 }).catch(() => null);
  await signInBtn.click();
  const popup = await popupPromise;

  if (popup) {
    console.log(`  -> Firebase Auth Popup opened: ${popup.url()}`);
    popup.on("response", async (res) => {
      if (res.url().includes("identitytoolkit") || res.url().includes("createAuthUri")) {
        identityToolkitStatus = res.status();
        const body = await res.text().catch(() => "");
        if (identityToolkitStatus >= 400) {
          try {
            const parsed = JSON.parse(body);
            identityToolkitError = parsed.error?.message || body;
          } catch {
            identityToolkitError = body;
          }
        }
      }
    });

    await popup.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => null);
    await popup.screenshot({ path: "screenshots/login_popup.png" });
    console.log("  -> Saved popup screenshot: screenshots/login_popup.png");
  } else {
    console.log("  -> No popup opened.");
  }

  // 5. Report Findings
  console.log("\n[Step 5] Identity Provider Diagnostic Findings:");
  if (identityToolkitStatus === 400 && identityToolkitError?.includes("OPERATION_NOT_ALLOWED")) {
    console.log("  -> Status: Google Sign-In provider is NOT YET ENABLED in Firebase Console.");
    console.log(`  -> Error returned by Google Identity Toolkit: "${identityToolkitError}"`);
  } else if (popup && popup.url().includes("accounts.google.com")) {
    console.log("  -> Status: Google Sign-In provider is ENABLED and redirected to accounts.google.com.");
  } else {
    console.log(`  -> Identity Toolkit Status: ${identityToolkitStatus || "Pending external interaction"}`);
  }

  await browser.close();
  server.kill();
  console.log("\n=== Verification Run Complete ===");
}

verifyFirebaseLive().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
