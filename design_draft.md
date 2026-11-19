# ReleaseLens — Comprehensive Technical Design & Build Specification

* **Author:** Skanda Chandrashekar (@skandachandrashekar335-wq)
* **Date:** 2026-11-09
* **Document Status:** `APPROVED_AND_RESOLVED` (Goldfish Review Findings Resolved)
* **Predecessor Context:** [`concepts_brief.md`](file:///Users/skandachandrashekar335/projects/ReleaseLens/concepts_brief.md), [`research/DESIGN_RESEARCH.md`](file:///Users/skandachandrashekar335/projects/ReleaseLens/research/DESIGN_RESEARCH.md)

---

## 1. Overview, Problem Statement & Scope

### 1.1 Executive Summary
ReleaseLens is an autonomous web application testing, defect intelligence, evidence collection, and release readiness platform. Built on the principle of **"Automate First, Human Review Second"**, ReleaseLens eliminates the friction of manual exploratory testing while avoiding the false-positive alert fatigue common to automated website scanners.

Users provide a target URL (such as preview deployments on Vercel or Netlify). ReleaseLens executes bounded, cloud-native automated audits, surfaces raw anomalies as **Potential Findings** in a dedicated **Findings Inbox**, empowers human testers to rapidly confirm genuine bugs with rich evidence, manages defects through a structured verification lifecycle, and governs overall release health via the mathematical **ReleaseLens Quality Index (RQI)**.

### 1.2 Target Personas & Core User Journeys
1. **Solo Hackathon Builder & Indie Developer**:
   - *Needs*: Zero-configuration instant URL auditing for `*.vercel.app` demo apps to catch runtime JavaScript crashes, broken links, and SSL issues before a pitch or launch.
   - *Journey*: Enters URL on landing page → Views live audit execution → Inspects auto-flagged console errors → Copies markdown bug report with cURL.
2. **QA Engineer & Test Lead**:
   - *Needs*: High-speed triage of autonomous scan findings, structured evidence capture, and an audit trail to make objective release decisions.
   - *Journey*: Reviews Findings Inbox using single-key shortcuts (`J`/`K`/`C`/`R`) → Confirms genuine bugs → Assigns severity → Tracks bug retesting until verified.
3. **Frontend & Backend Receiving Developer**:
   - *Needs*: Reproducible bug reports with exact URLs, sanitized network logs, console stack traces, and copyable cURL commands, without having to ask the tester for clarification.
   - *Journey*: Opens developer handoff permalink (`/reports/[token]`) → Replicates issue from auto-drafted steps → Fixes code → Requests retest.
4. **Engineering Manager & Release Lead**:
   - *Needs*: Clear, ungameable release criteria and historical release comparison.
   - *Journey*: Checks project dashboard → Inspects Hard Gates status (`GATE_SECURITY`, `GATE_FUNCTIONAL`) → Evaluates RQI Score and Release Delta regressions before approving production deployment.

### 1.3 In-Scope Goals (MVP v0.1.0)
- **Instant URL Audit Bar**: Landing page input supporting instant audit launch with pre-flight URL validation.
- **Autonomous Audit Engine**:
  - TLS certificate verification (validity, days to expiration, issuer).
  - Security header inspection (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).
  - Internal link crawler (bounded to 15 pages, max depth 2) detecting broken links (4xx/5xx).
  - Console runtime error sniffer and subresource failure tracking.
  - Core Web Vitals (LCP, CLS, INP) via Google PageSpeed Insights REST API.
- **SSRF Perimeter Defense (ADR-025)**: DNS pre-flight verification blocking private subnets and metadata IPs, plus redirect re-validation.
- **Findings Inbox (Triage Queue)**: Two-pane master-detail interface with status filters (`ALL`, `NEEDS_REVIEW`, `CONFIRMED`, `REJECTED`, `ACCEPTED_RISK`) and guarded single-key shortcuts (`C`, `R`, `D`, `J`, `K`).
- **Defect Inventory & Lifecycle**: Verified defect tracker managing states: `OPEN` $\to$ `FIXED` $\to$ `VERIFIED` $\mid$ `REOPENED`.
- **Retest Verification Workflow**: Test run execution recording retest outcomes and updating defect status.
- **Release Delta Regression Tracker**: Sequential run comparison classifying findings as `NEW`, `RESOLVED`, or `RECURRING`.
- **Tripartite RQI Governance (ADR-020 & ADR-023)**: Deterministic RQI calculation with two independent Hard Gates. Any failed hard gate enforces `RELEASE_BLOCKED`.
- **Dual Reporting Engine**:
  - Report A: Technical Audit Report (full machine telemetry).
  - Report B: Human-Reviewed Defect Report (confirmed bugs only).
- **Developer Handoff Permalinks**: Zero-auth public permalinks (`/reports/[token]`) with sanitized evidence and copyable GitHub Issue Markdown.
- **Dual Persistence (ADR-024)**: Embedded `node:sqlite` for local zero-daemon operation and Supabase PostgreSQL with RLS for cloud deployment.
- **Zero-Trust Multi-Tenancy & Server Authorization (ADR-026 & ADR-027)**: Strict server-side verification of project ownership on all mutating API routes.

### 1.4 Out-of-Scope Non-Goals (Explicitly Deferred)
- ❌ **Autonomous Destructive Interactions**: No automated form submissions, order placements, or database mutating actions.
- ❌ **Continuous 24/7 Background Cron Monitoring**: No always-on polling daemons on the $0 free tier; audits are executed on-demand.
- ❌ **Native Desktop/Mobile Applications**: No Electron or mobile native apps in MVP; responsive web only.
- ❌ **Two-Way Jira/Linear Webhook Synchronization**: Replaced by high-fidelity one-click GitHub Issue Markdown export and permalinks.
- ❌ **Paid AI / Heavy LLM Testing Agents**: Gemini 1.5 Flash is strictly bounded to on-demand read-only evidence interpretation under the free quota (15 RPM).

---

## 2. Architecture & Component Boundaries

### 2.1 The Two-Tier Audit Pipeline (with Concurrency & Serverless Limits)
To guarantee completion under Vercel's 10s–15s serverless execution limit:
1. **Parallelized Execution via `Promise.allSettled`**:
   - Probe A: DNS Pre-flight & TLS Socket Inspection (`~300ms`)
   - Probe B: HTTP Security Headers & Clickjacking Probe (`~400ms`)
   - Probe C: Cheerio Internal Route Crawler (Max 15 links, max depth 2, `AbortSignal.timeout(6000)`)
   - Probe D: Google PageSpeed Insights REST API (`AbortSignal.timeout(8000)`)
   - Total concurrent execution time: **4–7 seconds**, safely within Vercel's window.
2. **Next.js Serverless Route Handlers**:
   - Explicitly declare `export const maxDuration = 15;` in `src/app/api/projects/[id]/audit/route.ts`.
3. **Playwright Runtime Demarcation**:
   - On Vercel Serverless (`process.env.VERCEL === "1"` or when browser binary is absent), the engine operates purely in Tier 1 + Tier 2 mode (`skipBrowserWorker: true`).
   - PageSpeed Insights captures Core Web Vitals and console warnings via Lighthouse lab execution without consuming serverless RAM or CPU.
   - In local development or isolated runner environments, Playwright executes headless Chromium for real DOM element evaluation and full viewport screenshots.

```
                        ┌────────────────────────────────────────────────────────┐
                        │                   TARGET WEB APP                       │
                        │            (e.g. preview.vercel.app)                   │
                        └──────────────────────────┬─────────────────────────────┘
                                                   │
                   ┌───────────────────────────────┴───────────────────────────────┐
                   │               PARALLEL AUDIT PROBES (Concurrent)              │
                   │                                                               │
                   ├───────────────────────────────┬───────────────────────────────┤
                   │   TIER 1: FAST CRAWL (Node)   │   TIER 2: PERFORMANCE (API)   │
                   ├───────────────────────────────┼───────────────────────────────┤
                   │ • DNS SSRF Pre-flight Guard   │ • Google PageSpeed API        │
                   │ • TLS Certificate Inspector   │ • Core Web Vitals:            │
                   │ • HTTP Security Headers Probe │   - LCP, CLS, INP             │
                   │ • Cheerio Internal Crawler    │ • Lighthouse Console Errors   │
                   │   (Max 15 links, 2 hops)      │ • 25k requests/day free tier  │
                   │ • Latency: < 1.5s, RAM: <40MB │                               │
                   └───────────────┬───────────────┴───────────────┬───────────────┘
                                   │                               │
                                   └───────────────┬───────────────┘
                                                   │
                                                   ▼
                                   ┌───────────────────────────────┐
                                   │   FINDINGS GENERATOR ENGINE   │
                                   │  - Anomaly classification     │
                                   │  - Deterministic repro draft  │
                                   │  - On-Demand Gemini AI button │
                                   └───────────────┬───────────────┘
                                                   │
                                                   ▼
                                   ┌───────────────────────────────┐
                                   │     PERSISTENCE ADAPTER       │
                                   │  - SQLite (Local Dev / Test)  │
                                   │  - Supabase PostgreSQL (Cloud)│
                                   └───────────────┬───────────────┘
                                                   │
                                                   ▼
                                   ┌───────────────────────────────┐
                                   │    FINDINGS INBOX (2-PANE)    │
                                   │  Master list + Detail viewer  │
                                   │  Guarded J/K/C/R shortcuts    │
                                   └───────────────────────────────┘
```

### 2.2 Dual Reporting Separation
1. **Technical Audit Report (Report A)**:
   - Target audience: QA Leads, SecOps, Infrastructure engineers.
   - Contents: Every executed check, check status (`PASS`, `FAIL`, `NOT_RUN`, `INCONCLUSIVE`), duration (ms), raw headers, certificate expiry, PageSpeed lab metrics, and overall coverage percentage.
2. **Human-Reviewed Defect Report (Report B)**:
   - Target audience: Core product developers and engineering managers.
   - Contents: Zero false positives. Contains ONLY human-confirmed bugs, prioritized by severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), with confirmed reproduction steps, environment telemetry, and retest verification history.

### 2.3 RQI Mathematical Governance
$$\text{Verdict} = \begin{cases} 
\mathbf{RELEASE\_BLOCKED} & \text{if } G_{\text{security}} = \text{FAIL} \lor G_{\text{functional}} = \text{FAIL} \lor S_{\text{quality}} < 70 \\
\mathbf{REVIEW\_REQUIRED} & \text{if } G_{\text{security}} = \text{INCONCLUSIVE} \lor G_{\text{functional}} = \text{INCONCLUSIVE} \lor \text{Unreviewed High/Crit} > 0 \\
\mathbf{PROVISIONAL\_PASS} & \text{if } \text{Hard Gates PASS} \land (\text{Coverage} < 100\% \lor \text{Unreviewed Findings} > 0) \\
\mathbf{VERIFIED\_READY} & \text{if } \text{Hard Gates PASS} \land \text{Coverage} = 100\% \land \text{Unreviewed} = 0 \land S_{\text{quality}} \ge 85
\end{cases}$$

---

## 3. Design System & UI Specifications (Concept A: Obsidian Telemetry Terminal)

### 3.1 Design Vocabulary & Hallmark Floor Tokens
Conforming to Hallmark Floor, Impeccable slop detector, and Taste Skill rules:
- **Zero Decorative Eyebrow Pills**: Headings lead directly in sentence case.
- **Zero Purple/Blue Gradients**: Single physical accent (Technical Emerald `#10B981` for verified states, Ruby `#EF4444` for release-blocking defects).
- **No `transition: all`**: Only `transition-[opacity,transform]` with standard duration (150ms).
- **CSS Invariants in `globals.css`**:
  - `html, body { overflow-x: clip; }`
  - `:focus-visible { outline: 2px solid #10B981; outline-offset: 2px; }`
  - `@media (prefers-reduced-motion: reduce) { *, ::before, ::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`
- **Tabular Numerals**: `font-variant-numeric: tabular-nums` and `JetBrains Mono` for latencies, counts, dates, and RQI scores.
- **Palette**:
  - Background Canvas: `#08090C`
  - Surface Card: `#10121A`
  - Elevated Surface: `#181B26`
  - Subtle Border: `rgba(255, 255, 255, 0.08)`
  - Active Border: `#222634`
  - Primary Text: `#F4F6FB`
  - Secondary Text: `#8B949E` (Contrast 5.9:1, WCAG AA compliant)
  - Muted Text: `#586069`

### 3.2 Findings Inbox Two-Pane Architecture
1. **Left Master Pane (`w-[420px]` on desktop)**:
   - Sticky header with status filter tabs (`ALL`, `NEEDS_REVIEW`, `CONFIRMED`, `REJECTED`, `ACCEPTED_RISK`).
   - Scrollable list of compact finding cards showing severity badge, check source, title, and active selection border (`border-emerald-500`).
2. **Right Detail Inspector (`flex-1` fixed viewport)**:
   - Header with quick action bar: `Confirm as Bug (C)`, `Reject (R)`, `Mark Duplicate (D)`.
   - Technical Evidence Panel: Observed status code, failing URL, sanitized headers, console error snippet.
   - Step-by-Step Reproduction Panel: Deterministic reproduction checklist + optional "Enhance with AI" button (invokes Gemini Flash on-demand without exceeding the 15 RPM quota).
   - Developer Export: One-click "Copy as GitHub Issue" (formatted Markdown with `<details>` tags for traces).
3. **Guarded Keyboard Navigation**:
   - `J` / `K`: Move down / up finding list.
   - `C`: Confirm as Bug.
   - `R`: Reject (false positive).
   - `D`: Mark Duplicate.
   - **Guard**: When `document.activeElement` is an `INPUT` or `TEXTAREA`, shortcuts are immediately ignored to prevent typing collisions.
   - **Optimistic UI**: Keypress immediately updates local selection and moves to next item while the API persists asynchronously.
4. **URL Search Params Synchronization**:
   - URL reflects state: `/projects/[id]/findings?status=NEEDS_REVIEW&severity=ALL&findingId=find_123`.
   - Refreshing or sharing the URL preserves exact selected finding and filters.

---

## 4. Data Models, Persistence & Security Enforcement

### 4.1 Relational Schema Parity (`IDataStore`)
Both SQLite (`PersistentDataStore`) and Supabase PostgreSQL (`SupabaseDataStore`) enforce identical relational schemas:
- `users`: ID, email, name, role (`lead_qa`, `qa_engineer`, `developer`), created_at.
- `sessions`: session_token, user_id, expires_at, created_at.
- `projects`: ID, user_id, name, target_url, environment (`PREVIEW`, `STAGING`, `PRODUCTION`), is_verified, verification_token.
- `audits`: ID, project_id, status (`RUNNING`, `COMPLETED`, `FAILED`), rqi_score, verdict, gate_security, gate_functional, coverage_pct, raw_evidence_json.
- `checks`: ID, audit_id, category (`SECURITY`, `AVAILABILITY`, `PERFORMANCE`, `LINKS`), check_name, status (`PASS`, `FAIL`, `NOT_RUN`, `INCONCLUSIVE`), score, raw_evidence_json.
- `findings`: ID, audit_id, project_id, test_source, source_check, affected_url, title, description, recommended_severity, status (`NEEDS_REVIEW`, `CONFIRMED`, `REJECTED`, `ACCEPTED_RISK`).
- `bugs`: ID, project_id, finding_id, title, description, severity, status (`OPEN`, `FIXED`, `VERIFIED`, `REOPENED`), steps_to_reproduce, affected_url.
- `retest_history`: ID, bug_id, audit_id, previous_status, new_status, outcome (`VERIFIED_FIXED`, `STILL_FAILING`), notes.
- `share_tokens`: token, project_id, audit_id, expires_at, created_at.

### 4.2 Security & Threat Mitigations
- **ADR-025 SSRF Guard**:
  - Pre-flight DNS resolution using `dns.promises.lookup()`. Rejection of all private CIDR blocks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16`, `::1`, `fc00::/7`, `fe80::/10`) and cloud metadata endpoints.
  - Redirect interception re-running DNS validation on every hop.
- **ADR-026 Server-Side IDOR Enforcement**:
  - Every API route validates that `project.userId === session.userId || project.userId === "user_demo_1"`. Requests targeting unauthorized projects return `403 Forbidden`.
- **ADR-017 Evidence Sanitization**:
  - Automated regex scrubbing of authorization headers, session cookies, Bearer tokens, and email addresses before persistence or transmission to AI endpoints.

---

## 5. Implementation Phasing & Step-by-Step Build Order

1. **Step 5.1: Clean Core Design System & Tokens (`src/app/globals.css`, `src/components/ui/`)**:
   - Update `src/app/globals.css` with formal Obsidian tokens, `overflow-x: clip`, `:focus-visible`, and `@media (prefers-reduced-motion: reduce)`.
   - Refactor `Button.tsx`, `Badge.tsx`, `Card.tsx`, and `Modal.tsx` to eliminate `transition-all` in favor of scoped transitions and instant focus rings.
2. **Step 5.2: Redesign Marketing Landing Page (`src/app/page.tsx`)**:
   - Remove eyebrow pill badge, purple gradients, and blurred background glow orbs.
   - Build high-density instant audit command bar with live domain validation.
   - Embed interactive telemetry HUD with animated SVG RQI gauge and dual-report comparison.
3. **Step 5.3: Build Two-Pane Findings Inbox with URL State & Guarded Shortcuts (`src/app/projects/[id]/findings/page.tsx`)**:
   - Implement master-detail split screen (left: finding stream, right: fixed evidence inspector).
   - Wire guarded single-key shortcuts (`J`/`K`/`C`/`R`/`D`).
   - Sync filter and selection state with URL search params.
   - Connect on-demand "Enhance with AI" button.
4. **Step 5.4: Optimize Audit Runner Concurrency (`src/lib/engine/audit-runner.ts`)**:
   - Parallelize probes using `Promise.allSettled`.
   - Add `skipBrowserWorker` check when running in serverless Vercel environments.
   - Set `export const maxDuration = 15;` in audit route.
5. **Step 5.5: Verify Test Suites & Production Build**:
   - Run Vitest test suite (`pnpm test`) and ensure all suites pass.
   - Run Next.js production build (`pnpm build`).
6. **Step 5.6: Phase 6 Verification in Ego Browser**:
   - Spin up local server and use Ego Browser to verify interactive flows, keyboard navigation, and responsive layouts.
   - Run Hallmark and Impeccable slop verification audits.
