# Product Requirements Document (PRD) — ReleaseLens

> **Document Status**: `SYNCHRONIZED` / `AUTOMATE FIRST, HUMAN REVIEW SECOND`  
> **Last Synchronized**: 2026-11-03  
> **Target Release**: MVP v0.1.0  

---

## 1. Executive Summary & Core Paradigm

**ReleaseLens** is a cloud-hosted **Web Application Testing, Bug Discovery, Evidence Collection, and Release-Readiness Platform**.

It operates on a single unified workflow:
$$\textbf{ENTER URL} \longrightarrow \textbf{AUTOMATED AUDIT} \longrightarrow \textbf{POTENTIAL FINDINGS} \longrightarrow \textbf{HUMAN TRIAGE} \longrightarrow \textbf{CONFIRMED BUGS} \longrightarrow \textbf{DEVELOPER HANDOFF} \longrightarrow \textbf{RETEST}$$

Testers and hackathon builders are **not required to manually explore the website or write bug reports from scratch** to obtain actionable results. ReleaseLens automatically crawls routes, inspects buttons and forms, detects runtime console crashes and broken HTTP links, and surfaces **Potential Findings** into a **Findings Inbox** for human review. Once verified by a tester, findings convert into structured, developer-ready bug reports.

---

## 2. The Seven Core Workflow Modules

### Module 1: Automated Audit & Discovery (Automate First)
When a user submits a project URL (including `*.vercel.app` preview environments):
- **Page & Route Discovery**: Crawls internal links up to 15 pages via isolated Cloudflare Worker.
- **Interactive Element Inspection**: Identifies buttons, links, forms, and inputs.
- **Runtime Error Sniffer**: Detects unhandled JavaScript console exceptions and 4xx/5xx network failures.
- **Security & Availability Probes**: Validates TLS certificate, HTTPS enforcement, and security headers (CSP, HSTS, X-Frame-Options).
- **Performance & Vitals**: Google PageSpeed Insights REST API generates Core Web Vitals and Lighthouse metrics.
- **Standard Check States**: Every check resolves to strictly `PASS`, `FAIL`, `NOT_RUN`, or `INCONCLUSIVE`.

### Module 2: Potential Findings Engine
Automated checks do NOT create confirmed bugs directly. Instead, they populate the project's **Findings Inbox**.
- **Finding States**: `DETECTED` $\to$ `NEEDS_REVIEW` $\to$ `CONFIRMED` $\mid$ `REJECTED` $\mid$ `DUPLICATE` $\mid$ `ACCEPTED_RISK`.
- **Finding Data Contract**:
  - Description & Affected URL.
  - Test that produced the finding (e.g. `LinkCrawler`, `ConsoleTrap`, `SecurityProbe`).
  - Expected vs. Observed behavior.
  - Evidence (status code, console log snippet, network trace, screenshot where available).
  - Reproduction instructions (auto-generated draft).
  - Recommended severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
  - Confidence rating (`HIGH`, `MEDIUM`, `LOW`) and known test oracle limitations.

### Module 3: Human Review Dashboard (Findings Inbox)
A dedicated triage inbox where testers can:
- Inspect technical evidence and failure traces.
- Reproduce the issue independently in their browser.
- **Confirm as Bug**: Converts the finding into an official tracked Bug Report.
- **Reject**: Dismisses false positives or intentional design quirks with tester rationale.
- **Mark as Duplicate / Accepted Risk**: Triage without cluttering the defect list.
- **Manual Bug Creation**: Optional button allowing testers to log issues the automated crawler missed.

### Module 4: Confirmed Bug Lifecycle
Confirmed bugs enter the official project defect tracker with a full state machine:
$$\textbf{OPEN} \longrightarrow \textbf{ACKNOWLEDGED} \longrightarrow \textbf{IN\_PROGRESS} \longrightarrow \textbf{FIXED} \longrightarrow \textbf{RETEST\_REQUIRED} \longrightarrow \textbf{VERIFIED} \text{ (or } \textbf{REOPENED}\text{)}$$
- Full support for reproduction steps, expected/actual outcomes, severity, environment telemetry, developer notes, and retest verification history.

### Module 5: Optional Deep Testing Configuration
- Authorized users can configure dedicated test accounts and test role parameters for authenticated flows.
- Extends the same automated pipeline rather than creating a separate product.
- Test credentials are encrypted at rest and strictly excluded from logs, screenshots, and AI inputs.

### Module 6: Dual Reporting Engine
Every completed audit run produces two distinct, downloadable/shareable reports:
1. **Report A: Technical Audit Report**:
   - Checks executed, passed, failed, inconclusive, and untested counts.
   - Core Web Vitals and technical metrics.
   - Audit coverage percentage and test limitations.
2. **Report B: Human-Reviewed Defect Report**:
   - Confirmed bugs only.
   - Severity distribution (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
   - Detailed reproduction instructions and screenshots for developers.
   - Retest verification status.

### Module 7: Tripartite RQI (Release Quality Index)
- **Hard Release Gates** (`PASS`, `FAIL`, `NOT_RUN`, `INCONCLUSIVE`):
  - `GATE_SECURITY`: TLS validity, HTTPS enforcement, Clickjacking protection.
  - `GATE_FUNCTIONAL`: Unresolved `CONFIRMED` critical bugs or fatal broken routes immediately trigger `FAIL`.
  - *If ANY Hard Gate is `FAIL`, the release verdict is unconditionally **`RELEASE_BLOCKED`**.*
- **Tested Quality Score ($S_{\text{quality}}$)**: 0–100 score across automated checks minus confirmed bug deductions.
- **Release Verdicts**:
  - `VERIFIED_READY`: All Hard Gates PASS, zero unreviewed findings, zero confirmed critical bugs, coverage $= 100\%$, quality $\ge 85$.
  - `PROVISIONAL_PASS`: No blockers detected, but unreviewed findings exist OR coverage $< 100\%$.
  - `REVIEW_REQUIRED`: Inconclusive gates or high-severity unconfirmed findings.
  - `RELEASE_BLOCKED`: Any Hard Gate FAILS or quality $< 70$.
