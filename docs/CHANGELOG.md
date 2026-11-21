# Changelog — ReleaseLens

All notable changes to the ReleaseLens project are documented in this file in adherence to `AGENTS.md` Continuous Documentation Synchronization.

---

## [0.10.0] - 2026-11-21 — 20-Point AppSec Hardening, Strict Zod Validation, Origin Verification & Active Scanner Probes

### Added & Hardened
- **Pillar 1: Injection & Input Defense (Controls 1–5)**:
  - **SQL Injection Defense**: 100% of queries across `src/lib/store/db-adapter.ts` and `src/lib/store/supabase-adapter.ts` verified using parameterized prepared statements (`?` placeholders) and PostgREST client calls. Zero raw string interpolation.
  - **XSS Defense**: Audited codebase confirming 0 occurrences of `dangerouslySetInnerHTML`, `innerHTML`, `eval()`, or `new Function()`.
  - **SSRF Perimeter Defense**: Exported `assertSafeTargetUrl` and `safeFetchWithSsrfRedirectGuard` in `src/lib/engine/ssrf-guard.ts` with hop-by-hop redirect validation, CIDR blocking, and cloud metadata defense.
  - **Zod v4 API Payload Validation (`src/lib/validation/schemas.ts`)**: Built and wired strict runtime schemas for `createProjectSchema`, `updateProjectSchema`, `auditTriggerSchema`, `createBugSchema`, `updateBugSchema`, `retestBugSchema`, `updateFindingSchema`, `shareReportSchema`, `chatMessageSchema`, and `authSessionSchema`.
  - **File Upload & Path Traversal Guard (`src/lib/security/upload-guard.ts`)**: Implemented `validateUploadPayload`, `sanitizeFilename` (stripping directory traversal, Windows backslashes, consecutive dots), and `detectMagicMime` verifying magic bytes for PNG, JPEG, PDF, and JSON.
- **Pillar 2: Auth, Session & Access Control (Controls 6–10)**:
  - **Broken Object-Level Authorization (BOLA/IDOR)**: Enforced strict project owner checks across all mutation endpoints (`/api/projects/[id]`, `/api/projects/[id]/audit`, `/api/findings/[id]`, `/api/bugs/[id]`, `/api/bugs/[id]/retest`, `/api/reports/share`).
  - **Session Security Posture**: Session tokens generate 256 bits of cryptographic entropy (`crypto.randomBytes(32)`), stored in `releaselens_session` cookie (`HttpOnly`, `Secure` in production, `SameSite=Lax`, 14-day expiry).
  - **CSRF & Origin Verification Guard (`src/lib/security/csrf.ts`)**: Enforced `guardCsrf(req)` across all state-changing API routes (`POST`, `PUT`, `PATCH`, `DELETE`), rejecting untrusted foreign origins.
  - **HMAC Signatures & CI Webhook Guard (`src/lib/security/hmac.ts`)**: Implemented timing-safe `crypto.timingSafeEqual` signature verification with replay tolerance ($\pm 5$ min). Added protected webhook trigger endpoint `src/app/api/webhooks/ci/route.ts`.
  - **MFA Readiness & Auth Metadata**: Surfaced user authentication posture (`mfaEnrolled`, `emailVerified`, `passwordlessAuth`) through session endpoints.
- **Pillar 3: Infrastructure, Exposure & Secrets (Controls 11–15)**:
  - **Source Map Exposure Prevention**: Set `productionBrowserSourceMaps: false` in `next.config.ts`.
  - **Strict CORS Guard (`src/lib/security/cors.ts`)**: Dynamic origin verification with zero wildcard `*` permissions on authenticated endpoints.
  - **Structured Safe Logger (`src/lib/security/logger.ts`)**: Automatic redaction of passwords, session cookies, authorization tokens, PEM blocks, and API keys.
  - **Supabase Row Level Security Migration (`supabase/migrations/002_enable_rls.sql`)**: Comprehensive RLS policies enforcing tenant-level data isolation.
  - **Dependency Auditing**: Upgraded `postcss` to `8.5.33` to remediate high-severity vulnerability GHSA-6g55-p6wh-862q; verified clean with `gitleaks` secret detection.
- **Pillar 4: Active Target Scanner Probes (Controls 16–20)**:
  - **Active Source Map Probes**: Added inspection for publicly exposed `.js.map` files returning valid JSON mappings.
  - **Active Permissive CORS Probes**: Probes for reflected untrusted origins with `Access-Control-Allow-Credentials: true`.
  - **Active Cookie Security Probes**: Evaluates target session cookies for missing `HttpOnly`, `Secure`, and `SameSite` flags.
  - **Automated Security Findings Generation (`src/lib/engine/findings-generator.ts`)**: AppSec probe anomalies automatically generate structured findings.
  - **Comprehensive 20-Point Regression Suite (`src/lib/security/__tests__/appsec-20.test.ts`)**: 31 automated tests verifying all 20 controls. All 31 pass. Total repository tests: 115 passing across 18 test files.

---

## [0.9.1] - 2026-11-20 — Synthetic Data Elimination, Dedicated Session Invalidation, HTML DOM Inspector & Strict Tenant Isolation

### Added & Hardened
- **Permanent Removal of Auto-Seeded Synthetic Data (`src/lib/store/db-adapter.ts`)**:
  - Removed `seedDefaultData()` completely. Database cold starts no longer inject `proj_hackathon_demo`, `user_demo_1`, or `bug_sample_auth_1`.
  - All new Gmail user sign-ins receive a guaranteed clean, empty profile (`projects: []`, `runs: []`, `findings: []`).
- **Complete Elimination of Demo Bypasses & Strict Multi-Tenant Enforcement**:
  - Stripped all `proj_hackathon_demo` special-cased read/write exceptions across all API endpoints:
    - `src/app/api/projects/[id]/route.ts`: Enforces `project.userId === auth.user.id`.
    - `src/app/api/projects/[id]/audit/route.ts`: Enforces owner-only audit execution.
    - `src/app/api/findings/route.ts` & `src/app/api/findings/[id]/route.ts`: Owner-only triage.
    - `src/app/api/bugs/route.ts`, `src/app/api/bugs/[id]/route.ts`, `src/app/api/bugs/[id]/retest/route.ts`: Owner-only defect management.
    - `src/app/api/assistant/chat/route.ts`: Strict session and tenant isolation for AI copilot queries.
    - `src/app/api/reports/share/route.ts`: Share token generation restricted to verified project owner.
- **Dedicated Invalidation & Cookie Termination Endpoint (`src/app/api/auth/logout/route.ts`)**:
  - Implemented `POST`, `GET`, and `DELETE` handlers for session invalidation.
  - Destroys active session token in the database and explicitly clears the `releaselens_session` cookie (`Max-Age: 0`, `Expires: 1970-01-01`, `SameSite: Lax`, `HttpOnly`).
  - Updated `Navbar.tsx` to call Firebase `signOutFirebase()` and `/api/auth/logout`, resetting user state and redirecting to `/login`.
- **Defensive Content-Type Guards on Client Sign-In (`src/app/login/page.tsx`)**:
  - Added strict `content-type` checking before parsing server responses.
  - Eliminated `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON` when an unexpected HTML error page is returned by the host.
- **Cheerio-Powered Live HTML DOM & Accessibility Inspection Engine (`src/lib/engine/html-inspector.ts`)**:
  - Built real-time semantic HTML inspector with SSRF perimeter guard.
  - Analyzes document `<title>`, `<meta name="description">`, `<html lang>`, `<h1>` count, images missing `alt` attributes, interactive form inputs missing accessible labels, insecure mixed-content (`http://` on HTTPS), and dead anchors (`href="#"`).
  - Generates deterministic SHA-256 finding fingerprints (`fnd_<sha256>`).
  - Wired into Tier 1 automated probes in `src/lib/engine/audit-runner.ts`.
- **Dynamic Navigation & Onboarding UI**:
  - Refactored `Navbar.tsx` to dynamically render project sub-tabs (`Audit`, `Findings`, `Defects`, `Deltas`) only when viewing a specific project route (`/projects/[id]/*`).
  - Enhanced empty dashboard state with a chamfered onboarding hero card and direct `[REGISTER FIRST APPLICATION]` CTA.
  - Updated `deltas/page.tsx` to dynamically compute deltas between real audit runs via `analyzeReleaseDelta()`.
- **Automated Test Suite Expansion**:
  - Added `tests/html-inspector.test.ts` (DOM inspection, accessibility checks, mixed content detection).
  - Added `tests/auth-lifecycle.test.ts` (logout session destruction & cookie clearance).
  - All 17 test suites and 84 tests passing (`1.8s`).

---

## [0.9.0] - 2026-11-19 — Production Security Hardening, SSRF Redirect Defense, Token-Bucket Rate Limiting & Enterprise HTTP Security Headers

### Added & Hardened
- **SSRF Perimeter Hardening & Userinfo Rejection (`src/lib/engine/ssrf-guard.ts`)**:
  - Added strict rejection of URLs containing embedded userinfo credentials (`url.username || url.password`).
  - Extended CIDR and IP literal blocking to IPv4 multicast (`224.0.0.0/4`), broadcast (`255.255.255.255`), reserved/future blocks (`240.0.0.0/4`), IPv6 link-local, and cloud metadata literals (`169.254.169.254`, `fd00:ec2::254`).
- **Safe Manual Redirect Crawler (`src/lib/engine/link-crawler.ts`)**:
  - Implemented `safeFetchWithSsrfRedirectGuard(url, options, maxHops = 5)`.
  - Replaced blind `fetch(targetUrl)` with manual redirect following (`redirect: "manual"`), validating every single redirect hop through `validateTargetUrl` before fetching.
  - Mitigated the Redirect SSRF Blind Spot (State Audit Risk #2).
- **Zero-Dependency Token-Bucket Rate Limiter (`src/lib/security/rate-limit.ts`)**:
  - Built high-performance sliding-window in-memory token bucket rate limiter with automatic stale bucket memory pruning.
  - Applied strict rate limiting across sensitive endpoints:
    - `POST /api/assistant/chat`: 20 queries/min.
    - `POST /api/projects/[id]/audit`: 10 executions/min.
    - `POST /api/projects`: 20 registrations/min.
    - `POST /api/auth/session`: 30 token exchanges/min.
    - `POST /api/bugs`: 30 bug creations/min.
    - `POST /api/reports/share`: 20 share tokens/min.
  - Standardized RFC-compliant HTTP 429 response formatting with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.
- **Enterprise HTTP Security Headers (`next.config.ts`)**:
  - Enforced `X-Content-Type-Options: nosniff`.
  - Enforced `X-Frame-Options: DENY`.
  - Enforced `Referrer-Policy: strict-origin-when-cross-origin`.
  - Enforced `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`.
  - Enforced `Cross-Origin-Opener-Policy: same-origin-allow-popups` (ensuring Firebase Auth popup compatibility).
  - Enforced comprehensive `Content-Security-Policy` compatible with Next.js, Three.js/WebGL shaders, Google/Firebase Auth, and Supabase database endpoints.
- **Automated Security Test Suite (`tests/security-hardening.test.ts`)**:
  - Added 7 automated tests covering userinfo rejection, multicast/broadcast rejection, IPv6 cloud metadata rejection, redirect-chain SSRF prevention, and rate limiter token exhaustion.
  - All 15 test suites and 81 tests passing (`1.6s`).
- **Full Ego-Browser E2E Audit (`/testmode`)**:
  - Verified 34 automated browser checks across desktop (`1440x900`) and mobile (`390x844`).
  - Verified zero leaked server secrets across client JS chunks (`.next/static/**`).
  - Verified zero uncaught browser console errors across all visited routes.

---

## [0.8.1] - 2026-11-18 — Global Persistent WebGL Ambient Background & Translucent Surface Hierarchy

### Added & Overhauled
- **Single Persistent WebGL Root Architecture (`src/app/layout.tsx`)**:
  - Mounted dynamic client-only WebGL canvas (`GlBackground`) once at root layout level with `fixed inset-0 pointer-events-none z-0`.
  - Guaranteed single WebGL context lifecycle across the application, eliminating context loss, shader recompilation, and texture memory churn during client-side route navigation.
  - Removed duplicate `<GlBackground />` mount from `src/app/page.tsx` while preserving decoupled hover introspection via custom window events (`releaselens:audit-hover`).
- **Route-Aware Visual Balance & Contrast Shielding (`src/components/gl/GlWrapper.tsx`)**:
  - Configured intelligent pathname inspection via `usePathname()`:
    - **Landing Page (`/`)**: Full vivid prominence (`0.82` opacity, `1.0` speed, `0.52` noise intensity).
    - **Inner Routes (`/dashboard`, `/projects/*`, `/reports/*`)**: Calibrated ambient wave (`0.38` opacity, `0.65` speed, `0.35` noise intensity).
  - Implemented an inner-route ambient contrast shield (`bg-black/40 backdrop-blur-[1px]`) preventing particle displacement from degrading legibility of telemetry tables, JSON probe dumps, and RQI gauges.
- **Translucent Dashboard Surfaces (`src/app/**`)**:
  - Updated inner page shells from solid opaque `bg-black` to `bg-transparent`.
  - Re-engineered dashboard metric cards, project cards, and triage split-panes to deep translucent dark surfaces (`bg-[#0a0c10]/80` and `bg-[#0c0e14]/85` with `backdrop-blur-[2px]`).
- **Accessibility & Motion Guards**:
  - Integrated `prefers-reduced-motion` detection, throttling particle velocity to `0.05` when requested.
  - Enforced strict `pointer-events: none` on WebGL canvas and shield overlays to safeguard all click, keyboard, and touch targets.
- **Verification**:
  - Verified 74/74 Vitest test suites passing (`3.4s`).
  - Verified zero Next.js 15 build errors across all 13 routes (`next build`).
  - Captured desktop (1440x900) and mobile (390x844) visual evidence across landing, dashboard, project overview, and findings triage routes using `ego-browser`.

---

## [0.8.0] - 2026-11-18 — UI/UX Overhaul: Porting v0 High-Aesthetic Pitch-Black & Gold Design System with WebGL Particles

### Added & Overhauled
- **Custom Local Typography & Fonts (`public/Sentient-*.woff`, `src/app/globals.css`, `tailwind.config.ts`)**:
  - Ported authentic `Sentient-Extralight.woff` (weight 200, normal) and `Sentient-LightItalic.woff` (weight 300, italic) from the exported v0 template into `public/`.
  - Configured `@font-face` declarations and added `font-sentient` utility in Tailwind configuration.
  - Applied `font-sentient` to the landing page hero headline with the signature warm amber gold italic emphasis (`<i className="font-light italic text-primary">quality</i>`).
- **GPU-Accelerated WebGL Particle Shader Background (`src/components/gl/*`)**:
  - Implemented FBO GPU particle simulation pipeline using Three.js, `@react-three/fiber`, and `@react-three/drei`.
  - Ported shaders: `simulationMaterial.ts`, `pointMaterial.ts`, `utils.ts` (periodic wave noise), and `vignetteShader.ts` (post-processing vignette effect).
  - Built SSR-safe client wrapper `src/components/gl/GlWrapper.tsx` using `next/dynamic(..., { ssr: false })` with WebGL error boundaries and graceful non-blocking pitch-black fallback.
  - Linked interactive particle acceleration and introspection to user hover states on the `[RUN AUDIT]` button (`introspect={hovering}`).
- **Design Tokens & Theme Geometry (`src/app/globals.css`, `tailwind.config.ts`)**:
  - Implemented pitch-black `#000000` foundation with refined `#0a0a0a` secondary surfaces, `#0d0d0d` cards, and `#262626` fine borders.
  - Added primary amber gold token `#EBB800` with inset glow (`box-shadow: inset 0 0 54px 0px #EBB800`) and exterior halos (`shadow-glow shadow-primary/50`).
  - Added `.chamfer-badge` (`--poly-roundness: 6px`) and `.chamfer-button` (`--poly-roundness: 16px`) polygon clip-path utility classes matching the v0 reference template.
  - Added `#webgl` fixed background positioning with `pointer-events: none` ensuring seamless click-through interactivity.
- **Polygonal UI Primitives (`src/components/ui/*`)**:
  - `Button.tsx`: Added `variant="chamfer"` with cut-corner polygon geometry, diagonal corner accent lines, inset gold glow, and uppercase monospace tracking.
  - `Badge.tsx`: Added `variant="chamfer"` with 4 diagonal corner tick marks and glowing status indicator dot.
  - `Card.tsx`: Added `chamfer` mode with angled corner lines on deep `#0d0d0d` surfaces.
  - `Modal.tsx`: Reskinned modal overlay and dialog container with pitch-black backdrop blur and serif display headings.
- **Complete Application Reskinning**:
  - `src/app/page.tsx`: Transformed hero with live WebGL particle background, Sentient font headline, chamfered top badge, monospace subtitle, chamfered URL audit launcher, three-tier architecture cards, and RQI preview telemetry.
  - `src/components/navigation/Navbar.tsx`: Added geometric logo, uppercase monospace navigation links, live engine status pill, and gold chamfer workspace trigger.
  - `src/components/navigation/Footer.tsx`: Dark technical footer with engine execution tiers and governance citations.
  - `src/app/dashboard/page.tsx`: Restyled application inventory, metrics cards, search bar, and registration modal with chamfer buttons.
  - `src/app/projects/[id]/page.tsx`: Elevated project overview with gold execution buttons, three-tier status matrix, telemetry gauges, and developer handoff briefs.
  - `src/app/projects/[id]/findings/page.tsx`: Reskinned two-pane triage workbench with pitch-black inspector, gold filter pills, keyboard navigation, and chamfer triage controls.
  - `src/app/projects/[id]/bugs/page.tsx`: Upgraded defect inventory with status pills and retest trigger modals.
  - `src/app/projects/[id]/deltas/page.tsx`: Refined comparative release delta and regression intelligence cards.
  - `src/app/login/page.tsx`: Styled authentication portal with Google Sign-In and access control cards.
  - `src/app/reports/[token]/page.tsx`: Reskinned public shared developer handoff permapage.
- **Verification & Evidence**:
  - Executed all 74 Vitest automated regression tests with 100% pass rate.
  - Verified clean Next.js 15 production build (`next build`) across all 13 routes.
  - Verified live application with Ego Browser exclusively (`ego-browser nodejs`), capturing full-page desktop (1440x900) and mobile (390x844) screenshots across all views, including live WebGL shader rendering and button hover acceleration.
  - Documented architectural decisions in ADR-031 (`docs/DECISIONS.md`).

---

## [0.7.0] - 2026-11-04 — Firebase Authentication Integration & Admin SDK Verification

### Added
- **Firebase Authentication Client SDK (`src/lib/firebase/client.ts`)**:
  - Initialized Firebase Web SDK with Google Sign-In popup support (`signInWithPopup`, `GoogleAuthProvider`).
  - Added `signInWithGoogle()` and `signOutFirebase()` helpers with loading and error boundaries.
  - Fail-closed configuration check (`isFirebaseClientConfigured()`).
- **Firebase Admin SDK Server-Side Verification (`src/lib/firebase/admin.ts`)**:
  - Implemented server-side token verification via `firebase-admin/auth` (`verifyFirebaseIdToken()`).
  - Strict zero-trust subject UID extraction: user identity derived exclusively from cryptographically verified `decodedToken.uid`.
  - Added `setCustomTokenVerifier()` for deterministic regression test isolation without external network calls.
- **Dedicated Authentication Routes & UI**:
  - `src/app/login/page.tsx`: Full-featured authentication portal featuring Google Sign-In, error diagnostics, and configuration notices.
  - `src/app/not-found.tsx`: Resilient 404 page preventing Next.js 15 SSR route collection errors.
  - `src/app/api/auth/session/route.ts`: Token exchange endpoint verifying Firebase ID tokens, synchronizing PostgreSQL/SQLite user records, issuing persistent 14-day sessions, and setting secure HTTP-only cookies (`releaselens_session`).
  - `src/components/navigation/Navbar.tsx`: Integrated Google Sign-In and Sign-Out triggers with Firebase Client SDK and Next.js session lifecycle.
- **Architectural Documentation**:
  - Added ADR-028 (Firebase Authentication Integration with Server-Side Admin Verification) to `docs/DECISIONS.md`.
  - Updated `docs/SECURITY.md` with Section 5 (Firebase Authentication Architecture & Token Security).
  - Updated `.env.example` with Firebase client and Admin SDK variable templates.
- **Comprehensive Test Suite**:
  - Added `tests/firebase-auth.test.ts`: 12 automated unit and regression tests covering token verification, invalid/expired token rejection, missing credential fail-closed (503), client-spoofed payload rejection, session logout, and multi-tenant isolation across SQLite and Supabase PostgreSQL. Total test suite expanded to 59 passing tests.

---

## [0.6.0] - 2026-11-04 — Elimination of Shared Demo Tenant Access & Zero-Trust Authorization

### Security Hardening
- **Complete Elimination of Shared Demo Tenant Access**:
  - Removed `user_demo_1` blanket authorization exception across all API routes (`/api/projects`, `/api/projects/[id]`, `/api/projects/[id]/audit`, `/api/findings`, `/api/findings/[id]`, `/api/bugs`, `/api/bugs/[id]`, `/api/bugs/[id]/retest`, `/api/reports/share`, `/api/assistant/chat`).
  - Removed `user_demo_1` fallback from `getAuthSession()`. Unauthenticated requests return `user: null, isAuthenticated: false`.
  - Removed `user_demo_1` filtering and fallback in `SupabaseDataStore` and `PersistentDataStore`.
- **Public Read-Only Demo Mechanism**:
  - Established dedicated read-only policy for `proj_hackathon_demo`. Allows public preview of demo audits and findings, but strictly blocks project deletion, audit execution, findings triage, defect creation, bug updates, and retest submissions (`403 Forbidden`).
- **Zero-Trust Multi-Tenancy**:
  - All authenticated requests access ONLY resources where `project.userId === auth.user.id`.
  - Discarded client-supplied `userId` parameters in request bodies; session identity is strictly bound to validated server cookies.
- **Shared Report Secret Whitelist**:
  - `src/app/api/reports/shared/[token]/route.ts`: Exposes only approved report fields. Strips `verificationToken` and `userId` from project and defect payloads.
- **Expanded Security Regression Test Suite**:
  - `tests/authorization.test.ts`: Verified 9 comprehensive multi-tenant isolation scenarios covering Alice vs Bob isolation, demo immutability, unauthenticated 401 gates, client spoofing prevention, and SupabaseDataStore query contract verification.

---

## [0.5.0] - 2026-11-04 — Post-Ship Security Audit & Production Fail-Closed Hardening

### Added
- **Interactive Playwright User Flows**:
  - `scripts/e2e-browser-qa.mjs`: Upgraded browser QA from passive screenshot taking to real interactive state updates (opening `TriageModal`, submitting triage comments, confirming bugs, opening `RetestModal`, selecting verdict passes, and committing verifications).
- **Static Assets for Server Components**:
  - Added `public/favicon.ico` resolving Next.js 15 SSR `IconMark` manifest resolution warnings.

### Fixed
- **Multi-Tenant Server-Side IDOR Enforcement**:
  - `src/app/api/bugs/route.ts`: Added explicit server-side authorization check (`project.userId === userId || project.userId === "user_demo_1"`).
  - `src/app/api/findings/route.ts`: Added project ownership check blocking cross-tenant findings exfiltration.
  - `src/app/api/assistant/chat/route.ts`: Patched unauthenticated bypass; assistant queries now strictly enforce project ownership.
- **Fail-Closed Provider & OAuth Guarding**:
  - `src/lib/store/db-adapter.ts`: `createDataStore()` now strictly validates `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` if `DATABASE_PROVIDER="supabase"`, throwing a fatal error instead of silently falling back to SQLite.
  - `src/app/api/auth/google/route.ts`: Rejects unauthenticated mock sign-in queries (`?email=...`) in production with HTTP 503, enforcing genuine OAuth redirect and code exchange.

---

## [0.4.0] - 2026-11-04 — Final Ship: Cryptographic ID Hardening, Supabase Adapter & Browser QA

### Added
- **Collision-Resistant Cryptographic Identifiers**:
  - Replaced all `Math.random` implementations with `crypto.randomUUID()` across session generation, project tokens, audit runs, findings, bug reports, and share tokens.
- **Supabase PostgreSQL Production Adapter**:
  - `src/lib/store/supabase-adapter.ts`: Production database adapter conforming to `IDataStore` interface with Supabase client integration and explicit failure on missing production credentials (no silent fallback).
  - Updated `supabase/migrations/20261104000000_init_schema.sql` to include `sessions` table.
- **E2E Automated Browser QA Verification**:
  - `scripts/e2e-browser-qa.mjs`: Complete real Chromium Playwright verification capturing 9 full-screen screenshots across desktop (1280x800) and mobile (375x667).
  - `tests/e2e-workflow.test.ts`: Expanded Vitest suite to 38 tests across 11 test suites.

---

## [0.3.0] - 2026-11-04 — Full Quality Gate, Browser Isolation & Tenant Hardening

### Added
- **Browser-Level Universal Route Interception**:
  - `src/lib/engine/browser-worker.ts`: Registered `page.route('**/*')` intercepting every subresource (`fetch`, `script`, `img`, `css`, `iframe`) and redirect against `validateTargetUrl`. Rejects any internal or cloud metadata subresource request with `accessdenied`.
- **Database Transaction Atomic Rollback**:
  - `src/lib/store/db-adapter.ts`: Implemented `transaction<T>(fn: () => T): T` on `PersistentDataStore` providing atomic commit and rollback guarantees on SQLite transactions.
- **Tenant Authorization & Ownership Verification**:
  - Enforced project and bug ownership validation across `/api/bugs`, `/api/bugs/[id]`, `/api/bugs/[id]/retest`, `/api/findings/[id]`, `/api/reports/share`, preventing cross-tenant read/write tampering.
- **Share Permapage Secret Sanitization**:
  - `src/app/api/reports/shared/[token]/route.ts`: Sanitized public report responses to strictly exclude `verificationToken` and internal credentials.
- **Rules of Hooks & Linter Verification**:
  - Configured ESLint with standard `next/core-web-vitals` rules; resolved conditional hook calls in `RetestModal.tsx` and `TriageModal.tsx`.
- **Expanded Test Suite (36/36 Passing)**:
  - Added Workflow G (Strict Tenant Isolation) and Workflow H (Permapage Expiration & Secret Sanitization) to `tests/api-workflows.test.ts`.
  - Added IPv6 Loopback, ULA, and Link-Local tests to `tests/ssrf-guard.test.ts`.
  - Added Transaction Rollback & Cascading Delete test to `tests/db-persistence.test.ts`.

---

## [0.2.0] - 2026-11-04 — Reality Audit, Functional Completion & Production Hardening

### Added
- **Native Persistent SQLite Storage Engine**:
  - `src/lib/store/db-adapter.ts`: Embedded persistent database using Node 24 `node:sqlite` (`DatabaseSync`), writing to `./data/releaselens.db`.
  - Enforces relational foreign keys, schema migrations, indexing, and proves complete state persistence across server/worker restarts.
  - Authored Supabase PostgreSQL production migration `supabase/migrations/20261104000000_init_schema.sql` with full Row Level Security (RLS) policies.
- **Autonomous Headless Playwright Browser Worker**:
  - `src/lib/engine/browser-worker.ts`: Playwright headless Chromium runner capturing DOM routes, safe non-destructive button interactions, uncaught runtime exceptions, 4xx/5xx network failures, and viewport screenshot Base64 encoding.
  - Integrated directly into the master `audit-runner.ts` pipeline.
- **Defense-in-Depth SSRF Guard**:
  - `src/lib/engine/ssrf-guard.ts`: Strict IP/CIDR validator blocking RFC 1918 private IPv4/IPv6, loopback, link-local, and AWS/GCP cloud metadata endpoints (`169.254.169.254`, `metadata.google.internal`).
- **Session & Auth Subsystem**:
  - `src/lib/auth/session.ts`, `/api/auth/session`, `/api/auth/google`: Mock-ready and OAuth-compatible authentication layer supplying user profiles and active session state.
- **Comprehensive QA Test Suites**:
  - Expanded test coverage from 10 to 32 tests across 10 test files (`db-persistence`, `ssrf-guard`, `browser-worker`, `ai-assistant`, `failure-modes`, `api-workflows`, `rqi-calculator`, `security-headers`, `findings-generator`, `delta-analyzer`).

### Fixed
- Fixed in-memory state loss by transitioning all API routes and UI views to `PersistentDataStore`.
- Aligned API payload shapes with UI view models across all 12 project, findings, bug, and report routes.
- Hardened AI Assistant with credential stripping, token redaction, and deterministic fallback summaries.

---

## [0.1.0] - 2026-11-04 — ReleaseLens Complete Product Build & Ship

### Added
- **Core Cloud Inspection Engine**:
  - `src/lib/engine/tls-inspector.ts`: Live TLS socket connection, peer certificate expiration, and trust chain inspector.
  - `src/lib/engine/security-headers.ts`: Probe for HSTS, CSP, XFO, X-Content-Type-Options, Referrer-Policy, and HTTP-to-HTTPS redirect.
  - `src/lib/engine/link-crawler.ts`: Bounded cheerio-based internal link crawler traversing up to 15 internal routes, extracting HTTP status codes and broken links.
  - `src/lib/engine/pagespeed-client.ts`: Google PageSpeed Insights REST API client extracting Core Web Vitals and Lighthouse scores.
  - `src/lib/engine/findings-generator.ts`: Transforms raw failures and anomalies into `PotentialFinding` items in `NEEDS_REVIEW` triage status.
  - `src/lib/engine/rqi-calculator.ts`: Tripartite ReleaseLens Quality Index calculation (`GATE_SECURITY` + `GATE_FUNCTIONAL` + Quality Score + Audit Coverage).
  - `src/lib/engine/delta-analyzer.ts`: Compares consecutive release audits to compute $\Delta$ RQI, score regressions, and route deltas.
  - `src/lib/engine/audit-runner.ts`: Master orchestrator coordinating autonomous cloud audits.
- **Persistence & Cloud Adapters**:
  - `src/lib/store/db-adapter.ts`: Dual-mode storage adapter supporting live Supabase SSR and memory-backed seed storage.
  - `src/lib/supabase/client.ts`: Client-side Supabase browser client.
- **Evidence-Grounded AI Assistant**:
  - `src/lib/ai/gemini-assistant.ts`: Read-only Gemini Flash assistant with `<untrusted_audit_evidence>` prompt boundaries and deterministic fallback reasoning.
- **API Endpoints**:
  - `/api/projects`: List and create registered web applications.
  - `/api/projects/[id]`: Retrieve and delete applications.
  - `/api/projects/[id]/audit`: Execute autonomous multi-category live cloud audits.
  - `/api/findings`: Retrieve potential findings queue.
  - `/api/findings/[id]`: Triage potential findings (`CONFIRMED`, `REJECTED`, `DUPLICATE`, `ACCEPTED_RISK`).
  - `/api/bugs`: List and manually log exploratory defects.
  - `/api/bugs/[id]`: Update bug lifecycle statuses (`OPEN` $\to$ `FIXED` $\to$ `VERIFIED`).
  - `/api/bugs/[id]/retest`: Record retest verification verdicts (`PASS`, `FAIL`, `INCONCLUSIVE`).
  - `/api/reports/share` & `/api/reports/shared/[token]`: Permapage shareable developer report generation.
  - `/api/assistant/chat`: Read-only grounded AI queries on release evidence.
- **Dark Luxury UI Suite (`v0-optimus-delta` inspired)**:
  - `Navbar` & `Footer` with live cloud status and brand identity.
  - `RqiGauge`: Circular score gauge with hard gates and coverage pill.
  - `HardGateBadges`: Detailed visual indicators for Security and Functional hard gates.
  - `CheckList`: Expandable accordion displaying executed checks, durations, and raw evidence.
  - `FindingCard` & `TriageModal`: Triage cards with instant confirm/reject actions and detailed inspector.
  - `BugCard`, `RetestModal`, `ManualBugModal`: Complete defect management and retest cycle logging.
  - `DeveloperHandoffView`: Formatted developer handoff brief with copyable markdown and shareable permalink.
  - `AiAssistantDrawer`: Slide-over evidence copilot chat with suggested prompts.
- **Application Pages**:
  - `/`: Public marketing landing page with instant live URL auditing.
  - `/dashboard`: Workspace overview with aggregated metrics and application registration.
  - `/projects/[id]`: Comprehensive project overview, live RQI, hard gates, and latest check telemetry.
  - `/projects/[id]/findings`: Findings Inbox triage queue with severity filters.
  - `/projects/[id]/bugs`: Confirmed Defect Tracker with lifecycle state transitions and retest verification.
  - `/projects/[id]/deltas`: Release Delta comparative regression analysis.
  - `/reports/[token]`: Standalone shareable developer handoff permalink report.
- **Automated Verification**:
  - `tests/rqi-calculator.test.ts`: 5 unit tests for Tripartite RQI and hard gate enforcement.
  - `tests/security-headers.test.ts`: 2 unit tests for header extraction and clickjacking detection.
  - `tests/findings-generator.test.ts`: 1 unit test for "Automate First, Human Review Second" pipeline.
  - `tests/delta-analyzer.test.ts`: 2 unit tests for release regression detection.
  - 100% test pass rate across 10 tests in 251ms.
  - 100% production build pass rate across 10 routes in Next.js 15.5.28.
