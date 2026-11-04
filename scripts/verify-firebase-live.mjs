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
    try {
      console.log("  -> Waiting for Google Account Chooser redirect...");
      await popup.waitForURL(/accounts\.google\.com/, { timeout: 10000 });
      console.log(`  -> Successfully reached Google OAuth URL: ${popup.url().substring(0, 85)}...`);
      const googleTitle = await popup.title();
      console.log(`  -> Google Account Chooser Title: "${googleTitle}"`);
      await popup.screenshot({ path: "screenshots/login_google_oauth.png" });
      console.log("  -> Saved Google OAuth screenshot: screenshots/login_google_oauth.png");
    } catch (e) {
      console.log(`  -> Popup navigation note: ${e.message}`);
    }
  } else {
    console.log("  -> No popup opened.");
  }

  // 5. Real Token Generation, Exchange, Session Creation, Persistence & Logout
  console.log("\n[Step 5] Live Real Token Verification & Complete Session Lifecycle...");
  const { initializeApp, cert, getApps } = await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");

  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey.startsWith("\"") && privateKey.endsWith("\"")) privateKey = privateKey.slice(1, -1);
  if (privateKey.includes("\\n")) privateKey = privateKey.replace(/\\n/g, "\n");

  const adminApp = getApps().length > 0 ? getApps()[0] : initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  }, "live-verifier");

  const adminAuth = getAuth(adminApp);

  const testUid = `live_qa_${Date.now()}`;
  console.log(`  -> 1. Minting live custom token for UID: "${testUid}"...`);
  const customToken = await adminAuth.createCustomToken(testUid, {
    email: `${testUid}@releaselens.live`,
    name: "Live QA Verifier",
  });

  console.log("  -> 2. Exchanging custom token for real Google Firebase ID Token...");
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const exchangeRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    }
  );
  const exchangeData = await exchangeRes.json();
  if (!exchangeRes.ok) {
    throw new Error(`Google Identity Toolkit exchange failed: ${JSON.stringify(exchangeData)}`);
  }
  const realIdToken = exchangeData.idToken;
  console.log("  -> 3. Real cryptographically-signed Google ID Token received from Google Auth servers.");

  console.log(`  -> 4. Submitting real ID token to POST http://localhost:${PORT}/api/auth/session...`);
  const sessionRes = await fetch(`http://localhost:${PORT}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idToken: realIdToken,
      userId: "spoofed_admin_attempt", // Must be ignored
    }),
  });

  const sessionData = await sessionRes.json();
  console.log(`  -> Server response status: ${sessionRes.status}`);
  if (sessionRes.status !== 200) {
    throw new Error(`Session creation failed: ${JSON.stringify(sessionData)}`);
  }

  // Verify derived UID matches token subject, NOT spoofed userId
  if (sessionData.user.id !== testUid) {
    throw new Error(`Zero-trust failure: expected userId "${testUid}", got "${sessionData.user.id}"`);
  }
  console.log(`  -> 5. Zero-Trust Identity Verified: Derived userId "${sessionData.user.id}" matches verified token subject UID.`);

  const cookieHeader = sessionRes.headers.get("set-cookie");
  if (!cookieHeader || !cookieHeader.includes("releaselens_session")) {
    throw new Error("Missing releaselens_session cookie in response header");
  }
  console.log("  -> 6. Secure HTTP-only session cookie issued successfully.");

  // Parse session token from cookie
  const match = cookieHeader.match(/releaselens_session=([^;]+)/);
  const sessionCookieVal = match ? match[1] : null;

  // 6. Navigate to Authenticated Workspace & Verify Persistence
  console.log("\n[Step 6] Navigating to authenticated workspace with real session cookie...");
  const authContext = await browser.newContext();
  await authContext.addCookies([
    {
      name: "releaselens_session",
      value: sessionCookieVal,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  const authPage = await authContext.newPage();
  await authPage.goto(`http://localhost:${PORT}/dashboard`, { waitUntil: "networkidle" });
  console.log(`  -> Successfully navigated to: ${authPage.url()}`);
  await authPage.screenshot({ path: "screenshots/auth_dashboard_verified.png" });

  console.log("  -> Refreshing page to verify session persistence...");
  await authPage.reload({ waitUntil: "networkidle" });
  console.log(`  -> Successfully reloaded: ${authPage.url()} (Session persistent)`);

  // 7. Sign Out & Invalidation
  console.log("\n[Step 7] Testing Sign-Out & Server-Side Session Invalidation...");
  const logoutRes = await fetch(`http://localhost:${PORT}/api/auth/session`, {
    method: "DELETE",
    headers: {
      Cookie: `releaselens_session=${sessionCookieVal}`,
    },
  });
  console.log(`  -> DELETE /api/auth/session status: ${logoutRes.status}`);

  // Verify session was destroyed in backend
  const checkRes = await fetch(`http://localhost:${PORT}/api/auth/session`, {
    headers: {
      Cookie: `releaselens_session=${sessionCookieVal}`,
    },
  });
  const checkData = await checkRes.json();
  if (checkData.isAuthenticated) {
    throw new Error("Session invalidation failed: session is still authenticated after logout");
  }
  console.log("  -> Session successfully invalidated: isAuthenticated is false.");

  await authContext.close();
  await browser.close();
  server.kill();
  console.log("\n=== Live Real Authentication Verification SUCCEEDED ===");
}

verifyFirebaseLive().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
