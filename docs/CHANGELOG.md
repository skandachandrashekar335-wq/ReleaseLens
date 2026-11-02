# Changelog — ReleaseLens

All notable changes to the ReleaseLens project will be documented in this file.

---

## [Unreleased] - 2026-11-03

### Changed
- Re-evaluated and rejected GitHub Actions as a cloud browser worker due to AUP multi-tenant SaaS compliance and minute-rounding costs (ADR-011 rejected, replaced by ADR-014).
- Established native serverless link crawler for Tier 2 and decoupled Google Cloud Run ephemeral container runner for Tier 3 headless execution (ADR-014).
- Hardened browser network security using Playwright universal route interception (`page.route('**/*')`) for anti-rebind, subresource IP pinning, and egress restriction (ADR-015).
- Replaced flawed multiplicative RQI coverage formula with Tripartite RQI Governance: Independent Hard Release Gates + Tested Quality Score + Audit Coverage % (ADR-016).
- Formulated secret scrubbing pipeline and delimited prompt isolation for AI assistant (ADR-017).
- Created comprehensive [docs/ARCHITECTURE_VALIDATION.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/docs/ARCHITECTURE_VALIDATION.md).
- Updated doubt register and synchronized all architecture and scoring specifications.
