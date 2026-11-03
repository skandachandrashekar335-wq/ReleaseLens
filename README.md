# ReleaseLens

> **Cloud-Hosted Web Application Testing, Bug Discovery, Evidence Collection & Release-Readiness Platform**

---

## 1. Project Overview & Mission

**ReleaseLens** empowers testers, QA engineers, and hackathon builders to test web applications, discover and log bugs with rich evidence, generate developer-ready reports, verify fixes through retesting, and track release readiness with the **ReleaseLens Quality Index (RQI)**.

### The Unified QA & Developer Handoff Workflow
1. **Register Projects**: Support custom domains and ephemeral staging URLs (e.g. `*.vercel.app` preview deployments).
2. **Automated Bounded Audits**: Verify availability, TLS/HTTPS validity, security headers, internal broken links (up to 15 pages), and Core Web Vitals.
3. **Manual Exploratory Testing**: Log bugs with structured steps to reproduce, expected vs. actual behavior, severity, browser/device telemetry, and screenshot evidence.
4. **Developer-Ready Handoff**: Generate clean, actionable bug briefs with permalinks and export options so developers can fix issues immediately.
5. **Retest Lifecycle**: Track issues through `OPEN` $\to$ `ACKNOWLEDGED` $\to$ `IN_PROGRESS` $\to$ `FIXED` $\to$ `RETEST_REQUIRED` $\to$ `VERIFIED` (or `REOPENED`).
6. **Release Deltas & RQI Scoring**: Measure release readiness combining automated health and unresolved bug severity into an objective, defensible index.
7. **Evidence AI Assistant**: A read-only, toolless assistant that synthesizes technical findings and bug briefs without hallucinating outcomes.

---

## 2. Core Documentation System

All documentation is maintained in continuous synchronization with project reality:

- [docs/PROJECT_SPEC.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/PROJECT_SPEC.md) — Final confirmation-ready MVP specification.
- [docs/PRD.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/PRD.md) — Product requirements and user journeys.
- [docs/ARCHITECTURE.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/ARCHITECTURE.md) — Decoupled cloud architecture and provider topology.
- [docs/DATA_MODEL.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/DATA_MODEL.md) — Entity-relationship schema for projects, audits, bugs, and evidence.
- [docs/API_CONTRACTS.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/API_CONTRACTS.md) — REST endpoints, payloads, and AI assistant schemas.
- [docs/RQI_SCORING.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/RQI_SCORING.md) — Tripartite RQI formulas combining automated checks and manual bug severity.
- [docs/TEST_STRATEGY.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/TEST_STRATEGY.md) — Empirical verification and test matrix.
- [docs/SECURITY.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/SECURITY.md) — Domain verification, SSRF defense, and data boundaries.
- [docs/PRIVACY_AND_RETENTION.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/PRIVACY_AND_RETENTION.md) — Deny-by-default allowlist evidence sanitization.
- [docs/ROADMAP.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/ROADMAP.md) — Delivery phases (MVP v0.1.0 vs Post-MVP v0.2.0).
- [docs/DECISIONS.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/DECISIONS.md) — Architecture Decision Records (ADR-001 through ADR-021).
- [docs/DOUBT_REGISTER.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/DOUBT_REGISTER.md) — Master pre-implementation doubt register.
- [docs/TEST_RESULTS.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/TEST_RESULTS.md) — Empirical test logs (currently `NOT RUN`).
