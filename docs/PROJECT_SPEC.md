# Project Specification — ReleaseLens

> **Document Status**: `SYNCHRONIZED` / `FINAL SPECIFICATION LOCK (AUTOMATE FIRST)`  
> **Last Synchronized**: 2026-11-03  
> **Target Release**: MVP v0.1.0  

---

## 1. Product Summary & Mission

**ReleaseLens** is a cloud-hosted **Web Application Testing, Bug Discovery, Evidence Collection, and Release-Readiness Platform**.

It operates on a single unified workflow:
$$\textbf{ENTER URL} \longrightarrow \textbf{AUTOMATED AUDIT} \longrightarrow \textbf{POTENTIAL FINDINGS} \longrightarrow \textbf{HUMAN TRIAGE} \longrightarrow \textbf{CONFIRMED BUGS} \longrightarrow \textbf{DEVELOPER HANDOFF} \longrightarrow \textbf{RETEST}$$

Testers and hackathon builders are never forced to manually explore or write bug reports to obtain value. ReleaseLens automatically crawls routes, inspects interactive elements, checks security and performance, and surfaces **Potential Findings** into a **Findings Inbox**. The human tester reviews evidence, confirms genuine bugs, hands structured reports to developers, retests fixes, and tracks release readiness via the **ReleaseLens Quality Index (RQI)**.

---

## 2. Core Functional Modules

| Module | Scope | Key Capabilities |
| :--- | :--- | :--- |
| **1. Automated Audit Engine** | Automate First | Discovers routes (up to 15 pages via Cloudflare Worker), tests navigation/links, probes TLS & security headers, and calls Google PageSpeed API. Output: `PASS`, `FAIL`, `NOT_RUN`, `INCONCLUSIVE`. |
| **2. Potential Findings Engine** | Triage Pipeline | Surfaces anomalies into the Findings Inbox: `DETECTED` $\to$ `NEEDS_REVIEW` $\to$ `CONFIRMED` $\mid$ `REJECTED` $\mid$ `DUPLICATE` $\mid$ `ACCEPTED_RISK`. Captures evidence, expected vs observed, reproduction draft, and confidence. |
| **3. Human Review Dashboard** | Tester Inbox | Triage UI for inspecting evidence, viewing console/network traces, reproducing issues, confirming bugs, rejecting false positives, or manually creating bugs. |
| **4. Confirmed Bug Tracker** | Defect Lifecycle | State machine: `OPEN` $\to$ `ACKNOWLEDGED` $\to$ `IN_PROGRESS` $\to$ `FIXED` $\to$ `RETEST_REQUIRED` $\to$ `VERIFIED` / `REOPENED`. Includes severity, telemetry, and retest history. |
| **5. Developer Handoff** | Actionable Reporting | Generates developer bug briefs with reproduction steps, screenshots, and actionable next steps. Shareable via permalinks and export to Markdown / JSON. |
| **6. Dual Reporting Engine** | Two Outputs | **Report A: Technical Audit Report** (Automated checks, coverage %, metrics, raw evidence).<br>**Report B: Human-Reviewed Defect Report** (Confirmed bugs only, severity distribution, developer handoff). |
| **7. Retest & Release Deltas** | Regression Tracking | Re-audit application, verify fixed bugs, compute Release Delta ($\Delta$): score changes, new broken links, new unreviewed findings. |
| **8. Tripartite RQI Engine** | Release Readiness | Independent Hard Gates (Security Gate + Confirmed Critical Bug Gate) + Tested Quality Score + Coverage %. Any unresolved confirmed critical bug blocks release (`RELEASE_BLOCKED`). |
| **9. Evidence AI Assistant** | Bug Synthesis | Read-only Gemini Flash assistant explaining technical logs and drafting developer bug briefs without hallucinating outcomes. |

---

## 3. Technology Stack & Zero-Spend Operating Model

- **Frontend & App Dashboard**: Next.js 15 (App Router, Tailwind CSS, Radix UI) hosted on **Vercel (Hobby Tier)**.
- **Database & Auth**: **Supabase (Free Tier)** PostgreSQL with Row-Level Security (RLS) and Google OAuth.
- **Link Crawler Engine (Tier 2)**: **Cloudflare Workers Free Plan** (100,000 requests/day, 10ms CPU limit, up to 50 subrequests).
- **Synthetic Performance Engine**: **Google PageSpeed Insights REST API** (25,000 requests/day free with API key).
- **Conversational AI Assistant**: **Google Gemini Flash API** via Google AI Studio Free Tier (15 RPM / 1,500 RPD).
- **Zero-Spend Safeguards**: Core services require no credit card and enforce hard rate limits (HTTP 429/402/1027). Per-user limits: 5 audits/day, 10 AI queries/hour.

---

## 4. Scope Governance & Deferred Capabilities

### Explicitly In Scope for MVP (v0.1.0)
- SaaS Web Application (Desktop browser + responsive mobile web).
- Modules 1 through 9 described above.
- Dual Reporting Engine (Technical Audit Report + Human-Reviewed Defect Report).

### Explicitly Deferred to Post-MVP (v0.2.0+)
- ⏳ Native desktop (Windows EXE, macOS DMG) and mobile (Android/iOS) apps.
- ⏳ Automated headless browser container runner on Cloud Run (deferred until container network egress firewalls are experimentally verified).
- ⏳ Two-way GitHub/Jira issue synchronization.
- ⏳ Continuous 24/7 background cron monitoring.
- ⏳ Autonomous AI testing agents.
