# System Architecture — ReleaseLens

> **Document Status**: `SYNCHRONIZED`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Architectural Principles

1. **Pure Cloud-First**: Zero local machine prerequisites. No local database, local Docker daemon, or machine-local CLI required.
2. **Zero Spending (₹0 Budget)**: Architected exclusively on verified, free-tier cloud platforms:
   - **Frontend & Fullstack API**: Next.js deployed on Vercel (Hobby Tier).
   - **Database & Auth**: Supabase PostgreSQL with Row-Level Security (Free Tier: 500MB DB, Google OAuth included).
   - **Synthetic Performance & Core Web Vitals**: Google PageSpeed Insights REST API (Free: 25,000 queries/day).
   - **AI Assistant**: Google Gemini API (Free tier: 15 RPM for Gemini Flash, generous daily quota).
   - **Cloud Worker Headless Execution**: Serverless Edge/Node inspection workers or free-tier cloud browser runners.
3. **Rigorous Three-Tier Security Perimeter**: Public scans, verified ownership scans, and authenticated functional tests are strictly segregated.

---

## 2. Subsystem Architecture

### 2.1 Fullstack Next.js Web Application
- Server Components for fast rendering and minimal client bundle overhead.
- Server Actions & Route Handlers for orchestrating cloud inspections, authenticating requests, and storing audit runs.
- Supabase SSR Auth integration for seamless Google Sign-In and secure session cookies.

### 2.2 Domain Verification Subsystem
- Before any intrusive crawler or authenticated test is permitted, the user must prove domain ownership.
- Verification methods:
  - **Meta Tag**: `<meta name="releaselens-verification" content="rl_verify_token">`
  - **Well-Known File**: `/.well-known/releaselens-verify.txt` (Ideal for Vercel/Next.js preview deploys via `public/` directory).
  - **DNS TXT Record**: For apex custom domains.

### 2.3 Cloud Inspection Subsystem
- **HTTP / Security Headers**: Evaluates HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and TLS certificate expiry.
- **Performance & Usability**: Directly invokes the Google PageSpeed Insights API to obtain Lighthouse scores (Performance, Accessibility, Best Practices, SEO) and Core Web Vitals (LCP, FID/INP, CLS).
- **Console & Network Error Sniffer**: Crawls target URLs via serverless fetch/headless workers to intercept 4xx/5xx network errors and unhandled JavaScript exceptions.

### 2.4 Evidence-Backed AI Subsystem
- The AI assistant is conditioned with an **Evidence-Only System Prompt**.
- Queries retrieve the exact JSON payload of the specified `AuditRun` (metrics, logs, network failures).
- Prompt rule: *"If a test for X was not executed, state 'No test was executed for X'. Under no circumstances infer or assume the result."*
