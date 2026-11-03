# Changelog — ReleaseLens

All notable changes to the ReleaseLens project will be documented in this file.

---

## [Unreleased] - 2026-11-03

### Changed
- Corrected official Cloud Run free-tier quotas (180k vCPU-sec, 360k GiB-sec, 2M req/mo) and calculated exact resource-constrained capacity (7,826 runs CPU/RAM, 5,242 runs egress, 1,000 runs conservative operating ceiling).
- Corrected regional assessment: Documented that GCP Free Tier applies strictly to Tier 1 pricing regions (`us-central1`); Mumbai (`asia-south1`) is Tier 2 with zero free tier allowance.
- Finalized 100% guaranteed billing-account-free MVP architecture: Decoupled Tier 2 link crawling to Cloudflare Workers free plan (100k req/day), eliminating credit card requirements. Deferred Tier 3 headless browser container runner to Post-MVP (v0.2.0).
- Finalized Tripartite RQI Governance: Documented formal 4-state hard gate model (`PASS`, `FAIL`, `NOT_RUN`, `INCONCLUSIVE`) and calibrated TLS warning/blocker thresholds.
- Synchronized all repository documentation and produced confirmation-ready `docs/PROJECT_SPEC.md`.
