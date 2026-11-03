# Changelog — ReleaseLens

All notable changes to the ReleaseLens project are documented in this file in adherence to `AGENTS.md` Continuous Documentation Synchronization.

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
