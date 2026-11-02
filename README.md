# ReleaseLens

> **Cloud-Hosted Website Quality Auditing, RQI Scoring & Evidence-Backed Intelligence Platform**

---

## 1. Project Overview & Scope

**ReleaseLens** is a modern, cloud-based website auditing and release intelligence platform. It enables developers, engineering leads, and product teams to register web applications (including preview/staging deployments on `*.vercel.app`), execute deep cloud-hosted quality audits, compute a transparent **ReleaseLens Quality Index (RQI)** score, track historical quality trends, and converse with an evidence-grounded AI assistant.

### Key Tenets
1. **Zero Local Machine Dependency**: 100% cloud-hosted. No local database, local Docker daemon, local CLI, or machine-local browser workers required.
2. **Zero-Spend Target (₹0 Budget)**: Architected exclusively on verified free-tier services (Vercel, Supabase, Google PageSpeed API, Google Gemini API).
3. **Rigorous Three-Tier Security**:
   - **Tier 1 (Public Scan)**: Non-intrusive metadata, SSL, security headers, Core Web Vitals.
   - **Tier 2 (Verified Ownership)**: Deep crawl, broken link detection, console error interception (requires meta-tag or `.well-known` token verification).
   - **Tier 3 (Authenticated Testing)**: Testing login/auth flows (e.g. Google Sign-In verification) with user-configured test credentials.
4. **Evidence-Grounded AI Assistant**: Answers user questions (e.g. *"Does Google auth work on my staging deployment?"*) based strictly on recorded audit logs and network traces, with zero hallucinations.

---

## 2. Core Documentation System

All documentation is maintained in continuous synchronization with project reality:

- [docs/PRD.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/PRD.md) — Product requirements, personas, and acceptance criteria.
- [docs/PROJECT_SPEC.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/PROJECT_SPEC.md) — Synthesized specification and discovery boundaries.
- [docs/BLUEPRINT.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/BLUEPRINT.md) — Cloud architecture diagram and system blueprint.
- [docs/ARCHITECTURE.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/ARCHITECTURE.md) — Cloud-only components and free-tier boundaries.
- [docs/RQI_SCORING.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/RQI_SCORING.md) — RQI composite formula, category weights, and safety deductions.
- [docs/DATA_MODEL.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/DATA_MODEL.md) — Schema for websites, ownership verification, audits, and chat.
- [docs/API_CONTRACTS.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/API_CONTRACTS.md) — REST APIs and AI assistant response schemas.
- [docs/CLOUD_WORKER.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/CLOUD_WORKER.md) — Cloud-only worker execution and isolation.
- [docs/SECURITY.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/SECURITY.md) — Authorization boundaries and domain verification methods.
- [docs/THREAT_MODEL.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/THREAT_MODEL.md) — STRIDE threat analysis and SSRF mitigations.
- [docs/DECISIONS.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/DECISIONS.md) — ADRs (ADR-001 through ADR-007).
- [docs/TEST_RESULTS.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/TEST_RESULTS.md) — Empirical test logs (currently `NOT RUN`).
