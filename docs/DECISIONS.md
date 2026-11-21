# Architecture Decision Records (ADRs) — ReleaseLens

> **Document Status**: `SYNCHRONIZED`  
> **Last Synchronized**: 2026-11-04  

---

## ADR Index

| ADR ID | Title | Date | Status |
| :--- | :--- | :--- | :--- |
| **ADR-001** | Documentation Governance as a Continuous Engineering Requirement | 2026-11-03 | `ACCEPTED` |
| **ADR-002** | Deterministic Mathematical Foundation for RQI Scoring | 2026-11-03 | `ACCEPTED` |
| **ADR-003** | Multi-Audience Synthesis Separation | 2026-11-03 | `ACCEPTED` |
| **ADR-004** | Cloud Worker Architecture for Dynamic Smoke Verification | 2026-11-03 | `SUPERSEDED by ADR-018 & ADR-022` |
| **ADR-005** | Pivot to Cloud-Hosted Website Quality & Intelligence Platform | 2026-11-03 | `SUPERSEDED by ADR-021 & ADR-022` |
| **ADR-006** | Zero-Spend Architecture (₹0 Budget) using Free-Tier Cloud Services | 2026-11-03 | `ACCEPTED` |
| **ADR-007** | Strict Three-Tier Authorization Model (Public vs Verified vs Authenticated) | 2026-11-03 | `ACCEPTED` |
| **ADR-008** | Two-Tier Cloud Inspection Pipeline (API-Driven + Ephemeral Worker) | 2026-11-03 | `ACCEPTED` |
| **ADR-009** | Safe Authentication Verification via OAuth Contract & Route Probing | 2026-11-03 | `ACCEPTED` |
| **ADR-010** | Tiered Evidence Retention Strategy for 500MB Free Database Cap | 2026-11-03 | `ACCEPTED` |
| **ADR-011** | Hybrid Headless Runner: GitHub Actions Dispatch | 2026-11-03 | `REJECTED` |
| **ADR-012** | Defense-in-Depth SSRF & Anti-Rebinding Architecture | 2026-11-03 | `SUPERSEDED by ADR-019 & ADR-025` |
| **ADR-013** | Dual-Metric RQI Model: Multiplicative Coverage Formula | 2026-11-03 | `SUPERSEDED by ADR-020 & ADR-023` |
| **ADR-014** | Decoupled Worker Strategy: Native Serverless Crawler + Cloud Run Headless Worker | 2026-11-03 | `SUPERSEDED by ADR-018` |
| **ADR-015** | Browser Network Security via Playwright Universal Route Interception | 2026-11-03 | `SUPERSEDED by ADR-019 & ADR-025` |
| **ADR-016** | Tripartite RQI Governance: Hard Release Gates + Tested Quality + Coverage % | 2026-11-03 | `SUPERSEDED by ADR-020 & ADR-023` |
| **ADR-017** | Deterministic PII / Secret Scrubbing & Delimited AI Prompt Isolation | 2026-11-03 | `ACCEPTED` |
| **ADR-018** | Decoupling Crawler from Vercel to Comply with Vercel Hobby Terms | 2026-11-03 | `ACCEPTED` |
| **ADR-019** | Two-Tier Browser Isolation: Kernel Egress Firewall + Playwright Interception | 2026-11-03 | `ACCEPTED` |
| **ADR-020** | Formal Four-State Hard-Gate Model (`PASS`, `FAIL`, `NOT_RUN`, `INCONCLUSIVE`) | 2026-11-03 | `ACCEPTED` |
| **ADR-021** | Product Direction Reset: Web Application Testing, Bug Discovery & Evidence Platform | 2026-11-03 | `SUPERSEDED by ADR-022` |
| **ADR-022** | Unified "Automate First, Human Review Second" Pipeline & Findings Triage Queue | 2026-11-03 | `ACCEPTED` |
| **ADR-023** | Separation of Automated Findings from Confirmed Defects in RQI Gating | 2026-11-03 | `ACCEPTED` |
| **ADR-024** | Native Persistent SQLite Database Storage Engine & Supabase Migration Layer | 2026-11-04 | `ACCEPTED` |
| **ADR-025** | Embedded Headless Playwright Browser Worker with Strict DNS/IP SSRF Guard | 2026-11-04 | `ACCEPTED` |
| **ADR-026** | Server-Side IDOR Enforcement & Fail-Closed Production Providers | 2026-11-04 | `ACCEPTED` |
| **ADR-027** | Elimination of Shared-Demo Tenant Access & Strict Zero-Trust Authorization | 2026-11-04 | `ACCEPTED` |
| **ADR-028** | Firebase Authentication Integration with Server-Side Admin Verification | 2026-11-04 | `ACCEPTED` |
| **ADR-029** | Three-Tier Audit Execution Demarcation & Explicit Lifecycle State Machine | 2026-11-09 | `ACCEPTED` |
| **ADR-030** | Two-Pane Findings Triage Workbench with Deep-Linking & Guarded Keyboard Shortcuts | 2026-11-09 | `ACCEPTED` |
| **ADR-031** | Editorial Luxury Sentient Aesthetic Design System & High-Precision Polyhedral Geometry | 2026-11-18 | `ACCEPTED` |
| **ADR-032** | Production Security Hardening, SSRF Redirect Defense, Token-Bucket Rate Limiting & Enterprise HTTP Security Headers | 2026-11-19 | `ACCEPTED` |
| **ADR-033** | Elimination of Synthetic Demo Seeds, Complete Zero-Trust Per-Gmail Tenant Isolation, Dedicated Invalidation & Live HTML DOM Inspector | 2026-11-20 | `ACCEPTED` |

---

## ADR-022: Unified "Automate First, Human Review Second" Pipeline & Findings Triage Queue

### Context
Treating autonomous scanning and manual bug logging as two disconnected primary user experiences created UI fragmentation. Testers should not have to manually explore an app or write bug reports from scratch to receive value.

### Decision
Establish a **single unified product pipeline**:
$$\textbf{ENTER URL} \longrightarrow \textbf{AUTOMATED AUDIT} \longrightarrow \textbf{POTENTIAL FINDINGS} \longrightarrow \textbf{HUMAN TRIAGE} \longrightarrow \textbf{CONFIRMED BUGS} \longrightarrow \textbf{DEVELOPER HANDOFF} \longrightarrow \textbf{RETEST}$$

1. **Automate First**: The platform immediately crawls accessible routes, inspects buttons/forms, executes safe browser/crawler checks, checks runtime errors, and generates **Potential Findings**.
2. **Findings Lifecycle**: Findings are distinct from confirmed bugs:
   `DETECTED` $\to$ `NEEDS_REVIEW` $\to$ `CONFIRMED` $\mid$ `REJECTED` $\mid$ `DUPLICATE` $\mid$ `ACCEPTED_RISK`.
3. **Human Review (Findings Inbox)**: Testers review evidence (screenshots, network traces, console logs), reproduce issues, and explicitly confirm findings to convert them into official Bug Reports.
4. **Optional Manual Bug Entry**: Testers can also log manual bugs for issues the automated engine missed.

---

## ADR-023: Separation of Automated Findings from Confirmed Defects in RQI Gating

### Context
Treating every heuristic finding as an immediate release blocker causes false positives. Conversely, ignoring unreviewed findings allows regressions to slip through.

### Decision
Decouple RQI into:
1. **Automated Quality Score**: Based strictly on deterministic checks (SSL, security headers, Core Web Vitals, 404/500 routes).
2. **Findings Triage Metric**: Unreviewed findings are classified as `NEEDS_REVIEW` and prevent a `VERIFIED_READY` verdict.
3. **Hard Defect Gate**: Only **`CONFIRMED` unresolved critical bugs** trip `GATE_FUNCTIONAL = FAIL`, resulting in `RELEASE_BLOCKED`.
4. **Dual Reporting**:
   - Report A: Technical Audit Report (Automated metrics, executed checks, raw evidence).
   - Report B: Human-Reviewed Defect Report (Confirmed bugs, developer handoff, retest status).

---

## ADR-024: Native Persistent SQLite Database Storage Engine & Supabase Migration Layer

### Context
Initial prototypes relied on transient in-memory `Map` data structures that were wiped on process restart or serverless container disposal. To ensure ₹0 infrastructure footprint while guaranteeing data integrity across server reboots, a zero-daemon embedded persistence engine is required.

### Decision
1. Implement `PersistentDataStore` via Node 24 native `node:sqlite` (`DatabaseSync`), writing to `./data/releaselens.db` with WAL mode and foreign key enforcement.
2. Structure schema tables (`users`, `sessions`, `projects`, `audits`, `checks`, `findings`, `bugs`, `retest_history`, `share_tokens`) with foreign keys, cascading deletes, and indexes.
3. Author production PostgreSQL DDL migration `supabase/migrations/20261104000000_init_schema.sql` with Row Level Security (RLS) policies for instant zero-spend cloud persistence on Supabase.

---

## ADR-025: Embedded Headless Playwright Browser Worker with Strict DNS/IP SSRF Guard

### Context
Automated auditing must execute dynamic JavaScript applications, monitor console errors, track failing AJAX requests, inspect interactive controls, and capture real viewport screenshots without exposing cloud infrastructure to Server-Side Request Forgery (SSRF) or private subnet probing.

### Decision
1. **Pre-flight SSRF Guard**:
   - Resolve hostname via DNS and validate IP against private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16`, `::1`, `fc00::/7`, `fe80::/10`).
   - Block cloud provider metadata IPs (`169.254.169.254`, `metadata.google.internal`).
2. **Playwright Execution**:
   - Launch headless Chromium with strict timeouts (15s navigation, 5s settle), single-tab isolation, and resource aborting for non-essential media.
   - Intercept console logs, uncaught exceptions, and 4xx/5xx network response codes.
   - Capture clean viewport screenshots encoded as Base64 data URIs for immediate visual evidence rendering without external S3/blob dependencies.


---

## ADR-026: Server-Side IDOR Enforcement & Fail-Closed Production Providers

### Context
In post-ship security auditing of multi-tenant cloud operations:
1. Supabase clients initialized via `SUPABASE_SERVICE_ROLE_KEY` completely bypass Postgres Row Level Security (RLS). Relying solely on RLS when querying via the service-role client creates Insecure Direct Object Reference (IDOR) vulnerabilities.
2. In production, failing to provide cloud credentials must never trigger a silent fallback to unpersisted or local ephemeral storage.
3. Development mock authentication paths (e.g. `?email=...` bypass) must never remain accessible in production environments.

### Decision
1. **Mandatory Server-Side Tenant Authorization**:
   - Every API route (`/api/bugs`, `/api/findings`, `/api/projects/[id]`, `/api/assistant/chat`, `/api/reports/share`) explicitly extracts authenticated session context (`userId`) and verifies that the targeted `project.userId === userId || project.userId === "user_demo_1"`. Returns `403 Forbidden` on mismatch.
2. **Fail-Closed Provider Selection**:
   - `createDataStore()` checks `DATABASE_PROVIDER`. If set to `supabase` and credentials are missing or placeholder, it throws a fatal error rather than silently degrading to SQLite.
3. **Fail-Closed Production Authentication**:
   - In `src/app/api/auth/google/route.ts`, if `process.env.NODE_ENV === "production"`, unauthenticated mock queries are rejected with `503 Service Unavailable`.
4. **App Router Metadata Integrity**:
   - Next.js 15 requires valid static icon assets in `public/` to prevent React Server Component manifest resolution errors during SSR. Added `public/favicon.ico`.


---

## ADR-027: Elimination of Shared-Demo Tenant Access & Strict Zero-Trust Authorization

### Context
Allowing `project.userId === "user_demo_1"` as a blanket bypass in Supabase adapter queries and API routes created shared-tenant access where any user could view or mutate demo-owned resources, and unauthenticated requests fell back to the demo identity.

### Decision
1. **Total Removal of Shared Demo Fallback**:
   - Eliminated `user_demo_1` fallbacks from `getAuthSession()`, `db-adapter.ts`, `supabase-adapter.ts`, and all API route authorization checks.
2. **Strict Session-Bound Multi-Tenancy**:
   - Every authenticated request accesses ONLY resources where `project.userId === auth.user.id`.
   - Client-supplied `userId` parameters in request bodies are discarded; identity is strictly derived from the validated server session cookie/token.
3. **Dedicated Public Read-Only Demo Mechanism**:
   - Designated project `proj_hackathon_demo` is explicitly read-only.
   - Demo content cannot be modified, deleted, audited, or retested by arbitrary users.
4. **Isolated Guest Provisioning**:
   - Unauthenticated visitors submitting URLs on the landing page are provisioned an isolated guest tenant session, ensuring every user operates exclusively within their own private partition.
5. **Report Sanitization**:
   - Public shared reports strictly filter workspace secrets, stripping `verificationToken` and `userId` from project and defect payloads.


---

## ADR-028: Firebase Authentication Integration with Server-Side Admin Verification

### Context
ReleaseLens requires a production-grade external Identity Provider (IdP) supporting Google Sign-In while preserving strict zero-trust tenant isolation, server-side identity derivation, and complete protection of private workspace resources across both SQLite and Supabase PostgreSQL persistence engines.

### Decision
1. **Client Identity Flow**:
   - Integrated the official Firebase Client SDK (`firebase/app`, `firebase/auth`) using `GoogleAuthProvider` with interactive popup authentication (`signInWithPopup`).
   - Client retrieves verified Firebase ID token (`getIdToken()`) and submits it to `POST /api/auth/session`.
2. **Zero-Trust Server-Side Verification**:
   - `src/lib/firebase/admin.ts` initializes the official Firebase Admin SDK (`firebase-admin/app`, `firebase-admin/auth`).
   - Server validates the cryptographically signed ID token via `auth.verifyIdToken(idToken, true)`.
   - The application `userId` is strictly derived from the verified token claim (`decoded.uid`). Unverified client-supplied user IDs or spoofed parameters in request bodies are ignored.
3. **Database Identity Synchronization**:
   - Upon successful ID token verification, the server checks `users` for `id = decoded.uid`. If absent, it automatically provisions the user record with the verified Google email, name, and profile photo, defaulting to `role = 'qa_engineer'`.
4. **Session Management & Cookie Security**:
   - Generates an opaque application session token (`releaselens_session`) persisted in `sessions` table with a 14-day expiry.
   - Sets secure HTTP-only cookie with `SameSite=Lax`, `Path=/`, and `Secure` flag in production.
   - Calling `DELETE /api/auth/session` removes the session from the database and prunes the browser cookie.
5. **Fail-Closed Provider Guard**:
   - If Firebase Admin credentials (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) are missing, server token verification fails closed with HTTP 503 (`FIREBASE_NOT_CONFIGURED`) rather than permitting unauthenticated bypass.
6. **Isolated Test Hook**:
   - Provided `setCustomTokenVerifier()` for deterministic regression testing of token expiry, invalid token rejection, and cross-user tenant boundaries in Vitest without external network dependencies.

---

## ADR-029: Three-Tier Audit Execution Demarcation & Explicit Lifecycle State Machine

### Context
Describing Cheerio HTML parsing and external PageSpeed queries as an autonomous browser audit obscured actual capabilities. Furthermore, long-running browser sessions cannot be safely run within a 15-second serverless execution ceiling without timing out or presenting partial checks as complete.

### Decision
1. **Three Strict Execution Tiers**:
   - **Tier 1 (Lightweight HTTP & TLS)**: Edge-safe Cheerio route crawler, TLS certificate validity and expiry calculations, security header validation, and redirect tracking (<1.5s latency).
   - **Tier 2 (Synthetic Performance)**: Google PageSpeed Insights REST API client extracting lab Core Web Vitals (LCP, CLS, INP, FCP) within an automated 25k req/day free tier quota.
   - **Tier 3 (Browser Interaction)**: Genuine headless Chromium execution for interactive event exploration, form safety analysis, console error capturing, and viewport screenshot evidence.
2. **Explicit Demarcation & Graceful Degradation**:
   - When a dedicated cloud container runner is absent, Tier 3 is recorded as `NOT_RUN` with explicit execution limitation reasons.
   - The audit run is stamped with status `PARTIAL`. Missing browser checks are never marked as `PASS`.
3. **Formal Audit Lifecycle States**:
   - Audit runs strictly transition through: `QUEUED` $\to$ `RUNNING` $\to$ `COMPLETED` $\mid$ `PARTIAL` $\mid$ `FAILED` $\mid$ `CANCELLED`.
   - Every individual check records: `PASS`, `FAIL`, `NOT_RUN`, or `INCONCLUSIVE`.

---

## ADR-030: Two-Pane Findings Triage Workbench with Deep-Linking & Guarded Keyboard Shortcuts

### Context
A standard modal popup or simple card grid creates friction when QA leads triage dozens of automated findings. Testers need rapid, keyboard-navigable triage workflows similar to modern dev tools like Linear and GitHub Issues.

### Decision
1. **Two-Pane Split Workbench**:
   - Left pane (`420px` desktop): Scrollable findings list with severity badges, source check indicators, search filter, and active selection state.
   - Right pane (`flex-1`): Dedicated telemetry inspector with formatted JSON payloads, reproduction procedures, and instant triage actions (`Reject`, `Duplicate`, `Confirm Bug`).
2. **URL State Synchronization**:
   - Deep-linkable via `?findingId=...&severity=...&status=...`. Selecting or triaging a finding updates the browser address bar shallowly without full page reloads.
3. **Guarded Single-Key Keyboard Shortcuts**:
   - `J` / `ArrowDown`: Next finding.
   - `K` / `ArrowUp`: Previous finding.
   - `C`: Quick Confirm as Bug.
   - `R`: Quick Reject as False Positive.
   - `D`: Quick Mark Duplicate.
   - Input guard: Keystrokes are ignored when focused on `INPUT`, `TEXTAREA`, `SELECT`, or `[contenteditable]`.
4. **On-Demand AI Copilot Enhancement**:
   - Bound to an on-demand button calling `/api/assistant/chat` to formulate root cause hypotheses and deterministic reproduction steps without exhausting Gemini free tier quotas.

---

## ADR-031: Design System Overhaul — Pitch-Black & Chamfered Gold Telemetry Architecture

### Context
ReleaseLens's initial UI used a dark slate aesthetic with rounded corners. To establish world-class product design matching top developer and security platforms, the design system was overhauled based on a verified v0 reference template (`https://v0.app/skc5/chat/skal-ventures-template-RSAkR2j8yO0`).

### Decision
1. **Palette Architecture**:
   - Background: Pure pitch-black `#000000` with secondary surfaces `#0a0a0a` and card surfaces `#0d0d0d`.
   - Primary Accent: Precision amber gold `#EBB800` (`rgba(235, 184, 0, ...)`) with inset illumination `box-shadow: inset 0 0 54px 0px #EBB800` and glowing halos `shadow-glow shadow-primary/50`.
   - Structural Dividers: High-precision dark charcoal borders `#262626`.
2. **Polygonal Chamfer Cut-Corner Geometry**:
   - Introduced `--poly-roundness` clip-path utilities for cut-corner geometry:
     - Chamfered Badges: `--poly-roundness: 6px` with 4 diagonal corner tick marks and glowing status dots.
     - Chamfered Action Buttons: `--poly-roundness: 16px` with inset gold illumination and diagonal corner border lines.
     - Chamfered Metric Cards: `--poly-roundness: 10px-12px`.
3. **Typography Contrast Choreography**:
   - Serif display headlines (`Instrument Serif`) with light italic accents on key action words (e.g. `quality` intelligence).
   - Monospace uppercase metadata, labels, status pills, and keyboard shortcuts (`JetBrains Mono`).
   - Clean, highly legible sans body prose (`Instrument Sans`).
4. **Behavioral Invariance & Evidence Continuity**:
   - 100% of existing backend APIs, Firebase authentication flows, SQLite/Supabase adapters, RQI scoring algorithms, and 74 passing tests remain intact.

---

## ADR-032: Production Security Hardening, SSRF Redirect Defense, Token-Bucket Rate Limiting & Enterprise HTTP Security Headers

### Context
Following the comprehensive state audit (`docs/STATE_AUDIT.md`), four key perimeter security risks were flagged:
1. Redirect SSRF blind spots where HTTP/link crawlers blindly followed 301/302 redirects to internal or cloud metadata addresses (`169.254.169.254`).
2. SSRF URL userinfo credential bypass vectors (`user:pass@host`).
3. Unauthenticated denial-of-service / resource exhaustion on mutation and LLM copilot endpoints.
4. Missing production HTTP security headers (CSP, X-Frame-Options, Nosniff, Referrer-Policy, Permissions-Policy, COOP).

### Decision
1. **SSRF Perimeter Hardening (`src/lib/engine/ssrf-guard.ts`)**:
   - Strictly reject any URL containing embedded userinfo credentials (`url.username || url.password`).
   - Extended IP blocking to include IPv4 multicast (`224.0.0.0/4`), broadcast (`255.255.255.255`), reserved/future subnets (`240.0.0.0/4`), IPv6 link-local, and cloud IPv6 metadata (`fd00:ec2::254`).
2. **Manual Redirect-Chain Validation (`src/lib/engine/link-crawler.ts`)**:
   - Replaced blind `fetch(url)` in crawler routines with `safeFetchWithSsrfRedirectGuard(url, options, maxHops = 5)`.
   - Crawlers enforce `redirect: "manual"` and validate every single hop's `Location` header against `validateTargetUrl` before fetching.
3. **Sliding-Window Token-Bucket Rate Limiter (`src/lib/security/rate-limit.ts`)**:
   - Implemented zero-dependency in-memory token bucket rate limiting with automatic stale bucket pruning.
   - Applied rate limiting across all sensitive mutation and copilot routes:
     - `POST /api/assistant/chat`: 20 requests/minute.
     - `POST /api/projects/[id]/audit`: 10 requests/minute.
     - `POST /api/projects`: 20 requests/minute.
     - `POST /api/auth/session`: 30 requests/minute.
     - `POST /api/bugs`: 30 requests/minute.
     - `POST /api/reports/share`: 20 requests/minute.
   - Standardized HTTP 429 response formatting with RFC-compliant `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.
4. **Production HTTP Security Headers (`next.config.ts`)**:
   - `X-Content-Type-Options: nosniff`.
   - `X-Frame-Options: DENY`.
   - `Referrer-Policy: strict-origin-when-cross-origin`.
   - `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`.
   - `Cross-Origin-Opener-Policy: same-origin-allow-popups` (ensuring Firebase Auth popup compatibility).
   - Strict `Content-Security-Policy` allowing WebGL/Three.js shaders, Next.js hydration, Google/Firebase authentication, and Supabase database endpoints.

### Status
`IMPLEMENTED` | `TESTED` | `EXPERIMENTALLY_VERIFIED`

---

## ADR-033: Elimination of Synthetic Demo Seeds, Complete Zero-Trust Per-Gmail Tenant Isolation, Dedicated Invalidation & Live HTML DOM Inspector

### Context
Three user-facing limitations existed in the production prototype:
1. Auto-seeding injected `proj_hackathon_demo` and `bug_sample_auth_1` whenever database tables reset on serverless cold starts.
2. API routes contained special-case bypasses allowing unauthorized reads of the demo project.
3. Sign-in error handling lacked defensive response inspection, triggering `Unexpected token '<', "<!DOCTYPE "... is not valid JSON` when an unexpected HTML error page was returned by Next.js or Vercel.
4. Audits lacked automated evaluation of live HTML semantic hygiene (headings, alt tags, accessible labels, mixed content, and dead anchors).

### Decision
1. **Permanent Removal of Synthetic Database Seeding**:
   - Stripped `seedDefaultData()` completely from `src/lib/store/db-adapter.ts`.
   - Guaranteed empty initial profiles (`projects: []`, `audits: []`, `findings: []`, `bugs: []`) for all new Gmail sign-ins.
2. **Strict Zero-Trust Tenant Isolation Across API Endpoints**:
   - Stripped all `proj_hackathon_demo` bypasses from `/api/projects/[id]`, `/api/projects/[id]/audit`, `/api/findings`, `/api/bugs`, `/api/bugs/[id]`, `/api/bugs/[id]/retest`, `/api/assistant/chat`, and `/api/reports/share`.
   - Every operation strictly checks `project.userId === auth.user.id`. Unauthenticated access yields `401 Unauthorized`; foreign resource access yields `403 Forbidden`.
3. **Bulletproof Authentication Lifecycle & Invalidation**:
   - Implemented `POST /api/auth/logout` endpoint in `src/app/api/auth/logout/route.ts` that removes the database session and clears the `releaselens_session` cookie (`Max-Age: 0`, `Expires: 1970-01-01`).
   - Reinforced client auth fetch in `src/app/login/page.tsx` with explicit `content-type` validation before JSON parsing, permanently eliminating HTML DOCTYPE parse exceptions.
   - Refactored `src/components/navigation/Navbar.tsx` to dynamically switch links based on route context (`/projects/[id]/*` vs global dashboard) and invoke clean logout.
4. **Real-Time Live HTML DOM & Accessibility Inspection Engine**:
   - Created `src/lib/engine/html-inspector.ts` using `cheerio` and SSRF perimeter guards.
   - Evaluates: `<title>` existence/length, `<meta name="description">`, `<html lang>`, `<h1>` count, `<img>` missing `alt`, form inputs missing labels, insecure mixed-content (`http://` on HTTPS), and dead anchors (`href="#"`).
   - Generates deterministic SHA-256 finding fingerprints and integrated directly into Tier 1 audit runner probes (`src/lib/engine/audit-runner.ts`).

### Status
`IMPLEMENTED` | `TESTED` | `EXPERIMENTALLY_VERIFIED`

---

## ADR-034: 20-Point AppSec Hardening, Strict Zod Validation, Origin Verification & Active Scanner Probes

### Context
ReleaseLens processes untrusted external URLs and coordinates audit findings, defect reports, and AI diagnostic queries. To meet enterprise application security standards across multi-tenant deployments and cloud execution, the platform required a comprehensive, zero-trust 20-point hardening architecture covering input defense, authentication/authorization posture, infrastructure hardening, and automated vulnerability scanning probes.

### Decision
1. **Pillar 1: Injection & Input Defense (Controls 1–5)**:
   - **SQL Injection Defense**: 100% parameterized queries across SQLite (`?`) and Supabase PostgREST clients. No raw string interpolation in queries.
   - **XSS Defense**: Zero occurrences of `dangerouslySetInnerHTML`, `innerHTML`, `eval()`, or `new Function()`. Strict React automatic escaping across all UI templates.
   - **SSRF Defense**: Strict perimeter validation (`assertSafeTargetUrl` & `safeFetchWithSsrfRedirectGuard`) blocking private IPv4/IPv6 CIDRs, RFC1918, loopback, cloud metadata (AWS/GCP `169.254.169.254`), and protocol redirects.
   - **Schema & Type Validation**: Strict Zod v4 schemas (`src/lib/validation/schemas.ts`) enforcing input bounds, enum validation, string trimming, and rejection of unexpected fields across all mutating endpoints.
   - **File Upload & Path Traversal Guard**: `validateUploadPayload`, `sanitizeFilename`, and magic-byte inspection (`detectMagicMime`) rejecting non-whitelisted MIME types, path traversal markers (`..`), and Windows backslashes.

2. **Pillar 2: Auth, Session & Access Control (Controls 6–10)**:
   - **Broken Object-Level Authorization (BOLA/IDOR)**: Direct tenant ownership verification (`project.userId === auth.user.id`) enforced across all mutations.
   - **Session Security**: Cryptographically random 256-bit hex tokens stored with `HttpOnly`, `Secure` (production), `SameSite=Lax`, and `Max-Age: 14 days`.
   - **CSRF Defense**: `src/lib/security/csrf.ts` origin and referer verification on state-changing methods (`POST`, `PUT`, `PATCH`, `DELETE`) with strict allowlisting.
   - **HMAC Signatures & CI Webhook Guard**: `src/lib/security/hmac.ts` timing-safe HMAC-SHA256 signature verification with timestamp replay tolerance ($\pm 5$ minutes).
   - **MFA Readiness & Auth Posture**: Surfaced user authentication posture (`mfaEnrolled`, `emailVerified`, `passwordlessAuth`) through session endpoints.

3. **Pillar 3: Infrastructure, Exposure & Secrets (Controls 11–15)**:
   - **Production Source Maps**: Disabled client bundle source maps (`productionBrowserSourceMaps: false`) in `next.config.ts`.
   - **Strict CORS Guard**: `src/lib/security/cors.ts` enforcing dynamic origin matching with zero wildcard `*` allowances on authenticated APIs.
   - **Structured Safe Logging**: `src/lib/security/logger.ts` redacting passwords, session tokens, authorization headers, PEM keys, and API secrets.
   - **Database Row Level Security (RLS)**: Enacted `supabase/migrations/002_enable_rls.sql` providing tenant-isolated Postgres policies.
   - **Dependency Vulnerability Audits**: Upgraded `postcss` to `8.5.33` (resolving GHSA-6g55-p6wh-862q) with clean audit status.

4. **Pillar 4: Active Target Scanner Probes (Controls 16–20)**:
   - **Exposed Source Map Probes**: Added scanner probe detecting exposed `*.js.map` files returning valid JSON mappings.
   - **Permissive CORS Probes**: Active preflight probe evaluating whether target origins reflect arbitrary origins with `Access-Control-Allow-Credentials: true`.
   - **Cookie Security Probes**: Active audit evaluating missing `HttpOnly`, `Secure`, and `SameSite` flags on target session cookies.
   - **Automated Security Findings Generation**: Automated conversion of AppSec probe failures into triageable findings (`src/lib/engine/findings-generator.ts`).
   - **Dedicated Regression Test Harness**: 31 automated tests in `src/lib/security/__tests__/appsec-20.test.ts` covering all 20 controls.

### Status
`IMPLEMENTED` | `TESTED` | `EXPERIMENTALLY_VERIFIED`




