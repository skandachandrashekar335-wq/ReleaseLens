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
| **ADR-004** | Cloud Worker Architecture for Dynamic Smoke Verification | 2026-11-03 | `ACCEPTED` |
| **ADR-005** | Pivot to Cloud-Hosted Website Quality & Intelligence Platform | 2026-11-03 | `ACCEPTED` |
| **ADR-006** | Zero-Spend Architecture (₹0 Budget) using Free-Tier Cloud Services | 2026-11-03 | `ACCEPTED` |
| **ADR-007** | Strict Three-Tier Authorization Model (Public vs Verified vs Authenticated) | 2026-11-03 | `ACCEPTED` |
| **ADR-008** | Two-Tier Cloud Inspection Pipeline (API-Driven + Ephemeral Worker) | 2026-11-03 | `PROPOSED` |
| **ADR-009** | Safe Authentication Verification via OAuth Contract & Route Probing | 2026-11-03 | `PROPOSED` |
| **ADR-010** | Tiered Evidence Retention Strategy for 500MB Free Database Cap | 2026-11-03 | `PROPOSED` |

---

## ADR-008: Two-Tier Cloud Inspection Pipeline (API-Driven + Ephemeral Worker)

### Context
Running full headless Chromium (`@sparticuz/chromium`) inside a Vercel Hobby serverless function introduces severe risks: 50MB uncompressed size overhead, 4–8s cold boot times, and inevitable timeouts against Vercel's 10-second serverless execution ceiling.

### Decision
1. **Tier 1 (Public Scan)**: Executes entirely via Google PageSpeed Insights REST API + serverless HTTP fetch/TLS probes. Takes 2–4s total, completely avoiding headless browser overhead on Vercel.
2. **Tier 2 (Deep Checks) & Tier 3 (Auth Checks)**: Utilizes a decoupled execution runner (e.g., GitHub Actions free runner with 2,000 free minutes/month or an external serverless worker with a higher execution budget), triggering asynchronously via webhook/dispatch and reporting back upon completion.

### Consequences
- **Positive**: Eliminates HTTP 504 gateway timeouts on Vercel; stays strictly ₹0; maximizes reliability.
- **Trade-off**: Requires asynchronous polling or webhook callbacks for Tier 2/3 instead of a single synchronous HTTP request.

---

## ADR-009: Safe Authentication Verification via OAuth Contract & Route Probing

### Context
Google's security infrastructure aggressively blocks automated headless browsers on `accounts.google.com` with anti-bot detection ("This browser or app may not be secure"). Attempting to automate real password entry into Google accounts will consistently fail and violates Google Terms of Service. Furthermore, collecting real production passwords or user session cookies creates unacceptable security liabilities.

### Decision
Implement **OAuth Contract & Route Probing**:
1. **Client-Side SDK & Button Discovery**: Verify the presence of Google Identity Services (`https://accounts.google.com/gsi/client`) or valid OAuth buttons in the DOM.
2. **OAuth Contract Validation**: Inspect the OAuth initialization URL: assert valid `client_id`, `redirect_uri`, `response_type=code`, and approved `scope` parameters.
3. **Provider Endpoint Pre-flight**: Perform a server-side request to Google's authorization endpoint with the target client ID to confirm Google does NOT return `redirect_uri_mismatch` or `invalid_client`.
4. **Protected Route Probing**: Allow the user to specify an authenticated route (e.g. `/dashboard` or `/api/user`) and assert that unauthenticated requests return HTTP 401/403/Redirect, while test-session requests return HTTP 200.

### Consequences
- **Positive**: 100% technically reliable, complies with Google Terms of Service, never requires storing sensitive production passwords.
- **Trade-off**: Evaluates the contract, redirect validity, and session boundary rather than performing an end-to-end credential submission into Google's UI.

---

## ADR-010: Tiered Evidence Retention Strategy for 500MB Free Database Cap

### Context
Supabase Free Tier provides 500MB of PostgreSQL storage. A single Lighthouse audit JSON payload with base64 screenshots and full trace arrays can exceed 2–5MB. Storing 100 audits would consume the entire database quota.

### Decision
Implement **Tiered Evidence Retention**:
1. **Permanent Storage**: Metric summaries, RQI score breakdowns, deduction logs, deduplicated console error traces, and chat message history (average <5KB per audit).
2. **Stripped Payloads**: Raw Lighthouse screenshots (`data:image/...`) and verbose network timings are stripped prior to persistence.
3. **Ephemeral Cache**: Full JSON audit payloads are retained for 7 days, after which an automated cron cleans up raw JSON fields while preserving the RQI score and metric records permanently.

### Consequences
- **Positive**: Enables storing tens of thousands of release audits within the 500MB limit indefinitely.
- **Trade-off**: Granular raw network waterfalls older than 7 days are pruned.
