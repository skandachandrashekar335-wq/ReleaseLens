# ReleaseLens

> **Cloud-Hosted Web Application Testing, Bug Discovery, Evidence Collection & Release-Readiness Platform**  
> **Status**: `IMPLEMENTED` &bull; `TESTED` &bull; `EXPERIMENTALLY_VERIFIED`

---

## 1. Project Overview & Mission

**ReleaseLens** is purpose-built to empower testers, QA engineers, and hackathon builders to test web applications, discover and log bugs with rich evidence, generate developer-ready reports, verify fixes through retesting, and track release readiness with the **ReleaseLens Quality Index (RQI)**.

### The Unified QA & Developer Handoff Workflow
1. **Automate First**: Enter target application URL (including ephemeral Vercel/Netlify preview deployments).
2. **Autonomous Cloud Audits**: Inspect TLS certificate validity, enforce strict security headers (CSP, HSTS, XFO), crawl internal routes (up to 15 pages) for broken links, and measure Core Web Vitals via PageSpeed Insights.
3. **Findings Inbox Triage**: Raw anomalies land in a triage inbox in `NEEDS_REVIEW`. Human testers confirm real bugs, eliminate false positives, or accept business risk.
4. **Active Defect Inventory**: Confirmed bugs enter the verified defect tracker with reproduction steps, expected vs. actual behavior, and technical evidence.
5. **Retest Lifecycle**: Re-verify bugs through verification cycles (`OPEN` $\to$ `FIXED` $\to$ `VERIFIED` $\mid$ `REOPENED`).
6. **Tripartite RQI Governance (ADR-020 & ADR-023)**: Gated by two independent hard gates (`GATE_SECURITY` and `GATE_FUNCTIONAL`). Active critical bugs immediately trip the functional gate and block release.
7. **Developer Handoff Permalinks**: Generate shareable permapages and one-click copyable markdown for GitHub Issues or Linear.
8. **Evidence AI Assistant**: Read-only Gemini Flash assistant strictly grounded in captured audit telemetry without hallucination.

---

## 2. Quickstart & Local Execution

ReleaseLens has **zero machine-local dependencies** (no local database daemon, no local browser process).

```bash
# 1. Install dependencies
pnpm install

# 2. Run unit & integration test suite (Vitest)
pnpm test

# 3. Create production build (Next.js 15 App Router)
pnpm build

# 4. Start local development server
pnpm dev
# Open http://localhost:3000
```

---

## 3. Architecture & Tech Stack

| Layer | Technology | Operational Role | Cost Model |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js 15.5 (App Router) + React 19 | Serverless frontend, API routes & SSR | Vercel Free Tier ($0) |
| **Styling** | Tailwind CSS 3.4 + Lucide Icons | Dark Luxury aesthetic (`v0-optimus-delta` inspired) | Open Source |
| **Testing** | Vitest 3.2.7 (32 tests in 10 suites) | Unit, integration, SSRF & browser test suite | Local & CI ($0) |
| **Browser Worker** | Playwright Headless Chromium + SSRF Guard | Dynamic DOM exploration, console error & 4xx/5xx tracking | Free Tier ($0) |
| **Crawler & TLS** | Node.js TLS Socket + Cheerio | Cloud-native bounded socket & route crawler | Native Serverless ($0) |
| **Performance** | Google PageSpeed Insights REST API | Core Web Vitals & Lighthouse lab measurements | Free Tier (25k req/day, $0) |
| **AI Copilot** | Google Gemini 1.5 Flash via Generative AI SDK | Read-only grounded evidence reasoning | Google AI Studio Free Tier ($0) |
| **Persistence** | Embedded SQLite (`node:sqlite`) + Supabase RLS Migration | Zero-daemon persistent storage surviving reboots | Free Tier ($0) |

---

## 4. Key Application Routes

- `/` — Public marketing landing page with instant live URL auditing.
- `/dashboard` — Workspace overview of registered applications and preview deployments.
- `/projects/[id]` — Project detail view with live RQI dial, hard gates status, and checks list.
- `/projects/[id]/findings` — Findings Inbox triage queue with filters.
- `/projects/[id]/bugs` — Verified defect tracker with lifecycle state management and retest verification.
- `/projects/[id]/deltas` — Release Delta comparative regression analysis.
- `/reports/[token]` — Standalone public developer handoff report permalink.

---

## 5. Documentation System

All architectural decisions and specifications are continuously synchronized:

- [docs/PROJECT_SPEC.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/PROJECT_SPEC.md) — Final confirmation-ready MVP specification.
- [docs/PRD.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/PRD.md) — Product requirements and user journeys.
- [docs/ARCHITECTURE.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/ARCHITECTURE.md) — Decoupled cloud architecture and provider topology.
- [docs/DATA_MODEL.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/DATA_MODEL.md) — Entity-relationship schema for projects, audits, bugs, and evidence.
- [docs/API_CONTRACTS.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/API_CONTRACTS.md) — REST endpoints, payloads, and AI assistant schemas.
- [docs/RQI_SCORING.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/RQI_SCORING.md) — Tripartite RQI formulas combining automated checks and manual bug severity.
- [docs/TEST_STRATEGY.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/TEST_STRATEGY.md) — Empirical verification and test matrix.
- [docs/TEST_RESULTS.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/TEST_RESULTS.md) — Verified test execution logs (`TESTED`, 10/10 passed).
- [docs/SECURITY.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/SECURITY.md) — Domain verification, SSRF defense, and data boundaries.
- [docs/DECISIONS.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/DECISIONS.md) — Architecture Decision Records (ADR-001 through ADR-023).
- [docs/CHANGELOG.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/CHANGELOG.md) — Complete release changelog.
