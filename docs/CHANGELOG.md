# Changelog — ReleaseLens

All notable changes to the ReleaseLens project are documented in this file in adherence to `AGENTS.md` Continuous Documentation Synchronization.

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
