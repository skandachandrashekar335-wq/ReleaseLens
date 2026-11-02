# Changelog — ReleaseLens

All notable changes to the ReleaseLens project will be documented in this file.

---

## [Unreleased] - 2026-11-03

### Changed
- Pivoted project specification and architecture from Git diff review to **Cloud-Based Website Quality Auditing & Intelligence Platform** based on user clarification (ADR-005).
- Enforced hard architectural constraints: 100% cloud-hosted, zero machine-local dependencies, ₹0 budget using verified free-tier services (ADR-006).
- Formulated strict three-tier authorization model: Tier 1 (Public Scan), Tier 2 (Verified Ownership), Tier 3 (Authenticated Testing) (ADR-007).
- Updated RQI (ReleaseLens Quality Index) formula for website health (Security, Core Web Vitals, Functional/Console Integrity, Accessibility, SEO).
- Synchronized all documentation across `docs/` and `README.md`.
