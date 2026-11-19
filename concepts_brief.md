# ReleaseLens — Autonomous Web Application Testing & Release Readiness Platform

* **Author:** Skanda Chandrashekar (@skandachandrashekar335-wq)
* **Date:** 2026-11-09
* **Status:** PROPOSED (Phase 1 EGM Brainstorm Complete)

---

## Overview

ReleaseLens is a cloud-hosted SaaS platform for autonomous web application testing, defect intelligence, evidence capture, human verification, and release readiness assessment. 

Instead of requiring developers to manually write repetitive browser tests or manually author bug reports from scratch, ReleaseLens operates on an **"Automate First, Human Review Second"** pipeline:
1. A user enters any web application or preview deployment URL (e.g. `*.vercel.app`).
2. ReleaseLens autonomously inspects TLS certificate validity, enforces security headers, crawls internal routes (up to 15 pages), detects broken links, captures runtime JavaScript exceptions, evaluates interactive controls, and measures Core Web Vitals via Google PageSpeed Insights.
3. Raw anomalies are routed to a **Findings Inbox** as *Potential Findings*.
4. A human tester reviews rich, captured technical evidence (screenshots, network traces, console logs, auto-drafted reproduction steps) and confirms genuine defects with single-click actions or keyboard shortcuts.
5. Confirmed defects enter an active defect inventory, trip the functional release gate if critical, and produce shareable developer-ready bug reports with copyable Markdown and cURL commands.
6. Fixes are tracked through an explicit retest lifecycle (`OPEN` → `FIXED` → `VERIFIED` | `REOPENED`), and overall release health is governed by the mathematical **ReleaseLens Quality Index (RQI)**.

---

## Analysis

Across the multi-lens Goldfish review (Contrarian/YAGNI, Cost & Token Economics, UX & Ergonomics, Backward Compatibility, Observability, Long-Term Maintenance, and Inventive Catalyst), the platform concept was evaluated against production realities:

### 1. Inventive Contradictions & Resolutions (TRIZ)
- **The False Alarm Paradox (Automation Speed vs. Alert Fatigue)**:
  - *Contradiction*: Autonomous web crawlers generate high alert noise on dynamic single-page applications, while developer teams ignore noisy scanners.
  - *Resolution (Separation in Time & State)*: Unreviewed automated scanner outputs are strictly classified as *Potential Findings* (`NEEDS_REVIEW`). They never trip hard release blockers or masquerade as verified bugs until a human tester explicitly confirms them in the Findings Inbox.
- **Heavy Browser Automation vs. Vercel $0 Serverless Limits**:
  - *Contradiction*: Full headless Chromium browser instances consume 500MB+ RAM and 10–30s execution times, which crash or exceed Vercel Hobby serverless limits (1024MB RAM, 10–15s timeout, 50MB bundle).
  - *Resolution (Asymmetric Tiering)*: Tier 1 (fast Cheerio crawler + native Node TLS socket inspection) executes in <1.5s with <40MB RAM. Tier 2 offloads synthetic Core Web Vitals to the Google PageSpeed Insights REST API (free 25,000 req/day). Tier 3 provides Playwright headless execution with SSRF isolation in containerized/local runner environments.
- **Speed of Logging vs. Developer Rigor**:
  - *Contradiction*: Developers and hackathon builders hate filling out 8-field bug forms, but receiving engineers cannot fix bugs without reproduction steps, URL, and stack traces.
  - *Resolution (Prior Action)*: ReleaseLens uses Gemini 1.5 Flash in a strictly bounded, read-only mode to interpret captured HTTP status codes, console error logs, and DOM element selectors to auto-draft the reproduction steps and bug title. The human tester only clicks "Confirm" or presses keyboard shortcut `C`.

### 2. Dual Reporting Architecture
ReleaseLens enforces two distinct, decoupled reports for every audit:
- **Report A (Technical Audit Report)**: Exhaustive machine telemetry containing every check executed, passed, failed, inconclusive, or untested, along with raw latency, TLS metadata, and performance scores.
- **Report B (Human-Reviewed Defect Report)**: Verified defects only, categorized by severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), with confirmed reproduction steps, screenshots, developer handoff links, and retest verification history.

### 3. Tripartite RQI Mathematical Formalism
The Release Quality Index (RQI) mathematically decouples hard risk from soft scoring:
- **Hard Gates ($G_{\text{security}}$ and $G_{\text{functional}}$)**:
  - $G_{\text{security}}$: TLS validity, HTTPS enforcement, Clickjacking (X-Frame-Options/CSP).
  - $G_{\text{functional}}$: Unresolved confirmed critical bugs or fatal broken routes.
  - *Invariant*: If either gate evaluates to `FAIL`, the release verdict is unconditionally **`RELEASE_BLOCKED`**.
- **Tested Quality Score ($S_{\text{quality}}$)**:
  - 0–100 scale based on executed check scores minus weighted bug penalties (Critical: -25, High: -15, Medium: -8, Low: -3).
- **Release Verdict Matrix**:
  - `VERIFIED_READY`: Hard gates PASS, 0 unreviewed findings, 0 confirmed critical bugs, coverage 100%, quality $\ge 85$.
  - `PROVISIONAL_PASS`: Hard gates PASS, 0 critical bugs, but unreviewed findings exist OR coverage $< 100\%$.
  - `REVIEW_REQUIRED`: Inconclusive gates OR high-severity unconfirmed findings pending triage.
  - `RELEASE_BLOCKED`: Any Hard Gate FAILS OR quality $< 70$.

---

## Goals vs. Non-Goals

### In-Scope Goals (MVP v0.1.0)
- **Instant URL Onboarding**: Enter URL from marketing landing page or authenticated dashboard and trigger an immediate audit.
- **Autonomous Audit Engine**: TLS inspection, HTTP security headers, Cheerio internal route crawler (up to 15 pages), console error detection, and PageSpeed Insights integration.
- **SSRF Perimeter Defense (ADR-025)**: DNS pre-flight verification blocking private IP subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.169.254`, `::1`) and redirect trapping.
- **Findings Inbox Triage**: Master-detail inbox with filters (`ALL`, `NEEDS_REVIEW`, `CONFIRMED`, `REJECTED`, `ACCEPTED_RISK`) driven by URL search params, and keyboard shortcuts (`J`/`K` navigate, `C` confirm, `R` reject, `D` duplicate, `A` accept risk).
- **False-Positive Suppression Memory**: When a tester rejects a finding (`REJECTED` or `ACCEPTED_RISK`), the finding signature is retained to suppress duplicate false-positive noise in subsequent release audits.
- **Defect Inventory & Developer Handoff**: Verified bug tracker with Markdown / GitHub Issue copy and zero-auth public permalinks (`/reports/[token]`).
- **Zero-Dependency Lightweight Visuals**: Native Tailwind CSS progress rings, semantic meter bars, and SVG gauges without bulky charting library dependencies (keeping bundles < 50KB).
- **Retest Verification Workflow**: Mark bugs as fixed and record retest execution runs (`VERIFIED` vs `REOPENED`).
- **Release Delta Regression Tracker**: Side-by-side comparative analysis of consecutive audit runs.
- **Strict Tenant Isolation & Server-Side IDOR Enforcement (ADR-026 & ADR-027)**: Session token validation and project ownership verification on every API route.
- **Dual Persistence Strategy (ADR-024)**: Embedded `node:sqlite` for local zero-daemon operation and Supabase PostgreSQL with RLS for cloud production.

### Out-of-Scope Non-Goals (Explicitly Deferred)
- ❌ **Automated Destructive Interactions**: The crawler will never submit live forms, click payment buttons, or mutate external databases autonomously.
- ❌ **Native Desktop / Mobile Apps**: No Electron, Tauri, iOS, or Android builds in MVP.
- ❌ **Two-Way Jira/GitHub Sync Webhooks**: Permalinks and one-click copyable markdown suffice for MVP; live two-way sync is deferred to v0.2.0.
- ❌ **Always-On Background Monitoring Cron**: Audits are triggered on-demand via URL entry or CI webhook; no continuous background polling daemons on the free tier.
- ❌ **Paid AI / Heavy LLM Testing Agents**: Gemini 1.5 Flash is used solely for read-only evidence interpretation under the free quota (15 RPM); no paid autonomous agent loops.

---

## Alternatives Weighed

1. **Pure Client-Side Crawler in Browser**:
   - *Rejected*: Browser CORS policies prevent cross-origin HTML fetching and header inspection from the client browser. All audits must be driven server-side.
2. **Headless Chromium in Vercel Serverless Function**:
   - *Rejected*: Binary size (~180MB) exceeds Vercel Hobby uncompressed limits (50MB) and frequently times out after 10–15 seconds. Replaced with Cheerio for fast crawling + PageSpeed API for heavy metrics + isolated container worker for deep Playwright runs.
3. **Treating Scanner Findings Directly as Bugs**:
   - *Rejected*: Leads to severe false positive fatigue and immediate developer rejection. Replaced with the intermediate Findings Inbox triage queue.
4. **Third-Party Paid Bug Trackers (Sentry, Linear API dependencies)**:
   - *Rejected by Author*: Breaks the strict ₹0 / $0 free-resource mandate. ReleaseLens maintains its own internal defect tracker and exports clean, universal markdown for any external system.
5. **In-Memory JavaScript Map for Persistence**:
   - *Rejected*: Lost all state on Vercel container recycling. Replaced with persistent SQLite (`node:sqlite`) and Supabase PostgreSQL.

---

## Key Decisions & Staging for Next Steps

1. **Design System & Visual Identity**:
   - Adopt a high-precision, dark luxury engineering aesthetic inspired by `v0-optimus-delta`.
   - Palette: Background `#08090C`, Card Surfaces `#10121A`, Elevated Surfaces `#181B26`, Borders `#222634` and `#191C26`, Foreground `#F4F6FB`, Accents `#10B981` (Emerald), `#38BDF8` (Sky), `#EF4444` (Ruby).
   - Typography: Instrument Sans (UI Body), Instrument Serif (Editorial Display Accents), JetBrains Mono (Technical Data & Code).
   - Motion: Subtle-to-medium purposeful transitions (gauge animations, progress timelines, evidence inspection drawers); strictly respect `prefers-reduced-motion`.
2. **Harmonize API Contracts & UI Components**:
   - Align all API payloads between frontend components and backend routes (resolve array wrapping, `affectedUrl` fallback, share token unpacking).
3. **Execute Design Research & Benchmark Collection (Phase 2 & Phase 3)**:
   - Study GitHub design repositories (`impeccable`, `taste-skill`, `ui-ux-pro-max-skill`, `hallmark`, `motionsites-web-builder`) and 10 live reference sites via Ego Browser.
4. **Staging into Phase 4**:
   - Compile `research/DESIGN_RESEARCH.md` and draft `design_draft.md` for Goldfish review before building remaining UI screens.
