# Changelog — ReleaseLens

All notable changes to the ReleaseLens project will be documented in this file.

---

## [Unreleased] - 2026-11-03

### Changed
- Executed Product Direction Reset: Positioned ReleaseLens as a **cloud-hosted Web Application Testing, Bug Discovery, Evidence Collection, and Release-Readiness Platform** (ADR-021).
- Unfied automated quality audits with manual exploratory bug logging and evidence capture.
- Designed 7-state bug verification lifecycle: `OPEN` $\to$ `ACKNOWLEDGED` $\to$ `IN_PROGRESS` $\to$ `FIXED` $\to$ `RETEST_REQUIRED` $\to$ `VERIFIED` / `REOPENED`.
- Updated Tripartite RQI scoring: Unresolved critical bugs immediately trip `GATE_FUNCTIONAL = FAIL`, triggering `RELEASE_BLOCKED`.
- Synchronized all documentation across `docs/`, `README.md`, and `AGENTS.md`.
