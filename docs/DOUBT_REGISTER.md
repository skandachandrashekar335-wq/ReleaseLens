# Master Doubt & Workflow Register — ReleaseLens

> **Status**: `SYNCHRONIZED` / `RESET TO TESTING & BUG DISCOVERY PLATFORM`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Master Register Summary

| ID | Category | Question / Uncertainty | Risk | Resolution | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DBT-001** | Product | Core identity and differentiation? | Critical | Web Application Testing, Bug Discovery, Evidence Collection, and Release-Readiness Platform. Combines automated audits with manual exploratory bug logging and retest verification. | `CONFIRMED (ADR-021)` |
| **DBT-002** | Product | Application delivery format? | High | Responsive cloud-hosted SaaS web app (Desktop browsers + responsive mobile web). Native desktop/mobile apps deferred. | `CONFIRMED` |
| **DBT-003** | Cloud Infra | Safe ₹0 execution without Vercel/GitHub AUP violations? | Critical | Vercel hosts Next.js UI/API; Cloudflare Worker runs Tier 2 link crawler; Google PageSpeed API runs lab vitals. Zero credit card required. | `VALIDATED (ADR-018)` |
| **DBT-004** | Security | Browser worker network isolation & spend caps? | Critical | Tier 3 headless browser worker deferred to Post-MVP (v0.2.0) until live container network egress firewall is experimentally verified. Eliminates security and billing risks for MVP. | `DEFERRED TO v0.2.0` |
| **DBT-005** | RQI Scoring | Integrating automated and manual findings into release readiness? | Critical | Tripartite Governance: Independent Hard Gates (Security + Critical Bug) + Tested Quality Score + Coverage %. Unresolved critical bugs immediately trigger `RELEASE_BLOCKED`. | `VALIDATED (ADR-020)` |
| **DBT-006** | Manual Testing | Bug logging structure and lifecycle? | High | Structured bug logger with steps to reproduce, expected vs actual, telemetry, and evidence. 7-state lifecycle: `OPEN` $\to$ `ACKNOWLEDGED` $\to$ `IN_PROGRESS` $\to$ `FIXED` $\to$ `RETEST_REQUIRED` $\to$ `VERIFIED` / `REOPENED`. | `CONFIRMED` |
| **DBT-007** | AI Assistant | AI assistant scope and safety? | Critical | Read-only, toolless Gemini Flash assistant summarizing technical logs and drafting developer bug briefs without hallucinating outcomes. | `VALIDATED (ADR-017)` |
| **DBT-008** | Cloud DB | 500MB Supabase storage management? | Medium | Tiered retention: Metrics, deductions, and bug reports kept permanently (<5KB/run). Base64 images stripped; raw PageSpeed JSON pruned after 7 days. | `VALIDATED (ADR-010)` |
