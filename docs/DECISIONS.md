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
| **ADR-004** | Cloud Worker Architecture for Dynamic Smoke Verification | 2026-11-03 | `SUPERSEDED by ADR-018 & ADR-021` |
| **ADR-005** | Pivot to Cloud-Hosted Website Quality & Intelligence Platform | 2026-11-03 | `SUPERSEDED by ADR-021` |
| **ADR-006** | Zero-Spend Architecture (₹0 Budget) using Free-Tier Cloud Services | 2026-11-03 | `ACCEPTED` |
| **ADR-007** | Strict Three-Tier Authorization Model (Public vs Verified vs Authenticated) | 2026-11-03 | `ACCEPTED` |
| **ADR-008** | Two-Tier Cloud Inspection Pipeline (API-Driven + Ephemeral Worker) | 2026-11-03 | `ACCEPTED` |
| **ADR-009** | Safe Authentication Verification via OAuth Contract & Route Probing | 2026-11-03 | `ACCEPTED` |
| **ADR-010** | Tiered Evidence Retention Strategy for 500MB Free Database Cap | 2026-11-03 | `ACCEPTED` |
| **ADR-011** | Hybrid Headless Runner: GitHub Actions Dispatch | 2026-11-03 | `REJECTED (AUP compliance & billing rounding)` |
| **ADR-012** | Defense-in-Depth SSRF & Anti-Rebinding Architecture | 2026-11-03 | `SUPERSEDED by ADR-019` |
| **ADR-013** | Dual-Metric RQI Model: Multiplicative Coverage Formula | 2026-11-03 | `SUPERSEDED by ADR-016 & ADR-020` |
| **ADR-014** | Decoupled Worker Strategy: Native Serverless Crawler + Cloud Run Headless Worker | 2026-11-03 | `SUPERSEDED by ADR-018 & ADR-021` |
| **ADR-015** | Browser Network Security via Playwright Universal Route Interception | 2026-11-03 | `SUPERSEDED by ADR-019` |
| **ADR-016** | Tripartite RQI Governance: Hard Release Gates + Tested Quality + Coverage % | 2026-11-03 | `SUPERSEDED by ADR-020` |
| **ADR-017** | Deterministic PII / Secret Scrubbing & Delimited AI Prompt Isolation | 2026-11-03 | `ACCEPTED` |
| **ADR-018** | Decoupling Crawler from Vercel to Comply with Vercel Hobby Terms | 2026-11-03 | `ACCEPTED` |
| **ADR-019** | Two-Tier Browser Isolation: Kernel Egress Firewall + Playwright Interception | 2026-11-03 | `ACCEPTED` |
| **ADR-020** | Formal Four-State Hard-Gate Model (`PASS`, `FAIL`, `NOT_RUN`, `INCONCLUSIVE`) | 2026-11-03 | `ACCEPTED` |
| **ADR-021** | Product Direction Reset: Web Application Testing, Bug Discovery & Evidence Platform | 2026-11-03 | `ACCEPTED` |

---

## ADR-021: Product Direction Reset: Web Application Testing, Bug Discovery & Evidence Platform

### Context
Previous iterations framed ReleaseLens primarily as an automated website quality auditor or PageSpeed wrapper. The true founder use case and market need is a **cloud-hosted Web Application Testing, Bug Discovery, Evidence Collection, and Release-Readiness Platform**, inspired by the active QA/tester role in hackathons and development teams. Testers explore applications, discover broken flows, buttons, and auth failures, capture evidence, hand structured reports to developers, retest fixes, and track release readiness.

### Decision
Reset and expand the product scope:
1. **Unify Automated & Manual Testing**:
   - Automated checks: Availability, TLS, security headers, broken links (via Cloudflare Worker), and performance (via Google PageSpeed API).
   - Manual exploratory testing: Structured bug logger with steps to reproduce, expected vs. actual behavior, severity, environment telemetry, and screenshots.
2. **Developer-Ready Handoff**: Generate structured, actionable bug reports with permalinks and export options.
3. **Verification & Retest Lifecycle**: Full state machine (`OPEN` $\to$ `ACKNOWLEDGED` $\to$ `IN_PROGRESS` $\to$ `FIXED` $\to$ `RETEST_REQUIRED` $\to$ `VERIFIED` / `REOPENED`).
4. **Tripartite RQI Integration**: Release readiness factors both automated check results and unresolved critical manual bugs.
5. **Read-Only AI Assistant**: Summarizes findings and prepares developer briefs strictly from real audit and bug evidence.

### Consequences
- **Positive**: Directly solves the real founder workflow; clearly differentiates ReleaseLens from generic scanners; creates high user retention.
- **Trade-off**: Requires building structured manual bug management and retest workflows alongside the automated audit engine.
