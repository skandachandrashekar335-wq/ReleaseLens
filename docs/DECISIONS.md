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
| **ADR-012** | Defense-in-Depth SSRF & Anti-Rebinding Architecture | 2026-11-03 | `ACCEPTED` |
| **ADR-013** | Dual-Metric RQI Model: Multiplicative Coverage Formula | 2026-11-03 | `SUPERSEDED by ADR-016` |
| **ADR-014** | Decoupled Worker Strategy: Native Serverless Crawler + Cloud Run Headless Worker | 2026-11-03 | `ACCEPTED` |
| **ADR-015** | Browser Network Security via Playwright Universal Route Interception | 2026-11-03 | `ACCEPTED` |
| **ADR-016** | Tripartite RQI Governance: Hard Release Gates + Tested Quality + Coverage % | 2026-11-03 | `ACCEPTED` |
| **ADR-017** | Deterministic PII / Secret Scrubbing & Delimited AI Prompt Isolation | 2026-11-03 | `ACCEPTED` |

---

## ADR-014: Decoupled Worker Strategy: Native Serverless Crawler + Cloud Run Headless Worker

### Context
GitHub Actions was evaluated in ADR-011 as a free runner. However, rigorous examination reveals:
1. GitHub Actions Acceptable Use Policy prohibits using actions as a public multi-tenant SaaS computing backend.
2. Billing-minute rounding consumes full minutes for short 15-second jobs.
3. Queue latencies (15–60s) degrade interactive dashboard responsiveness.

### Decision
1. **Tier 1 (Public Probes) & Tier 2 (Internal Link Crawler)**: Implemented natively in Node.js within Vercel Serverless Functions. Crawling 15 pages via `fetch` + `cheerio` executes in $<1.5$ seconds with zero Chromium binary overhead.
2. **Tier 3 (Headless Browser & Auth Verifications)**: Executed in an isolated container runner on **Google Cloud Run** free tier (2M requests/mo, 360,000 vCPU-seconds/mo free) or user-configured endpoint.

### Consequences
- **Positive**: 100% compliant with provider terms; zero AUP risk; instant link audits on Vercel; true container isolation on Cloud Run.

---

## ADR-015: Browser Network Security via Playwright Universal Route Interception

### Context
Pinning socket connections in the parent Node process does not prevent untrusted JavaScript running inside a headless Chromium page from issuing background fetches, WebSockets, or iframes to internal cloud metadata (`169.254.169.254`) or loopback services.

### Decision
Enforce network containment inside Playwright using `page.route('**/*')`:
- Every request (navigation, script, stylesheet, image, fetch, XHR, iframe, websocket) is intercepted.
- Destination URL protocol, port (80/443 only), and resolved IP address are validated against the private/metadata IP blacklist before `route.continue()`.
- Service workers, file downloads, and device access are disabled at the browser context level.

---

## ADR-016: Tripartite RQI Governance: Hard Release Gates + Tested Quality + Coverage %

### Context
The previous multiplicative formula ($RQI = S_{\text{tested}} \times (0.5 + 0.5 \times C)$) assigned a 50% score to an audit with zero coverage, and allowed a 100% performance score to mask critical security defects.

### Decision
Adopt **Tripartite RQI Governance**:
1. **Independent Hard Release Gates (Pass/Fail)**:
   - Security Gate (TLS valid, HTTPS enforced, Clickjacking protected).
   - Functional Gate (Zero page-crashing JS errors).
   - Auth Gate (OAuth contract intact, callback route valid).
   *If ANY Hard Gate fails, Release Verdict is immediately `RELEASE_BLOCKED`, regardless of numerical quality.*
2. **Tested Quality Index ($S_{\text{quality}}$)**: 0–100 weighted score calculated strictly over executed categories.
3. **Audit Coverage ($C_{\text{audit}}$)**: 0–100% evaluated test surface.

---

## ADR-017: Deterministic PII / Secret Scrubbing & Delimited AI Prompt Isolation

### Context
Inspected website logs, HTML snippets, and error traces may contain sensitive tokens, passwords, or malicious prompt injection instructions intended to manipulate the conversational AI assistant into falsely reporting release readiness.

### Decision
1. Deterministic regex scrubbing strips Bearer tokens, JWTs, API keys, password query parameters, and session cookies before storage or AI ingestion.
2. Audit evidence is passed to Google Gemini Flash API inside delimited boundary tags (`<audit_payload>`) with explicit system instructions treating external logs as untrusted raw text data.
