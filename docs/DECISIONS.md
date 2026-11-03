# Architecture Decision Records (ADRs) — ReleaseLens

> **Document Status**: `SYNCHRONIZED`  
> **Last Synchronized**: 2026-11-03  

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
| **ADR-012** | Defense-in-Depth SSRF & Anti-Rebinding Architecture | 2026-11-03 | `SUPERSEDED by ADR-019` |
| **ADR-013** | Dual-Metric RQI Model: Multiplicative Coverage Formula | 2026-11-03 | `SUPERSEDED by ADR-020 & ADR-023` |
| **ADR-014** | Decoupled Worker Strategy: Native Serverless Crawler + Cloud Run Headless Worker | 2026-11-03 | `SUPERSEDED by ADR-018` |
| **ADR-015** | Browser Network Security via Playwright Universal Route Interception | 2026-11-03 | `SUPERSEDED by ADR-019` |
| **ADR-016** | Tripartite RQI Governance: Hard Release Gates + Tested Quality + Coverage % | 2026-11-03 | `SUPERSEDED by ADR-020 & ADR-023` |
| **ADR-017** | Deterministic PII / Secret Scrubbing & Delimited AI Prompt Isolation | 2026-11-03 | `ACCEPTED` |
| **ADR-018** | Decoupling Crawler from Vercel to Comply with Vercel Hobby Terms | 2026-11-03 | `ACCEPTED` |
| **ADR-019** | Two-Tier Browser Isolation: Kernel Egress Firewall + Playwright Interception | 2026-11-03 | `ACCEPTED` |
| **ADR-020** | Formal Four-State Hard-Gate Model (`PASS`, `FAIL`, `NOT_RUN`, `INCONCLUSIVE`) | 2026-11-03 | `ACCEPTED` |
| **ADR-021** | Product Direction Reset: Web Application Testing, Bug Discovery & Evidence Platform | 2026-11-03 | `SUPERSEDED by ADR-022` |
| **ADR-022** | Unified "Automate First, Human Review Second" Pipeline & Findings Triage Queue | 2026-11-03 | `ACCEPTED` |
| **ADR-023** | Separation of Automated Findings from Confirmed Defects in RQI Gating | 2026-11-03 | `ACCEPTED` |

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
