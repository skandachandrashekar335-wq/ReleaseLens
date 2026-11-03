# API Contracts & Endpoints — ReleaseLens

> **Document Status**: `SYNCHRONIZED` / `RESET TO TESTING & BUG DISCOVERY PLATFORM`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Core Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/projects` | Create a project (`name`, `targetUrl`, `environment`) | Yes (Google Sign-In) |
| `GET` | `/api/v1/projects` | List user projects with latest RQI and open bug counts | Yes |
| `GET` | `/api/v1/projects/:id` | Get project details, audit history, and active bugs | Yes |
| `POST` | `/api/v1/projects/:id/audits` | Trigger automated audit (`tier`: TIER_1_PUBLIC, TIER_2_VERIFIED) | Yes |
| `GET` | `/api/v1/audits/:id` | Get audit run status, automated checks, and RQI score | Yes |
| `POST` | `/api/v1/projects/:id/bugs` | Create manual bug report with steps, expected/actual, severity | Yes |
| `GET` | `/api/v1/bugs/:id` | Get single bug details, evidence, and retest history | Yes |
| `PATCH` | `/api/v1/bugs/:id` | Update bug status (`OPEN` $\to$ `FIXED` $\to$ `RETEST_REQUIRED` $\to$ `VERIFIED`) | Yes |
| `POST` | `/api/v1/bugs/:id/retest` | Log retest attempt with tester verdict and comments | Yes |
| `GET` | `/api/v1/projects/:id/deltas` | Compare latest audit with previous audit (Release Delta) | Yes |
| `POST` | `/api/v1/reports/share` | Generate secure read-only public permalink for developer handoff | Yes |
| `GET` | `/api/v1/reports/shared/:token` | View public developer-ready bug report | No (Public Token) |
| `POST` | `/api/v1/assistant/chat` | Query Evidence AI Assistant regarding audits and bug summaries | Yes |

---

## 2. Sample Payloads

### `POST /api/v1/projects/:id/bugs` (Log Bug Report)
**Request Payload**:
```json
{
  "title": "Google Sign-In Button Unresponsive on Mobile Viewport",
  "description": "Clicking the Google OAuth button on mobile screens (<400px) does not open the OAuth popup or redirect.",
  "affectedUrl": "https://myapp.vercel.app/login",
  "stepsToReproduce": [
    "Navigate to https://myapp.vercel.app on mobile device (375x667)",
    "Click 'Sign In' in top navigation",
    "Click the 'Continue with Google' button"
  ],
  "expectedResult": "Google OAuth popup opens or redirects to accounts.google.com",
  "actualResult": "Button click is swallowed; no network request is sent; console logs 'Z-index overlap on #auth-overlay'",
  "severity": "CRITICAL",
  "environmentTelemetry": {
    "browser": "Chrome Mobile 120.0",
    "os": "Android 14",
    "viewport": "375x667"
  },
  "developerNotes": "Inspect CSS pointer-events on #auth-overlay div."
}
```

**Response Payload (201 Created)**:
```json
{
  "bugId": "bug_01h8abc",
  "status": "OPEN",
  "severity": "CRITICAL",
  "createdAt": "2026-11-03T22:50:00Z"
}
```

---

### `POST /api/v1/assistant/chat` (Evidence AI Assistant)
**Request Payload**:
```json
{
  "projectId": "proj_123",
  "query": "Summarize the critical bugs blocking this release and what the developers should fix first."
}
```

**Response Payload (200 OK)**:
```json
{
  "answer": "Based on the latest audit and manual bug reports for Project 'E-Commerce App' (Run #audit_456):\n\nRelease Verdict: RELEASE_BLOCKED\n\nCritical Blockers:\n1. [Bug #bug_01h8abc] Google Sign-In Button Unresponsive on Mobile: Critical auth flow is broken due to a CSS z-index overlap on `/login`.\n2. [Automated Check] Broken Internal Link: `/checkout/success` returns HTTP 404.\n\nRecommended Action for Developers:\n- Fix the pointer-events CSS collision on `#auth-overlay`.\n- Restore the missing `/checkout/success` page route before triggering a retest.",
  "referencedEvidence": [
    { "type": "BUG", "id": "bug_01h8abc", "severity": "CRITICAL" },
    { "type": "AUTOMATED_CHECK", "name": "Broken Links", "status": "FAIL" }
  ]
}
```
