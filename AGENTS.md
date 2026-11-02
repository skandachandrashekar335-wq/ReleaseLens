# ReleaseLens — Permanent AI Agent Governance & Instructions

> **CRITICAL DIRECTIVE**: This file governs all AI coding sessions, delegated subagents, and human contributors working on the **ReleaseLens** repository. Documentation is a **mandatory, continuous engineering responsibility** across the entire project lifecycle.

---

## 1. Core Operating Principles

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

## 2. Documentation Architecture & Mapping

Every task must update its relevant documentation counterpart:

| Change Category | Mandatory Documentation Updates |
| :--- | :--- |
| **New Feature / User Flow** | `README.md`, `docs/PRD.md`, `docs/PROJECT_WORKFLOW.md`, `docs/API_CONTRACTS.md`, `docs/CHANGELOG.md` |
| **Architecture / System Design** | `docs/ARCHITECTURE.md`, `docs/BLUEPRINT.md`, `docs/DECISIONS.md` |
| **Database / Persistence** | `docs/DATA_MODEL.md`, `docs/API_CONTRACTS.md`, `docs/SECURITY.md` |
| **Authentication & Authorization** | `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/PRIVACY_AND_RETENTION.md`, `docs/ENVIRONMENT.md` |
| **UI / UX / Frontend** | `docs/DESIGN.md`, `docs/BLUEPRINT.md`, component documentation |
| **Worker Execution / Isolation** | `docs/CLOUD_WORKER.md`, `docs/SECURITY.md`, `docs/THREAT_MODEL.md` |
| **Release Scoring / Intelligence** | `docs/RQI_SCORING.md`, `docs/TEST_RESULTS.md` |
| **Bug Fixes / Regressions** | `docs/CHANGELOG.md`, `docs/TEST_RESULTS.md` (regression tests) |
| **Security & Threat Mitigation** | `docs/SECURITY.md`, `docs/THREAT_MODEL.md`, `docs/DECISIONS.md` |
| **Deployment / Environment** | `docs/DEPLOYMENT.md`, `docs/ENVIRONMENT.md`, `README.md` |

---

## 3. Strict Status State Machine

When describing any module, feature, or verification item in any document or response, use exclusively these standardized statuses:

- `PROPOSED`: Ideated or suggested; under active review or discovery interview.
- `PLANNED`: Confirmed in roadmap/spec, awaiting implementation.
- `IN PROGRESS`: Actively under construction in the current cycle.
- `PARTIALLY IMPLEMENTED`: Functional subset in repository, but acceptance criteria remain incomplete.
- `IMPLEMENTED`: Code is complete and merged in the repository.
- `TESTED`: Verified via actual test execution with recorded test logs.
- `NOT RUN`: Test exists or is planned, but has not yet been executed in this environment.
- `BLOCKED`: Unable to proceed due to a recorded dependency or missing secret.
- `DEPRECATED`: Superseded or scheduled for removal.

---

## 4. Test Verification Standard

In `docs/TEST_RESULTS.md`, every recorded test run must explicitly capture:
1. Timestamp & Environment (OS, node/python/runtime version).
2. Exact invocation command (e.g. `npm test`, `pytest`).
3. Execution outcome: Passed count, Failed count, Skipped count.
4. Specific test suite files and assertions executed.
5. Known failures and reproduction steps.

---

## 5. Enforcement Checklist for Every Task

Before declaring any milestone or prompt complete:
- [ ] Has the repository state been inspected and verified?
- [ ] Do implementation changes have corresponding tests?
- [ ] Have all affected documentation files in `docs/` been updated to mirror reality?
- [ ] Are all statuses accurately labeled (`IMPLEMENTED`, `TESTED`, `PROPOSED`, etc.)?
- [ ] Does `README.md` reflect the current, runnable state of the project?
