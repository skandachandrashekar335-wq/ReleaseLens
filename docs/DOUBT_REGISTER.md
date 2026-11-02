# Master Doubt & Workflow Register — ReleaseLens

> **Status**: `VALIDATED ARCHITECTURE BASELINE (ROUND 3)`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Classification Overview

- **Group 1: Must Ask User** (Final product boundary confirmations).
- **Group 2: Agent Investigated & Validated** (Architecture, security, mathematical formulas, free-tier limits).
- **Group 3: Validate Experimentally** (Proof-of-concept benchmarks during initial setup).

---

## 2. Technical & Architectural Register (Updated)

| ID | Category | Uncertainty / Risk | Risk | Resolution | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DBT-001** | Product | On-demand release audits vs continuous scheduled crons? | High | On-demand release audits with regression deltas. Scheduled background monitoring excluded from MVP to preserve free-tier quotas. | `CONFIRMED DEFAULT` |
| **DBT-002** | Auth Test | Realistic verification of Google Sign-In without hitting anti-bot blocks? | Critical | 7-Level Auth Ladder: Levels 1–4 verify OAuth contract/redirect/callback reachability; Level 5 supports optional dedicated staging test identity. Real consumer Google login excluded due to Google anti-bot CAPTCHAs. | `VALIDATED (ADR-009)` |
| **DBT-003** | Cloud Infra | Browser worker architecture under strict ₹0 budget without AUP violation? | Critical | GitHub Actions rejected due to AUP multi-tenant risks. Native Serverless Crawler used for Tier 1 & 2 link checks; Google Cloud Run free tier container runner used for Tier 3 headless checks. | `VALIDATED (ADR-014)` |
| **DBT-004** | Security | Browser SSRF & subresource network containment? | Critical | Playwright `page.route('**/*')` intercepts all subresources, iframes, fetches, and WebSockets. Destination IP resolved and validated before connection. Local network bridging disabled. | `VALIDATED (ADR-015)` |
| **DBT-005** | Ownership | Preview URL verification on `*.vercel.app` without DNS access? | High | HTML `<meta name="releaselens-verification">` and `/.well-known/releaselens-verify.txt` in public directory. 256-bit cryptographic token with 7-day expiration and origin matching. | `VALIDATED` |
| **DBT-006** | RQI Scoring | Preventing incomplete scans from scoring 50% or masking security flaws? | Critical | Tripartite RQI Model: Independent Hard Release Gates (Pass/Fail) + Tested Quality Score (0–100) + Audit Coverage (0–100%). Any failed Hard Gate immediately yields `RELEASE_BLOCKED`. | `VALIDATED (ADR-016)` |
| **DBT-007** | AI Grounding | Preventing AI assistant hallucinations and prompt injection? | Critical | Strict bounded context: AI receives structured JSON evidence only inside `<audit_payload>` delimiters. Regex scrubbing removes PII and API keys prior to prompt construction. | `VALIDATED (ADR-017)` |
| **DBT-008** | Cloud DB | Supabase 7-day inactivity pause handling without artificial keep-alives? | Medium | Client-side health check detects paused database status and presents a clear "Database waking up, retrying..." banner rather than unhandled crash. | `VALIDATED` |
| **DBT-009** | PageSpeed | Incomplete coverage & CrUX null data on staging previews? | Medium | PageSpeed explicitly labeled as "Synthetic Lab Metrics". CrUX field data null state gracefully handled. Combined with native security header & link crawlers. | `VALIDATED` |
| **DBT-010** | Retention | Managing 500MB Supabase storage quota? | High | Tiered retention: Structured metrics & deductions kept permanently (<5KB/run). Base64 images stripped; raw Lighthouse JSON pruned after 7 days. | `VALIDATED (ADR-010)` |
| **DBT-011** | Score Jitter | Lighthouse score variation between consecutive runs? | Medium | Changes $\le 5$ points classified as natural lab variance. Regressions require $>5$ point drop, $>15\%$ Web Vital drop, newly introduced console crash, or failed Hard Gate. | `VALIDATED` |
