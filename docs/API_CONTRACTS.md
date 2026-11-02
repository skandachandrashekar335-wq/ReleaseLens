# API Contracts & Endpoints — ReleaseLens

> **Document Status**: `SYNCHRONIZED`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Core Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/websites` | Register a website (`url`, `name`) | Yes (Google Sign-In) |
| `GET` | `/api/v1/websites` | List user's registered websites | Yes |
| `POST` | `/api/v1/websites/:id/verify` | Trigger ownership verification check | Yes |
| `POST` | `/api/v1/websites/:id/audits` | Trigger an audit run (`tier`: PUBLIC, VERIFIED, AUTHENTICATED) | Yes |
| `GET` | `/api/v1/audits/:id` | Get audit run status, RQI score, and evidence breakdown | Yes |
| `GET` | `/api/v1/websites/:id/history` | Get historical RQI trends across consecutive runs | Yes |
| `POST` | `/api/v1/assistant/chat` | Send question to Evidence-Backed AI Assistant | Yes |

---

## 2. Evidence AI Assistant Endpoint

### `POST /api/v1/assistant/chat`
**Request Payload**:
```json
{
  "websiteId": "web_01h8abc",
  "auditRunId": "audit_01h8xyz",
  "query": "Does Google authentication work on my preview URL?"
}
```

**Response Payload (200 OK)**:
```json
{
  "answer": "Based on the latest audit (Run #audit_01h8xyz executed at 2026-11-03 00:20 UTC), Google authentication was tested under Tier 3 Authenticated Checks. The test PASSED: The Google OAuth popup initialized successfully, redirected to accounts.google.com, and returned a valid session token within 1,420ms. Zero unhandled console errors were recorded during the flow.",
  "evidence": [
    {
      "testName": "Google OAuth Flow Test",
      "status": "PASSED",
      "timestamp": "2026-11-03T00:20:14Z",
      "metricSummary": "Redirect latency 1420ms, zero console errors"
    }
  ],
  "rqiImpact": "Contributed +20 points to Functional Integrity"
}
```

If the test was NOT run:
```json
{
  "answer": "There is NO EVIDENCE in audit #audit_01h8xyz that Google authentication was tested. The current audit was executed at Tier 1 (Public Scan), which only evaluates public headers, SSL, and Core Web Vitals. To test Google authentication, complete domain ownership verification and configure a Tier 3 Authenticated flow.",
  "evidence": [],
  "rqiImpact": "N/A (Test NOT RUN)"
}
```
