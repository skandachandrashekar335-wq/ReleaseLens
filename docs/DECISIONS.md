# Architecture Decision Records (ADRs) — ReleaseLens

> **Document Status**: `INITIAL BASELINE`  
> **Last Synchronized**: 2026-11-03  

---

## ADR Index

| ADR ID | Title | Date | Status |
| :--- | :--- | :--- | :--- |
| **ADR-001** | Documentation Governance as a Continuous Engineering Requirement | 2026-11-03 | `ACCEPTED` |
| **ADR-002** | Deterministic Mathematical Foundation for RQI Scoring | 2026-11-03 | `ACCEPTED` |
| **ADR-003** | Multi-Audience Synthesis Separation | 2026-11-03 | `ACCEPTED` |
| **ADR-004** | Isolated Worker Architecture for Dynamic Smoke Verification | 2026-11-03 | `PROPOSED` |

---

## ADR-001: Documentation Governance as a Continuous Engineering Requirement

### Context
Codebases suffer from documentation drift when documentation is treated as an afterthought or milestone post-mortem. In an AI-assisted and agentic development environment, out-of-date documentation directly causes hallucinations, architectural regressions, and misaligned implementations.

### Decision
Enforce permanent documentation governance via `AGENTS.md`. Every change to code, schema, APIs, or tests must update corresponding documentation in the same change set. Test results and implementation states must be supported by empirical evidence (`IMPLEMENTED`, `TESTED`, `PROPOSED`, etc.).

### Consequences
- **Positive**: High documentation accuracy, rapid onboarding, deterministic agent prompts, zero drift.
- **Trade-off**: Requires dedicated discipline and verification turn in every engineering task.

---

## ADR-002: Deterministic Mathematical Foundation for RQI Scoring

### Context
Release risk scoring must be objective, reproducible, and explainable to both engineers and leadership. Relying purely on non-deterministic LLM evaluation leads to inconsistent scoring across runs.

### Decision
The core **Release Quality Index (RQI)** will be computed via a deterministic, weighted mathematical model factoring in code churn, file criticality (auth, migrations, core logic), test pass rates, and coverage deltas. AI will be utilized to augment qualitative explanations and audience summaries, but not to override the core quantitative score without explicit user override.

### Consequences
- **Positive**: Explainable, verifiable, and consistent metrics. Transparent weighting documented in `docs/RQI_SCORING.md`.
- **Trade-off**: Requires careful tuning of heuristic weights.

---

## ADR-003: Multi-Audience Synthesis Separation

### Context
Different stakeholders require vastly different views of the same release: engineers need low-level diffs, product managers need user-facing feature summaries, and executives/customer support need high-level impact and risk alerts.

### Decision
Decouple the data extraction from the audience rendering. Generate three discrete audience outputs (`Engineering`, `Product`, `Customer`) from a single evaluated release payload.

### Consequences
- **Positive**: One source of truth serves all teams without manual translation.
- **Trade-off**: Increases generation overhead per release evaluation.
