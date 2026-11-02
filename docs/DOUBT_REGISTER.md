# Master Doubt & Workflow Register — ReleaseLens

> **Status**: `ACTIVE DISCOVERY & ARCHITECTURAL SELF-AUDIT (ROUND 2)`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Classification Groups

- **Group 1: Must Ask User** (Product direction, MVP workflow boundaries, business models).
- **Group 2: Agent Investigated & Resolved** (Technical feasibility, security architecture, mathematical scoring formulas).
- **Group 3: Validate Experimentally** (Benchmarks, execution latency, free-tier edge cases).

---

## 2. Technical & Architectural Doubts (Updated)

| ID | Category | Question / Uncertainty | Risk | Type | Resolution / Decision | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DBT-001** | Product | On-demand release audits vs continuous monitoring? | High | Group 1 | On-demand release candidate audits with historical trendlines. Background crons burn free quotas. | `AWAITING USER` |
| **DBT-002** | Auth Test | Realistic verification of Google Sign-In without violating Google ToS or hitting anti-bot blocks? | Critical | Group 2 | **7-Level OAuth Probing**: Verify GSI SDK presence, Client ID syntax, authorization redirect URL params, callback route status (400 vs 500), and protected route auth gates. | `RESOLVED (ADR-009)` |
| **DBT-003** | Cloud Infra | How to run headless browser crawls without hitting Vercel 10s timeouts? | Critical | Group 2 | **Hybrid Execution**: Tier 1 on Vercel Serverless (PageSpeed API + native TLS); Tier 2/3 dispatched to GitHub Actions free runner (2,000 min/mo, 7GB RAM). | `RESOLVED (ADR-011)` |
| **DBT-004** | Security | Comprehensive SSRF & DNS rebinding defense? | Critical | Group 2 | **5-Layer Defense-in-Depth**: Protocol filter (80/443 only), full DNS check, IP blacklisting (RFC 1918 + metadata), socket-level IP pinning, and manual redirect inspection (max 5 hops). | `RESOLVED (ADR-012)` |
| **DBT-005** | Ownership | Preview URL verification on `*.vercel.app` without DNS access? | High | Group 1 | Support HTML `<meta>` tag and `/.well-known/releaselens-verify.txt` in public folder; DNS TXT available for apex domains. Challenges expire after 7 days; origin matching enforced. | `RECOMMENDED` |
| **DBT-006** | RQI Scoring | Preventing incomplete scans from generating misleading high scores? | High | Group 2 | **Dual-Metric Model**: Quality Score ($S_{\text{tested}}$) + Audit Coverage ($C_{\text{audit}}$) + Release Verdict (`VERIFIED_READY`, `PROVISIONAL_PASS`, `REVIEW_REQUIRED`, `RELEASE_BLOCKED`). | `RESOLVED (ADR-013)` |
| **DBT-007** | AI Assistant | Ensuring AI assistant never hallucinates test outcomes? | Critical | Group 2 | Strict bounded context: AI receives structured JSON evidence only. Negative assertion rule: missing/unrun checks explicitly state "Test NOT RUN". | `RESOLVED (ADR-007)` |
| **DBT-008** | Cloud DB | Supabase 7-day inactivity pause mitigation without artificial keep-alives? | Medium | Group 2 | Graceful handling: client health-check detects paused database state and displays a clear "Database waking up, retrying..." banner rather than unhandled crash. | `RESOLVED` |
| **DBT-009** | PageSpeed | Incomplete coverage & lab vs field data limitations in PageSpeed API? | Medium | Group 2 | PageSpeed only covers lab performance/a11y/SEO. CrUX field data is null on staging. We explicitly label PageSpeed as "Synthetic Lab Metrics" and combine it with our own native security header & console crawlers. | `RESOLVED` |
| **DBT-010** | Retention | Managing 500MB Supabase storage limit? | High | Group 2 | Tiered pruning: Permanent metrics & RQI (<5KB/run). Base64 screenshots stripped; raw Lighthouse JSON pruned after 7 days. | `RESOLVED (ADR-010)` |

---

## 3. Missing Product Workflows Evaluation Matrix

| Workflow | Proposed Phase | Classification | Handling Strategy |
| :--- | :--- | :--- | :--- |
| **1. Multiple users managing one website** | Post-MVP (v0.2.0) | `LATER ROADMAP` | Single user ownership for MVP. Data model includes `user_id`; multi-user organization RBAC deferred to avoid premature complexity. |
| **2. Ownership transfer & revocation** | MVP (v0.1.0) | `MUST-HAVE` | If verification token is removed during periodic check, website status automatically downgrades from `VERIFIED` to `PUBLIC`. Owner can delete site. |
| **3. Production vs Preview environments** | MVP (v0.1.0) | `MUST-HAVE` | Websites can be tagged as `PRODUCTION` or `PREVIEW` (e.g. `*.vercel.app`). Delta comparisons pair runs within the same environment tag. |
| **4. Audit cancellation** | MVP (v0.1.0) | `MUST-HAVE` | User can cancel queued or running audits via UI; sets audit status to `CANCELLED` and drops runner dispatch. |
| **5. Job retries & duplicate prevention** | MVP (v0.1.0) | `MUST-HAVE` | Idempotency key per audit trigger. Prevents duplicate simultaneous runs against the same target URL within a 60-second window. |
| **6. Partial audit failures** | MVP (v0.1.0) | `MUST-HAVE` | Handled via Dual-Metric RQI: failed/inconclusive checks reduce $C_{\text{audit}}$ coverage rather than crashing the entire evaluation. |
| **7. Timestamps & deployment identity** | MVP (v0.1.0) | `MUST-HAVE` | Every audit records exact UTC timestamp, target URL, and optional deployment label (e.g. Git commit SHA or Vercel deployment URL). |
| **8. Incompatible test configurations** | MVP (v0.1.0) | `MUST-HAVE` | Comparisons between different tiers (e.g. Tier 1 vs Tier 3) display a compatibility banner: *"Only Tier 1 common metrics compared"*. |
| **9. Report export & sharing** | MVP (v0.1.0) | `MUST-HAVE` | Export audit summary as Markdown, JSON, or copyable public permalink (read-only snapshot). |
| **10. Evidence retention & deletion** | MVP (v0.1.0) | `MUST-HAVE` | User can manually delete individual audit runs or entire website histories with permanent database cascade. |
| **11. User notifications** | Post-MVP (v0.2.0) | `LATER ROADMAP` | In-app visual alerts for MVP; email/Slack notifications deferred to avoid requiring third-party email API keys. |
| **12. API & webhook access** | Post-MVP (v0.2.0) | `LATER ROADMAP` | Webhook triggers for CI/CD pipeline gating deferred to v0.2.0. |
| **13. AI usage quotas** | MVP (v0.1.0) | `MUST-HAVE` | Per-user rate limit: 10 AI assistant queries per hour to prevent exhausting Google Gemini free-tier RPM/RPD limits. |
| **14. Provider outage handling** | MVP (v0.1.0) | `MUST-HAVE` | If PageSpeed API returns 429/503, the audit records `PageSpeed: UNAVAILABLE` and computes provisional RQI with reduced coverage. |
| **15. User account deletion** | MVP (v0.1.0) | `MUST-HAVE` | "Delete My Account" button triggers GDPR/privacy cascade: deletes all owned websites, audit records, and chat history. |
| **16. Project deletion** | MVP (v0.1.0) | `MUST-HAVE` | Deleting a website cascades and removes all associated verification tokens, audit runs, and chat sessions. |
| **17. Audit tamper resistance** | MVP (v0.1.0) | `MUST-HAVE` | Audit records are immutable once `status = COMPLETED`. HMAC signature included on exported JSON reports. |
