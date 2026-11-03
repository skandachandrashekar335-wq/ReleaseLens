# Changelog — ReleaseLens

All notable changes to the ReleaseLens project will be documented in this file.

---

## [Unreleased] - 2026-11-03

### Changed
- Reassessed Vercel Hobby suitability; decoupled external URL crawling from Vercel to maintain 100% compliance with Vercel Fair Use terms (ADR-018).
- Recalculated Cloud Run capacity: Identified that GCP Free Tier applies strictly to Tier 1 regions (`us-central1`), with zero free allowance in India (`asia-south1`). Capped browser audits at 1,100 runs/month to guarantee zero egress charges.
- Implemented multi-layered zero-spend safeguards (application token bucket + programmatic GCP billing disablement via Cloud Function Pub/Sub).
- Corrected RQI Hard-Gate state logic: Defined 4 formal states (`PASS`, `FAIL`, `NOT_RUN`, `INCONCLUSIVE`). Enforced that `NOT_RUN` gates never count as `PASS` and that `FAIL` unconditionally triggers `RELEASE_BLOCKED` (ADR-020).
- Enhanced browser network isolation: Combined kernel `iptables` egress firewall (dropping private IPs, metadata, and WebRTC UDP) with Playwright route interception (ADR-019).
- Established deny-by-default allowlist evidence collection and toolless read-only AI prompt isolation.
- Synchronized all documentation across `docs/` and committed to source control.
