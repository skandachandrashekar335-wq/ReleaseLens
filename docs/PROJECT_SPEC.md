# Project Specification — ReleaseLens

> **Document Status**: `FINAL DRAFT FOR APPROVAL (ROUND 5)`  
> **Last Synchronized**: 2026-11-03  
> **Target Version**: MVP v0.1.0  

---

## 1. Product Summary & Problem Statement

**ReleaseLens** is a cloud-hosted website quality auditing and release intelligence platform. It replaces subjective, gut-feel deployment approvals with an objective, evidence-backed **ReleaseLens Quality Index (RQI)** score, automated regression tracking across deployments, and an evidence-grounded conversational AI assistant.

It solves three critical problems for developers and engineering teams:
1. **Unseen Deployment Regressions**: Deploying updates often silently breaks security headers, drops Core Web Vitals, or introduces broken internal links.
2. **Subjective Sign-Offs**: Teams lack a defensible release-readiness gating standard.
3. **Disjointed Audits**: Developers currently have to run Lighthouse, SSL Labs, SecurityHeaders, and DevTools separately; ReleaseLens correlates them into a unified release delta ($\Delta$).

---

## 2. Target Personas & Primary Workflows

### Primary Personas
- **Solo Developers & Indie Founders**: Shipping rapid deployments on Vercel/Netlify; need a fast, 1-click pre-flight release check before promoting staging to production.
- **Tech Leads & QA Engineers**: Managing multiple client or product websites; need release sign-off documentation, historical trendlines, and regression tracking.

### Primary User Journey (MVP)
1. **Sign-In**: User signs in via Google OAuth (powered by Supabase Auth).
2. **Onboard Website**: Registers a target URL (e.g. `https://myapp.vercel.app` or custom domain).
3. **Instant Tier 1 Public Scan**: Immediate execution of passive probes (SSL, security headers, Google PageSpeed lab vitals). Results and provisional RQI displayed in $<5$ seconds.
4. **Ownership Verification (Optional / Unlock Tier 2)**: User adds `<meta name="releaselens-verification" content="...">` or `/.well-known/releaselens-verify.txt` to their site.
5. **Tier 2 Deep Inspection**: Automated internal link crawl (detects 404s/broken links across up to 15 pages via isolated Cloudflare Worker).
6. **Release Delta ($\Delta$) & Historical Inspection**: View comparative regressions against previous runs (RQI delta, newly missing headers, performance shifts).
7. **Evidence AI Assistant**: User opens the side drawer and asks natural language questions (*"Why is my RQI only 74?"* or *"Did the security headers pass?"*), receiving truthful answers backed strictly by recorded audit logs.

---

## 3. Strict Operating & Cost Boundaries

- **100% Cloud-Hosted**: Zero local machine prerequisites (no local SQLite, no local Docker, no machine-local Playwright).
- **100% Guaranteed ₹0 Budget (Zero Credit Card Required)**:
  - Frontend & API: Vercel (Hobby Tier).
  - Database & Auth: Supabase (Free Tier, 500MB DB).
  - Performance Lab Engine: Google PageSpeed Insights REST API (25,000 queries/day free with API key).
  - Crawler Engine (Tier 2): Cloudflare Workers Free Tier (100,000 requests/day).
  - AI Assistant: Google Gemini Flash API via Google AI Studio (15 RPM / 1,500 RPD free tier).
  - **No Paid Upgrades**: Every provider enforces hard stops (HTTP 429/402/1027); zero risk of unexpected billing.
- **Per-User Quotas**:
  - Max 5 audits per day per user account.
  - Max 10 AI assistant questions per hour per user account.

---

## 4. MVP Feature Boundaries

### In Scope for MVP (v0.1.0)
- [x] Google OAuth sign-in and user session management (Supabase Auth).
- [x] Website registration (custom domains and `*.vercel.app` staging URLs).
- [x] Ownership verification via HTML `<meta>` tag and `/.well-known/releaselens-verify.txt`.
- [x] **Tier 1 Public Audits**:
  - TLS/SSL validity and expiration.
  - HTTP Security Headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
  - Core Web Vitals & Lighthouse Scores via Google PageSpeed API (Performance, a11y, Best Practices, SEO).
  - Mobile viewport, robots.txt, and metadata sanity.
- [x] **Tier 2 Verified Audits**:
  - Multi-page internal link crawl (detects broken 404/500 routes up to 15 pages via Cloudflare Worker).
- [x] **Tripartite RQI Governance Model**:
  - Independent Hard Release Gates (`PASS`, `FAIL`, `NOT_RUN`, `INCONCLUSIVE`).
  - Tested Quality Score ($S_{\text{quality}}$: 0–100).
  - Audit Coverage ($C_{\text{audit}}$: 0–100%).
  - Verdicts: `VERIFIED_READY`, `PROVISIONAL_PASS`, `REVIEW_REQUIRED`, `RELEASE_BLOCKED`.
- [x] **Release Delta ($\Delta$) & Historical Analytics**:
  - Historical audit comparison within environment tags (`PRODUCTION` vs `PREVIEW`).
  - Statistically significant regression detection ($\Delta > 5$ pts or vital drop $>15\%$).
- [x] **Evidence-Grounded Conversational AI Assistant**:
  - Read-only, toolless assistant answering queries strictly from recorded audit evidence.
  - Deny-by-default data sanitization (removes cookies, auth headers, and query parameters).
  - Delimited prompt boundary defense against prompt injection.

### Explicitly Deferred to Post-MVP (v0.2.0+)
- ⏳ **Tier 3 Headless Browser Execution (Cloud Run)**: Deferred until live container network egress firewalls (`iptables` WebRTC/UDP drop) and spend-cap controls are experimentally verified.
- ⏳ Multi-user team organizations / RBAC.
- ⏳ Automated scheduled cron audits (to preserve free quotas).
- ⏳ CI/CD Webhook gating integration.
- ⏳ Source code / Git diff integration.

---

## 5. Security & Privacy Guarantees

1. **URL Submission Is NOT Authorization**:
   - Submitting an unverified URL allows strictly passive Tier 1 scans.
   - Deep crawls (Tier 2) are blocked until ownership is proven via 256-bit cryptographic challenge.
2. **Deny-by-Default Data Collection**:
   - Only 6 allowlisted security headers are stored.
   - All cookies, authorization headers, and query parameters are stripped before persistence.
   - Zero form data or full DOM bodies are stored.
3. **AI Safety**:
   - The assistant has zero tool execution privileges.
   - External audit logs are treated as untrusted text within delimited `<untrusted_audit_evidence>` blocks.

---

## 6. Definition of Done for MVP

The MVP is complete only when:
1. All in-scope features work end-to-end against live target URLs.
2. The application runs strictly on the free-first cloud architecture with zero local machine dependencies.
3. Automated unit and integration test suites pass and results are recorded in `docs/TEST_RESULTS.md`.
4. Documentation across `docs/` remains 100% synchronized with actual code.
