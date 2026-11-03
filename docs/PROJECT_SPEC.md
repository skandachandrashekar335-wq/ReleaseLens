# Project Specification — ReleaseLens

> **Document Status**: `SYNCHRONIZED` / `FINAL SPECIFICATION LOCK (ROUND 5)`  
> **Last Synchronized**: 2026-11-03  
> **Target Release**: MVP v0.1.0  

---

## 1. Product Summary & Mission

**ReleaseLens** is a cloud-hosted **Web Application Testing, Bug Discovery, Evidence Collection, and Release-Readiness Platform**.

It provides a unified workspace where testers and hackathon builders can register applications, run automated health audits, conduct structured manual exploratory testing, log rich developer-ready bug reports, share findings with engineers, track fixes through a verification lifecycle, and monitor release readiness via the ReleaseLens Quality Index (RQI).

---

## 2. Core Functional Modules (MVP v0.1.0)

| Module | Purpose | Key Capabilities |
| :--- | :--- | :--- |
| **A. Authentication & Workspace** | Identity & Tenancy | Google Sign-In via Supabase Auth, secure sessions, user projects, multi-tenant Row-Level Security. |
| **B. Project Registration** | Target Management | Register project name, URL (`*.vercel.app` or custom domain), environment tag (`PRODUCTION`, `STAGING`, `PREVIEW`), and test scope. |
| **C. Automated Testing** | Bounded Audits | Availability, TLS validity, HTTP security headers, broken links (up to 15 pages via Cloudflare Worker), Core Web Vitals via Google PageSpeed API. Output: `PASS`, `FAIL`, `NOT_RUN`, `INCONCLUSIVE`. |
| **D. Manual Bug Discovery** | Tester Core Flow | Structured bug logger: Title, URL, steps to reproduce, expected vs actual, severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), environment telemetry, screenshots/evidence, and developer notes. |
| **E. Bug Lifecycle Management** | Defect Workflow | Status progression: `OPEN` $\to$ `ACKNOWLEDGED` $\to$ `IN_PROGRESS` $\to$ `FIXED` $\to$ `RETEST_REQUIRED` $\to$ `VERIFIED` (or `REOPENED`). |
| **F. Developer Handoff** | Actionable Reporting | Clean developer bug briefs, shareable public/private links, Markdown/JSON export with actionable next steps. |
| **G. Retesting & Release Deltas** | Regression Tracking | Re-audit application, verify fixed bugs, detect regressions ($>5$ pt RQI drop, new broken links, newly opened critical bugs). |
| **H. Tripartite RQI Engine** | Release Readiness | Independent Hard Gates (Security Gate + Critical Bug Gate) + Tested Quality Score + Audit Coverage %. |
| **I. Evidence AI Assistant** | Bug Synthesis | Read-only Gemini Flash assistant explaining technical logs and drafting developer bug briefs without hallucinating outcomes. |

---

## 3. Technology Stack & Hosting Topology

- **Frontend & App Layer**: Next.js 15 (App Router, Server Actions, Tailwind CSS, Radix UI) hosted on **Vercel (Hobby Tier)**.
- **Database & Authentication**: **Supabase (Free Tier)** PostgreSQL with Row-Level Security and Google OAuth.
- **Link Crawler Engine (Tier 2)**: **Cloudflare Workers Free Plan** (100k requests/day, 10ms CPU limit, up to 50 subrequests).
- **Synthetic Performance Engine**: **Google PageSpeed Insights REST API** (25,000 requests/day free with API key).
- **Conversational AI Assistant**: **Google Gemini Flash API** via Google AI Studio Free Tier (15 RPM / 1,500 RPD).
- **Operating Model**: 100% cloud-hosted. Zero machine-local dependencies. Zero credit cards required on core MVP services; hard limits prevent auto-billing.

---

## 4. Scope Governance & Deferred Capabilities

### Explicitly In Scope
- Web application (Desktop browser + responsive mobile web interface).
- Complete modules A through I listed in Section 2.
- Hard zero-cost architecture with graceful limit degradation.

### Explicitly Deferred to Post-MVP (v0.2.0+)
- ⏳ Native desktop (Windows EXE, macOS DMG) and mobile (Android/iOS) apps.
- ⏳ Full automated headless authenticated browser testing (Cloud Run container worker).
- ⏳ Two-way GitHub/Jira issue synchronization.
- ⏳ Continuous 24/7 background cron monitoring.
- ⏳ Autonomous AI testing agents.
