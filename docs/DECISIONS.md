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

---

## ADR-001: Documentation Governance as a Continuous Engineering Requirement
*See initial baseline.* Enforces continuous synchronization of all documentation with actual repository reality.

---

## ADR-002: Deterministic Mathematical Foundation for RQI Scoring
*Updated context.* RQI (Release Quality Index) is a 0–100 score evaluating website quality across Performance, Accessibility, Security/Headers/SSL, Functional Integrity (e.g. Console errors, broken links, auth flows), and SEO/Best Practices. AI provides evidence-backed explanations but cannot fabricate or arbitrarily override the quantitative index.

---

## ADR-003: Multi-Audience Synthesis Separation
*Updated context.* Audit reports generate distinct perspectives: Technical/Engineering (Lighthouse metrics, console traces, network payload errors), Product (readiness, UX usability, broken user journeys), and Executive (overall RQI score, release risk verdict).

---

## ADR-004: Cloud Worker Architecture for Dynamic Smoke Verification
*Updated context.* All inspections run entirely in cloud-hosted environments. No machine-local execution, local CLI, or local browser instances.

---

## ADR-005: Pivot to Cloud-Hosted Website Quality & Intelligence Platform

### Context
Initial exploration considered Git diff review. The confirmed core product requirement is a **cloud-based website quality auditing and intelligence platform** where users register websites (including `.vercel.app` domains), run automated cloud inspections, track historical quality, and query an evidence-backed conversational AI assistant.

### Decision
Pivot all architecture, models, workflows, and specifications to cloud-based website auditing. Git/source-code integration is optional and deferred.

---

## ADR-006: Zero-Spend Architecture (₹0 Budget) using Free-Tier Cloud Services

### Context
Target budget is explicitly ₹0. The platform cannot rely on paid infrastructure or assume unlimited free quotas.

### Decision
Leverage verified generous free-tier services:
- **Hosting & Compute**: Vercel (Hobby plan) or Cloudflare Pages.
- **Database & Auth**: Supabase (Free tier: 500MB DB, Google OAuth, Row Level Security) or Neon Serverless Postgres.
- **AI Model & Embeddings**: Google Gemini API (Free tier: 15 RPM for Gemini 1.5 Flash / 2.0 Flash) or Groq free tier.
- **Auditing Engine**: Cloud-executed PageSpeed Insights API (Free Google API quota: 25,000 queries/day) combined with serverless worker HTTP/SSL/header inspectors, and serverless Playwright/Puppeteer workers within free execution budgets.

---

## ADR-007: Strict Three-Tier Authorization Model (Public vs Verified vs Authenticated)

### Context
Allowing arbitrary users to input any URL and run deep or intrusive functional/authenticated checks poses severe legal, ethical, and denial-of-service risks against third-party websites.

### Decision
Enforce a 3-tier testing boundary:
1. **Tier 1 (Public Inspection)**: Non-intrusive public scans (HTTP headers, SSL certificate, Lighthouse/Core Web Vitals, public HTML accessibility, robots.txt). Available for any valid public URL.
2. **Tier 2 (Verified Ownership Inspection)**: Deep crawl, broken link checks, form discovery, load stress checks. Requires proof of ownership via DNS TXT record or HTML meta tag / verification file (e.g., `/.well-known/releaselens-verify.txt`).
3. **Tier 3 (Authenticated Testing)**: Testing behind login (e.g., verifying Google Sign-In or username/password flows). Strictly requires verified ownership + explicitly configured test credentials in encrypted storage.
