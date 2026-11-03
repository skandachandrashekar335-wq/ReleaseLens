# ReleaseLens

> **Cloud-Hosted Website Quality Auditing, RQI Scoring & Evidence-Backed Intelligence Platform**

---

## 1. Project Overview & Scope

**ReleaseLens** is a cloud-based website quality auditing and release intelligence platform. It enables developers, engineering leads, and product teams to register web applications (including preview/staging deployments on `*.vercel.app`), execute deep cloud-hosted quality audits, compute a transparent **ReleaseLens Quality Index (RQI)** score, track historical quality trends, and converse with an evidence-grounded AI assistant.

### Key Tenets
1. **Zero Local Machine Dependency**: 100% cloud-hosted. No local database, local Docker daemon, local CLI, or machine-local browser workers required.
2. **100% Guaranteed ₹0 Budget (Zero Credit Card Required)**: Architected exclusively on verified free-tier services that enforce hard limits without auto-billing (Vercel, Supabase, Google PageSpeed API, Google Gemini API, Cloudflare Workers).
3. **Rigorous Three-Tier Security**:
   - **Tier 1 (Public Scan)**: Passive inspection: TLS/SSL validity, security headers, Core Web Vitals via Google PageSpeed API.
   - **Tier 2 (Verified Ownership)**: Internal link crawl (detects 404/500 routes up to 15 pages via isolated Cloudflare Worker; requires meta-tag or `.well-known` token verification).
   - **Tier 3 (Headless Browser Worker)**: Deferred to Post-MVP (v0.2.0) pending live container network egress firewall validation.
4. **Tripartite RQI Governance**:
   - Independent Hard Release Gates (`PASS`, `FAIL`, `NOT_RUN`, `INCONCLUSIVE`).
   - Tested Quality Score ($S_{\text{quality}}$: 0–100).
   - Audit Coverage Completeness ($C_{\text{audit}}$: 0–100%).
5. **Evidence-Grounded AI Assistant**: Answers user questions based strictly on recorded audit logs and network traces, with zero hallucinations.

---

## 2. Core Documentation System

All documentation is maintained in continuous synchronization with project reality:

- [docs/PROJECT_SPEC.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/PROJECT_SPEC.md) — Final confirmation-ready MVP specification.
- [docs/PRD.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/PRD.md) — Product requirements and acceptance criteria.
- [docs/ARCHITECTURE_VALIDATION.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/ARCHITECTURE_VALIDATION.md) — Detailed evidence-based feasibility audit (Round 5).
- [docs/ARCHITECTURE.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/ARCHITECTURE.md) — Decoupled cloud architecture and provider topology.
- [docs/RQI_SCORING.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/RQI_SCORING.md) — Tripartite RQI formulas, 4-state hard gates, and worked examples.
- [docs/CLOUD_WORKER.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/CLOUD_WORKER.md) — Cloudflare Worker Tier 2 Crawler design and limits.
- [docs/SECURITY.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/SECURITY.md) — Domain verification, SSRF defense, and crawler boundaries.
- [docs/PRIVACY_AND_RETENTION.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/PRIVACY_AND_RETENTION.md) — Deny-by-default allowlist evidence sanitization.
- [docs/DOUBT_REGISTER.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/DOUBT_REGISTER.md) — Master pre-implementation doubt and workflow register.
- [docs/DECISIONS.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/DECISIONS.md) — Architecture Decision Records (ADR-001 through ADR-020).
- [docs/ROADMAP.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/ROADMAP.md) — Multi-phase deliverables (MVP v0.1.0 vs v0.2.0).
- [docs/TEST_RESULTS.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/TEST_RESULTS.md) — Empirical test logs (currently `NOT RUN`).
