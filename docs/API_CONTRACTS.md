# API Contracts & Endpoint Specifications — ReleaseLens

> **Document Status**: `INITIAL BASELINE` / `PROPOSED`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Core Endpoints Overview

| Method | Endpoint | Purpose | Status |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/evaluations/analyze` | Ingests a diff / commit range and computes RQI | `PLANNED` |
| `GET` | `/api/v1/evaluations/:id` | Retrieves an evaluation by ID with factors & reports | `PLANNED` |
| `POST` | `/api/v1/evaluations/:id/synthesize` | Generates or regenerates audience-specific reports | `PLANNED` |
| `POST` | `/api/v1/evaluations/:id/workers/trigger` | Triggers cloud worker verification pass | `PROPOSED` |
| `GET` | `/api/v1/policies/:projectId` | Retrieves active gating policy rules | `PLANNED` |

---

## 2. Request & Response Payloads

### `POST /api/v1/evaluations/analyze`
**Request Payload**:
```json
{
  "projectId": "proj_12345",
  "baseRef": "main",
  "headRef": "release/v1.2.0",
  "diff": "diff --git a/src/auth.ts b/src/auth.ts\nindex 83b1c...",
  "ciMetrics": {
    "testPassRate": 0.98,
    "coverageDelta": -0.015,
    "buildDurationSec": 210
  }
}
```

**Response Payload (200 OK)**:
```json
{
  "evaluationId": "eval_89abc",
  "rqiScore": 82.5,
  "verdict": "PASS_WITH_WARNINGS",
  "metrics": {
    "filesChanged": 14,
    "additions": 342,
    "deletions": 89,
    "highRiskFiles": ["/src/auth.ts", "/migrations/003_users.sql"]
  },
  "factors": [
    { "category": "CodeChurn", "weight": 0.20, "score": 85.0 },
    { "category": "MigrationRisk", "weight": 0.30, "score": 70.0 },
    { "category": "TestIntegrity", "weight": 0.25, "score": 92.0 },
    { "category": "BlastRadius", "weight": 0.25, "score": 84.0 }
  ],
  "createdAt": "2026-11-03T00:15:00Z"
}
```

---

## 3. Standard Error Envelope

All API errors return a consistent RFC-7807 compliant structure:
```json
{
  "error": {
    "code": "INVALID_DIFF_PAYLOAD",
    "message": "The provided unified diff could not be parsed. Ensure Git unified diff format.",
    "details": { "line": 42, "reason": "Malformed hunk header" }
  }
}
```
