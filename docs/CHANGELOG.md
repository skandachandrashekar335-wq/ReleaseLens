# Changelog — ReleaseLens

All notable changes to the ReleaseLens project will be documented in this file.

---

## [Unreleased] - 2026-11-03

### Changed
- Finalized Unified Core Workflow: **Automate First, Human Review Second** (`URL` $\to$ `AUTOMATED AUDIT` $\to$ `FINDINGS INBOX` $\to$ `HUMAN TRIAGE` $\to$ `CONFIRMED BUGS` $\to$ `DEVELOPER HANDOFF` $\to$ `RETEST`) (ADR-022).
- Established 6-state Potential Findings lifecycle: `DETECTED` $\to$ `NEEDS_REVIEW` $\to$ `CONFIRMED` $\mid$ `REJECTED` $\mid$ `DUPLICATE` $\mid$ `ACCEPTED_RISK`.
- Established Dual Reporting Engine: Report A (Technical Audit Report) and Report B (Human-Reviewed Defect Report).
- Decoupled unreviewed potential findings from confirmed bugs in RQI gating: Only `CONFIRMED` critical bugs trip hard functional gates; unreviewed findings prevent `VERIFIED_READY` until triaged (ADR-023).
- Synchronized all documentation across `docs/`, `README.md`, and committed to source control.
