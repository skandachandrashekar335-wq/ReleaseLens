# Deployment & Production Verification — ReleaseLens

> **Document Status**: `INITIAL BASELINE` / `PROPOSED`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Deployment Models

ReleaseLens supports two primary deployment topologies:
1. **Self-Hosted Local / Single-Node**:
   - Containerized instance running Web UI, API, and SQLite/embedded storage.
   - Ideal for internal development teams and single-tenant setups.
2. **Cloud / High-Availability**:
   - Web & API deployed on container runners (Docker / ECS / Kubernetes).
   - Dedicated worker pool for executing isolated smoke and browser checks.
   - Managed PostgreSQL database for persistence.

---

## 2. Production Health Checks & Rollback Verification

- **Liveness Probe**: `GET /api/health/live` returns HTTP 200 when the process is up.
- **Readiness Probe**: `GET /api/health/ready` verifies database connectivity and worker pool readiness.
- **Rollback Procedure**: Database migrations are strictly backwards-compatible. Rolling back application containers to the previous image tag restores previous behavior without requiring manual data rollbacks.
