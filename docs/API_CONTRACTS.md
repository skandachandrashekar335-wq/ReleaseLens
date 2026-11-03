# API Contracts & Endpoints — ReleaseLens

> **Document Status**: `SYNCHRONIZED` / `AUTOMATE FIRST, HUMAN REVIEW SECOND`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Core Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/projects` | Register a project (`name`, `targetUrl`, `environment`) | Yes (Google Sign-In) |
| `GET` | `/api/v1/projects` | List user projects with RQI, open findings, and confirmed bugs | Yes |
| `POST` | `/api/v1/projects/:id/audits` | Trigger automated audit (`tier`: TIER_1_PUBLIC, TIER_2_VERIFIED) | Yes |
| `GET` | `/api/v1/projects/:id/findings` | Get Findings Inbox (triage queue: `status`: DETECTED, NEEDS_REVIEW) | Yes |
| `PATCH` | `/api/v1/findings/:id` | Triage finding (`CONFIRMED`, `REJECTED`, `DUPLICATE`, `ACCEPTED_RISK`) | Yes |
| `POST` | `/api/v1/findings/:id/convert` | Convert confirmed finding into an official Bug Report | Yes |
| `POST` | `/api/v1/projects/:id/bugs` | Create manual bug report (for issues the crawler missed) | Yes |
| `GET` | `/api/v1/projects/:id/bugs` | List confirmed bug reports by status and severity | Yes |
| `PATCH` | `/api/v1/bugs/:id` | Update bug status (`OPEN` $\to$ `FIXED` $\to$ `RETEST_REQUIRED`) | Yes |
| `POST` | `/api/v1/bugs/:id/retest` | Log retest verification verdict (`PASS`, `FAIL`, `INCONCLUSIVE`) | Yes |
| `GET` | `/api/v1/audits/:id/technical-report` | Download / view Report A: Technical Audit Report | Yes |
| `GET` | `/api/v1/projects/:id/defect-report` | Download / view Report B: Human-Reviewed Defect Report | Yes |
| `POST` | `/api/v1/reports/share` | Generate secure read-only public permalink for developer handoff | Yes |
| `GET` | `/api/v1/reports/shared/:token` | View public developer-ready defect report | No (Public Token) |
| `POST` | `/api/v1/assistant/chat` | Query Evidence AI Assistant regarding audits and bug summaries | Yes |

---

## 2. Key Payloads

### `PATCH /api/v1/findings/:id` (Triage Finding)
**Request Payload**:
```json
{
  "status": "CONFIRMED",
  "triageNotes": "Verified in Chrome mobile viewport. The modal overlay blocks user clicks.",
  "adjustedSeverity": "CRITICAL"
}
```

**Response Payload (200 OK)**:
```json
{
  "findingId": "find_01h8abc",
  "status": "CONFIRMED",
  "convertedBugId": "bug_01h8xyz",
  "triagedAt": "2026-11-03T23:00:00Z"
}
```

---

### `GET /api/v1/projects/:id/defect-report` (Report B: Defect Report)
**Response Payload (200 OK)**:
```json
{
  "projectId": "proj_123",
  "projectName": "E-Commerce Hackathon App",
  "generatedAt": "2026-11-03T23:05:00Z",
  "releaseVerdict": "RELEASE_BLOCKED",
  "severitySummary": {
    "critical": 1,
    "high": 2,
    "medium": 1,
    "low": 0
  },
  "confirmedBugs": [
    {
      "id": "bug_01h8xyz",
      "title": "Google Sign-In Button Swallows Clicks on Mobile",
      "severity": "CRITICAL",
      "status": "OPEN",
      "affectedUrl": "https://myapp.vercel.app/login",
      "stepsToReproduce": [
        "Navigate to https://myapp.vercel.app on mobile viewport (375x667)",
        "Click 'Sign In'",
        "Click 'Continue with Google'"
      ],
      "expectedResult": "Redirect to Google consent screen",
      "actualResult": "Click swallowed; pointer-events collision on overlay",
      "developerNotes": "Inspect CSS pointer-events on #auth-overlay"
    }
  ]
}
```
