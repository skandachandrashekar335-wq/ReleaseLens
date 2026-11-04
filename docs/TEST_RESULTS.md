# Test Execution History & Verification Results — ReleaseLens

> **Document Status**: `EXPERIMENTALLY_VERIFIED`  
> **Rule**: Strict Status State Machine Compliance (AGENTS.md). Never fabricate test execution or results.  
> **Last Synchronized**: 2026-11-04  

---

## 1. Test Execution Log

| Date / Timestamp | Environment | Command Executed | Passed | Failed | Skipped | Status | Reference / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 2026-11-04 09:46 UTC | macOS / Node v24.21.0 | `pnpm build` | 21 routes | 0 | 0 | `TESTED` | Next.js 15.5.28 production build compiled all routes cleanly with zero type errors. |
| 2026-11-04 09:47 UTC | macOS / Vitest v3.2.7 | `pnpm test` | 32 | 0 | 0 | `TESTED` | 10 test suites passed in 2.28s across all core modules, workflows, and edge cases. |

---

## 2. Test Suite Inventory & Coverage

| Test Suite | File Path | Scope | Status | Execution Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **RQI Calculator & Hard Gates** | `tests/rqi-calculator.test.ts` | Tripartite RQI calculation, Security Gate tripping on expired TLS / HTTP, Functional Gate tripping on CRITICAL bugs, Coverage penalty | `TESTED` | 5/5 passed. Verified ADR-020 & ADR-023 mathematical correctness. |
| **Security Headers Inspector** | `tests/security-headers.test.ts` | HSTS, CSP, XFO, sniffing headers, Clickjacking protection detection | `TESTED` | 2/2 passed. Verified accurate header extraction and scoring. |
| **Findings Generator** | `tests/findings-generator.test.ts` | Converts crawler failures & missing security headers into `PotentialFinding` in `NEEDS_REVIEW` | `TESTED` | 1/1 passed. Verified "Automate First, Human Review Second" pipeline. |
| **Release Delta Analyzer** | `tests/delta-analyzer.test.ts` | Compares consecutive audit runs, identifies $\Delta$ RQI, score regressions, and newly broken links | `TESTED` | 2/2 passed. Verified regression and improvement detection. |
| **Database Persistence & Migrations** | `tests/db-persistence.test.ts` | Verifies persistent SQLite storage, table migrations, relational foreign keys, and survives process reboots | `TESTED` | 3/3 passed. Verified ADR-024 persistent storage engine. |
| **SSRF Guard & Network Perimeter** | `tests/ssrf-guard.test.ts` | Blocks private IPv4/IPv6, link-local, AWS/GCP cloud metadata (`169.254.169.254`), and DNS rebinding | `TESTED` | 6/6 passed. Verified ADR-025 defense-in-depth perimeter. |
| **Playwright Autonomous Browser Worker** | `tests/browser-worker.test.ts` | Headless Chromium execution, console error interception, 4xx/5xx network tracking, DOM exploration, screenshot generation | `TESTED` | 2/2 passed. Real Playwright browser worker executed. |
| **AI Assistant Security & Fallback** | `tests/ai-assistant.test.ts` | Redacts sensitive headers, auth tokens, passwords, cookies; returns deterministic structured summaries without API key | `TESTED` | 2/2 passed. Verified read-only evidence grounding and credential stripping. |
| **Failure Modes & Edge Cases** | `tests/failure-modes.test.ts` | Malformed URLs, non-HTTP protocols, unreachable DNS/TLS domains, non-existent entity queries, duplicate share tokens | `TESTED` | 5/5 passed. Verified fault tolerance and zero unhandled rejections. |
| **End-to-End Product Workflows** | `tests/api-workflows.test.ts` | Complete lifecycle: URL registration $\to$ automated audit $\to$ finding promotion $\to$ developer notes $\to$ retest $\to$ delta | `TESTED` | 4/4 passed. Full lifecycle integration validated. |

---

## 3. Production Build Verification

```
Route (app)                                 Size  First Load JS
┌ ○ /                                    4.14 kB         123 kB
├ ○ /_not-found                            994 B         103 kB
├ ƒ /api/assistant/chat                    155 B         103 kB
├ ƒ /api/auth/google                       155 B         103 kB
├ ƒ /api/auth/session                      155 B         103 kB
├ ƒ /api/bugs                              155 B         103 kB
├ ƒ /api/bugs/[id]                         155 B         103 kB
├ ƒ /api/bugs/[id]/retest                  155 B         103 kB
├ ƒ /api/findings                          155 B         103 kB
├ ƒ /api/findings/[id]                     155 B         103 kB
├ ƒ /api/projects                          155 B         103 kB
├ ƒ /api/projects/[id]                     155 B         103 kB
├ ƒ /api/projects/[id]/audit               155 B         103 kB
├ ƒ /api/reports/share                     155 B         103 kB
├ ƒ /api/reports/shared/[token]            155 B         103 kB
├ ○ /dashboard                           4.65 kB         119 kB
├ ƒ /projects/[id]                       8.92 kB         127 kB
├ ƒ /projects/[id]/bugs                  7.79 kB         123 kB
├ ƒ /projects/[id]/deltas                2.83 kB         109 kB
├ ƒ /projects/[id]/findings              6.05 kB         121 kB
└ ƒ /reports/[token]                     3.36 kB         122 kB
```

- Zero TypeScript compilation warnings or errors.
- Dynamic routes properly configured with server-side request parsing.
- Tailwind CSS styling and font variables compiled into production bundles.
