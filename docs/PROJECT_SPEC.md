# Project Specification — ReleaseLens

> **Document Status**: `PROPOSED` / `AWAITING USER DISCOVERY CONFIRMATION`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Product Summary & Purpose
**ReleaseLens** is a release intelligence platform that automates release risk evaluation, quantifies readiness via the Release Quality Index (RQI), executes isolated worker smoke verifications, and generates multi-stakeholder release documentation.

---

## 2. Target Users & Roles
- **Engineering Lead / Release Manager**: Sets release risk thresholds, inspects blast radiuses, approves/blocks deployments.
- **Software Engineer**: Evaluates PR diffs, views predicted RQI score, and checks flagged breaking changes.
- **Product Manager**: Reviews synthesized feature summaries and operational impact.
- **Stakeholder / Support**: Consumes clean, non-technical changelogs and customer release alerts.

---

## 3. Scope Boundaries

### Must-Have (MVP Scope)
- [ ] Local or remote Git diff ingestion (unified diff, commit ranges).
- [ ] Automated risk categorization (Database migrations, Auth/Security, Core logic, Dependencies, UI).
- [ ] Deterministic RQI calculation (0–100 score with weight breakdown).
- [ ] Multi-audience release notes generation (Engineering, Product, Customer).
- [ ] Clean, responsive UI with real-time feedback and export capabilities.

### Should-Have (Phase 2 & 3)
- [ ] Cloud worker integration for sandboxed smoke tests.
- [ ] Direct GitHub / GitLab PR webhook triggers.
- [ ] Customizable policy rules (e.g. minimum RQI score for staging vs production).

### Explicit Non-Goals for Initial Phase
- ❌ Direct cloud deployment execution (ReleaseLens evaluates and gates, but does not deploy Kubernetes clusters or cloud infrastructure directly).
- ❌ Replacing general-purpose APM or runtime error trackers (e.g. Sentry, Datadog).

---

## 4. Unresolved Discovery Questions (Awaiting User Input)
1. Preferred primary input channel for the MVP: Direct Git repo URL / token, manual diff paste / file upload, or local CLI runner?
2. Target deployment/runtime model for ReleaseLens itself: Self-hosted full-stack web application, local desktop tool, or cloud SaaS?
3. Model provider preference for AI audience synthesis: Local / deterministic template engine vs. LLM (OpenAI / Anthropic / Gemini)?
