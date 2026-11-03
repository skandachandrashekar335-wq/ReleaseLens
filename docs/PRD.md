# Product Requirements Document (PRD) — ReleaseLens

> **Document Status**: `SYNCHRONIZED` / `FINAL DRAFT FOR APPROVAL (ROUND 5)`  
> **Last Synchronized**: 2026-11-03  
> **Target Release**: MVP v0.1.0  

---

## 1. Executive Summary

**ReleaseLens** is a cloud-hosted website quality auditing and release intelligence platform. It enables developers, engineering leads, and QA teams to register web applications (including preview/staging deployments on `*.vercel.app`), execute deep cloud quality audits across performance, accessibility, security headers, and link health, compute an objective **ReleaseLens Quality Index (RQI)**, track release regressions, and query an evidence-backed conversational AI assistant.

---

## 2. Core Constraints & Guiding Principles

1. **Pure Cloud-First (Zero Machine-Local Dependency)**:
   - No local database, no local Docker containers, and no machine-local Playwright runners.
   - All persistence, workers, and dashboard functions operate on cloud infrastructure.
2. **100% Guaranteed ₹0 Budget (Zero Credit Card Required)**:
   - Built exclusively on generous free-tier platforms that do not require credit cards and enforce hard stops on limits (Vercel, Supabase, Google PageSpeed API, Google AI Studio Gemini API, Cloudflare Workers).
3. **Rigorous Gating & Authorization Boundaries**:
   - Submitting a URL grants permission **only** for passive Tier 1 scans.
   - Tier 2 active crawling is strictly gated behind domain ownership verification (HTML `<meta>` tag or `/.well-known/releaselens-verify.txt`).
   - Tier 3 headless browser checks are deferred to v0.2.0 until network egress containment is experimentally verified.
4. **Evidence-Grounded AI Assistant**:
   - Strictly read-only and toolless. Answers queries using verified audit logs only, refusing to fabricate test outcomes.

---

## 3. Detailed MVP Feature Matrix

| Feature | Scope / Tier | Status | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **Google Sign-In** | Platform | `PLANNED` | Google OAuth via Supabase Auth; persists sessions securely. |
| **Website Management** | Platform | `PLANNED` | Add, view, edit, and delete registered domains with environment tags (`PRODUCTION` vs `PREVIEW`). |
| **Ownership Verification** | Platform | `PLANNED` | Validates 256-bit token via HTML `<meta>` tag or `/.well-known/releaselens-verify.txt` with origin matching. |
| **Tier 1 Public Audits** | Core Audit | `PLANNED` | TLS certificate validity/expiry, HTTP security headers, Google PageSpeed lab metrics, mobile viewport, robots.txt. |
| **Tier 2 Link Crawl** | Core Audit | `PLANNED` | Crawls up to 15 internal links via Cloudflare Worker; detects 404/500 routes. |
| **Tripartite RQI Model** | Intelligence | `PLANNED` | Computes Hard Release Gates, Tested Quality Score (0–100), and Audit Coverage %. |
| **Release Delta ($\Delta$)** | Analytics | `PLANNED` | Flags regressions (>5 pt drop, >15% Web Vital drop, newly missing header) against previous run. |
| **Conversational AI** | Intelligence | `PLANNED` | Read-only Gemini Flash assistant citing exact audit logs with delimited prompt isolation. |
| **Report Export** | Usability | `PLANNED` | Export audit summary as Markdown, JSON, or copyable permalink. |

---

## 4. Operational Quotas & Rate Limits

- **Per-User Quotas**: Max 5 audits per day; max 10 AI assistant questions per hour.
- **Provider Quota Ceilings**:
  - Vercel: 100,000 invocations / month.
  - Supabase: 500 MB database storage.
  - Google PageSpeed: 25,000 queries / day.
  - Cloudflare Workers: 100,000 requests / day.
  - Google Gemini Flash: 15 RPM / 1,500 RPD.
