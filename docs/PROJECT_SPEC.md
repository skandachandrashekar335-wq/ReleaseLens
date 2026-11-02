# Project Specification — ReleaseLens

> **Document Status**: `SYNCHRONIZED` / `DISCOVERY INTERVIEW IN PROGRESS`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Product Summary & Purpose
**ReleaseLens** is a cloud-based website quality auditing and release intelligence platform. It enables teams to register their deployed web applications (including `*.vercel.app` staging sites), execute cloud-hosted quality audits across performance, accessibility, security, and functional integrity, compute an objective **ReleaseLens Quality Index (RQI)** score, track historical quality deltas, and query an evidence-backed conversational AI assistant.

---

## 2. Hard Technical & Financial Constraints
- **Zero Local Footprint**: No local database, local Docker container, or local browser workers required.
- **₹0 Spend Target**: Built on generous, documented free-tier services (Vercel Hobby, Supabase Free Tier, Google PageSpeed API, Google Gemini API free tier).
- **Free Quota Awareness**: Rate limits, concurrency caps, and cold starts must be gracefully handled and communicated to users.
- **Ownership Gating**: Strict separation between public scans and authorized intrusive/authenticated tests.

---

## 3. Scope Boundaries

### Must-Have (MVP Scope)
- [ ] Google OAuth Sign-in for user accounts and audit persistence.
- [ ] Website Registration & Management (custom domains and `*.vercel.app` preview environments).
- [ ] Multi-Tier Inspection Engine:
  - **Tier 1 (Public)**: SSL certificate validation, HTTP security headers, Core Web Vitals (via Google PageSpeed API), robots/sitemap health.
  - **Tier 2 (Verified Ownership)**: Verification via meta-tag or `.well-known` token; automated broken link crawling, console error traps, DOM hydration check.
  - **Tier 3 (Authenticated Flows)**: Cloud worker execution of login flows (e.g. verifying Google Sign-In or test credential login).
- [ ] Deterministic RQI Scoring Engine (0–100) with explainable component weights.
- [ ] Evidence-Grounded Conversational AI Assistant: Answers questions based exclusively on recorded inspection logs, DOM snapshots, and network traces.
- [ ] Historical Quality Analytics: RQI trend graphs, regression highlights, and release-readiness indicators.

### Deferred / Future Scope
- ⏳ Direct GitHub/GitLab repository source code diff review (secondary signal, not required for MVP).
- ⏳ Automated scheduled cron audits (deferred to conserve free-tier quotas).
- ⏳ Multi-region latency testing.
