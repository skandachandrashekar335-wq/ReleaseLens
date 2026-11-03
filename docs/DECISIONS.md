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
| **ADR-004** | Cloud Worker Architecture for Dynamic Smoke Verification | 2026-11-03 | `SUPERSEDED by ADR-008 & ADR-014` |
| **ADR-005** | Pivot to Cloud-Hosted Website Quality & Intelligence Platform | 2026-11-03 | `ACCEPTED` |
| **ADR-006** | Zero-Spend Architecture (₹0 Budget) using Free-Tier Cloud Services | 2026-11-03 | `ACCEPTED` |
| **ADR-007** | Strict Three-Tier Authorization Model (Public vs Verified vs Authenticated) | 2026-11-03 | `ACCEPTED` |
| **ADR-008** | Two-Tier Cloud Inspection Pipeline (API-Driven + Ephemeral Worker) | 2026-11-03 | `ACCEPTED` |
| **ADR-009** | Safe Authentication Verification via OAuth Contract & Route Probing | 2026-11-03 | `ACCEPTED` |
| **ADR-010** | Tiered Evidence Retention Strategy for 500MB Free Database Cap | 2026-11-03 | `ACCEPTED` |
| **ADR-011** | Hybrid Headless Runner: GitHub Actions Dispatch | 2026-11-03 | `REJECTED (AUP compliance & billing rounding)` |
| **ADR-012** | Defense-in-Depth SSRF & Anti-Rebinding Architecture | 2026-11-03 | `SUPERSEDED by ADR-019` |
| **ADR-013** | Dual-Metric RQI Model: Multiplicative Coverage Formula | 2026-11-03 | `SUPERSEDED by ADR-016 & ADR-020` |
| **ADR-014** | Decoupled Worker Strategy: Native Serverless Crawler + Cloud Run Headless Worker | 2026-11-03 | `SUPERSEDED by ADR-018` |
| **ADR-015** | Browser Network Security via Playwright Universal Route Interception | 2026-11-03 | `SUPERSEDED by ADR-019` |
| **ADR-016** | Tripartite RQI Governance: Hard Release Gates + Tested Quality + Coverage % | 2026-11-03 | `SUPERSEDED by ADR-020` |
| **ADR-017** | Deterministic PII / Secret Scrubbing & Delimited AI Prompt Isolation | 2026-11-03 | `ACCEPTED` |
| **ADR-018** | Decoupling Crawler from Vercel to Comply with Vercel Hobby Terms | 2026-11-03 | `ACCEPTED` |
| **ADR-019** | Two-Tier Browser Isolation: Kernel Egress Firewall + Playwright Interception | 2026-11-03 | `ACCEPTED` |
| **ADR-020** | Formal Four-State Hard-Gate Model (`PASS`, `FAIL`, `NOT_RUN`, `INCONCLUSIVE`) | 2026-11-03 | `ACCEPTED` |

---

## ADR-018: Decoupling Crawler from Vercel to Comply with Vercel Hobby Terms

### Context
Vercel's Fair Use Guidelines and Terms of Service restrict the Hobby plan to personal and non-commercial websites. Automated crawling or scraping of third-party user-submitted URLs through Vercel Serverless Functions violates Vercel's fair use policy and triggers automated abuse detection and suspension.

### Decision
1. **Frontend Dashboard & API**: Hosted on Vercel Hobby (Next.js). Strictly handles UI rendering, user authentication, audit history display, and client-facing endpoints.
2. **Auditing & Crawling Engine**: Decoupled completely from Vercel. Runs within dedicated container workers on **Google Cloud Run** (`us-central1` free tier) or Cloudflare Workers.

---

## ADR-019: Two-Tier Browser Isolation: Kernel Egress Firewall + Playwright Interception

### Context
Playwright application-level route interception (`page.route`) does not intercept native WebRTC UDP connections or native socket rebinding. A compromised page or malicious script inside headless Chrome could probe internal cloud metadata (`169.254.169.254`) or local network resources.

### Decision
Enforce a two-tier perimeter:
1. **Infrastructure / Container Layer**: Linux `iptables` rules drop all outbound traffic to private subnets (RFC-1918), loopback, and cloud metadata (`169.254.169.254`). All outbound UDP traffic is blocked except port 53 (DNS), eliminating WebRTC leakage.
2. **Application / Playwright Layer**: `page.route('**/*')` restricts protocols to HTTP/HTTPS, restricts destination ports to 80/443, and disables service workers, downloads, and device permissions.

---

## ADR-020: Formal Four-State Hard-Gate Model (`PASS`, `FAIL`, `NOT_RUN`, `INCONCLUSIVE`)

### Context
Previously, `NOT_RUN` gates were ambiguously treated as passes during Tier 1 audits, allowing provisional passes to be confused with verified readiness. Furthermore, the 14-day TLS threshold was arbitrary.

### Decision
1. **Four States**: Every hard gate must resolve to one of `PASS`, `FAIL`, `NOT_RUN`, or `INCONCLUSIVE`.
2. **State Rules**:
   - `NOT_RUN` gates **never** count as `PASS`.
   - Any `FAIL` gate results in immediate **`RELEASE_BLOCKED`**, regardless of numerical quality score.
   - Any `INCONCLUSIVE` gate results in **`REVIEW_REQUIRED`**.
   - **`VERIFIED_READY`** requires all 3 gates to be `PASS`, with $S_{\text{quality}} \ge 85$ and $C_{\text{audit}} = 100\%$.
   - **`PROVISIONAL_PASS`** indicates no blockers were detected in executed checks, but explicitly states unrun gates remain unverified.
3. **Calibrated TLS Expiry**:
   - $\le 0$ days (Expired): `FAIL` (Hard Gate Blocker).
   - $1 \text{--} 2$ days (Imminent failure): `FAIL` (Hard Gate Blocker).
   - $3 \text{--} 14$ days: Non-blocking warning deduction (-5 pts).
   - $> 14$ days: `PASS`.
