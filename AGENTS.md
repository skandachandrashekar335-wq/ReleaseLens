# ReleaseLens — Permanent AI Agent Governance & Instructions

> **CRITICAL DIRECTIVE**: This file governs all AI coding sessions, delegated subagents, and human contributors working on the **ReleaseLens** repository. Documentation is a **mandatory, continuous engineering responsibility** across the entire project lifecycle.

---

## 1. Product Identity & Purpose

**ReleaseLens** is a **cloud-hosted Web Application Testing, Bug Discovery, Evidence Collection, and Release-Readiness Platform**.

It is purpose-built to empower testers, QA engineers, and hackathon builders to:
1. **Register web applications and deployment environments** (including ephemeral Vercel/Netlify preview deployments).
2. **Execute bounded, automated quality audits** (availability, TLS, security headers, broken links, HTTP errors, and Core Web Vitals).
3. **Conduct manual exploratory testing** and log structured bug reports with steps to reproduce, expected vs. actual behavior, screenshots, and technical evidence.
4. **Generate structured, developer-ready bug reports** that developers can immediately diagnose and act on.
5. **Track issues through an actionable lifecycle** (`Open` $\to$ `Acknowledged` $\to$ `In Progress` $\to$ `Fixed` $\to$ `Retest Required` $\to$ `Verified` / `Reopened`).
6. **Retest releases and track regressions** via comparative release deltas and the **ReleaseLens Quality Index (RQI)**.
7. **Interact with an evidence-grounded, read-only AI assistant** that interprets findings and crafts developer summaries without hallucinating test outcomes.

> **CRITICAL SCOPE RULE**: ReleaseLens is NOT merely a PageSpeed clone or website scanner. Its differentiation lies in unifying **automated checks, manual exploratory bug discovery, evidence-backed developer handoffs, and release-readiness gating**.

---

## 2. Core Operating Principles

1. **Read Before Writing**: Inspect the entire repository, directory structure, package manifests, existing architecture documents, source code, and tests before implementing any change.
2. **Preserve Established Decisions**: Adhere to documented Architecture Decision Records (`docs/DECISIONS.md`), specifications (`docs/PROJECT_SPEC.md`), and requirements (`docs/PRD.md`) unless a justified, explicitly documented reason exists to revise them.
3. **Continuous Documentation Synchronization**: Documentation is NOT a post-hoc deliverable. Every pull request or commit that modifies behavior, models, APIs, security posture, scoring, or deployment MUST update corresponding documentation files in the same change set.
4. **Evidence-Based Reporting**:
   - Strictly distinguish between `IMPLEMENTED`, `TESTED`, `PARTIALLY IMPLEMENTED`, `PLANNED`, `PROPOSED`, `BLOCKED`, `NOT VERIFIED`, and `DEPRECATED`.
   - Never fabricate test execution or results. If a test has not been executed, record `NOT RUN`.
   - Never claim security certification or production readiness without verified empirical evidence.
5. **No Placeholders or Fake Implementations**: No decorative buttons pretending to work, mock backends masquerading as live systems, or swallowed exceptions. Features must work end-to-end or state explicit limitations.
6. **Architecture Decision Tracking**: Any architectural change, framework addition, structural shift, or data model revision must be accompanied by an update to `docs/DECISIONS.md` (ADR).
7. **Environment and Secret Safety**: Maintain `.env.example` with safe placeholder names. Never hardcode, commit, or log credentials, tokens, or private secrets.
8. **Definition of Done Compliance**: A task is only complete when implementation, automated/manual tests, and synchronized documentation are all verified.
9. **Review Consistency Before Finalizing**: Audit changes against the documentation inventory before concluding turns or committing.
10. **Session Continuity**: Ensure all subagents and subsequent AI sessions inherit these exact governance rules.

---

## 3. Strict Status State Machine

When describing any module, feature, or verification item in any document or response, use exclusively these standardized statuses:

- `DOCUMENTED`: Supported by official vendor documentation.
- `REASONED`: Supported by technical analysis, but pending empirical test.
- `EXPERIMENTALLY_VERIFIED`: Empirically validated with recorded test evidence.
- `PROPOSED`: Ideated or suggested; under active review or discovery interview.
- `PLANNED`: Confirmed in roadmap/spec, awaiting implementation.
- `IN PROGRESS`: Actively under construction in the current cycle.
- `PARTIALLY IMPLEMENTED`: Functional subset in repository, but acceptance criteria remain incomplete.
- `IMPLEMENTED`: Code is complete and merged in the repository.
- `TESTED`: Verified via actual test execution with recorded test logs.
- `NOT RUN`: Test exists or is planned, but has not yet been executed in this environment.
- `BLOCKED`: Unable to proceed due to a recorded dependency or missing secret.
- `DEPRECATED`: Superseded or scheduled for removal.
