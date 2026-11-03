# Data Model & Schema — ReleaseLens

> **Document Status**: `SYNCHRONIZED` / `RESET TO TESTING & BUG DISCOVERY PLATFORM`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Entity-Relationship Overview

```mermaid
erDiagram
    USER ||--o{ PROJECT : owns
    PROJECT ||--o{ AUDIT_RUN : undergoes
    AUDIT_RUN ||--o{ AUTOMATED_CHECK : records
    AUDIT_RUN ||--|| RQI_SCORE : evaluates
    PROJECT ||--o{ BUG_REPORT : tracks
    BUG_REPORT ||--o{ BUG_EVIDENCE : contains
    BUG_REPORT ||--o{ RETEST_HISTORY : logs
    PROJECT ||--o{ CHAT_SESSION : contains

    USER {
        uuid id PK
        string email
        string display_name
        string avatar_url
        datetime created_at
    }

    PROJECT {
        uuid id PK
        uuid user_id FK
        string name
        string target_url
        string environment "PRODUCTION | STAGING | PREVIEW"
        boolean is_verified
        string verification_token
        datetime created_at
        datetime updated_at
    }

    AUDIT_RUN {
        uuid id PK
        uuid project_id FK
        string target_url
        string audit_tier "TIER_1_PUBLIC | TIER_2_VERIFIED"
        string status "QUEUED | RUNNING | COMPLETED | FAILED"
        datetime started_at
        datetime completed_at
    }

    AUTOMATED_CHECK {
        uuid id PK
        uuid audit_run_id FK
        string category "AVAILABILITY | TLS | HEADERS | BROKEN_LINKS | PAGESPEED | ACCESSIBILITY"
        string check_name
        string status "PASS | FAIL | NOT_RUN | INCONCLUSIVE"
        json raw_evidence
        string error_message
    }

    RQI_SCORE {
        uuid id PK
        uuid audit_run_id FK
        string release_verdict "VERIFIED_READY | PROVISIONAL_PASS | REVIEW_REQUIRED | RELEASE_BLOCKED"
        float quality_score
        float coverage_percent
        string gate_security "PASS | FAIL | NOT_RUN | INCONCLUSIVE"
        string gate_functional "PASS | FAIL | NOT_RUN | INCONCLUSIVE"
        json factor_breakdown
    }

    BUG_REPORT {
        uuid id PK
        uuid project_id FK
        uuid user_id FK
        string title
        string description
        string affected_url
        json steps_to_reproduce
        string expected_result
        string actual_result
        string severity "CRITICAL | HIGH | MEDIUM | LOW"
        string status "OPEN | ACKNOWLEDGED | IN_PROGRESS | FIXED | RETEST_REQUIRED | VERIFIED | REOPENED"
        json environment_telemetry
        string developer_notes
        datetime created_at
        datetime updated_at
    }

    BUG_EVIDENCE {
        uuid id PK
        uuid bug_report_id FK
        string evidence_type "SCREENSHOT | CONSOLE_LOG | NETWORK_TRACE"
        string file_url_or_text
        datetime captured_at
    }

    RETEST_HISTORY {
        uuid id PK
        uuid bug_report_id FK
        uuid user_id FK
        string previous_status
        string new_status
        string tester_comment
        datetime retested_at
    }

    CHAT_SESSION {
        uuid id PK
        uuid project_id FK
        uuid user_id FK
        datetime created_at
    }
```

---

## 2. Row-Level Security (RLS) Policies

All tables enforce strict Row-Level Security:
1. **`PROJECT`**: Select/Insert/Update/Delete where `user_id = auth.uid()`.
2. **`BUG_REPORT` & `BUG_EVIDENCE`**: Access scoped to projects owned by `auth.uid()`, OR viewable via public read-only share token if the owner generates a shareable report permalink.
3. **`AUDIT_RUN` & `AUTOMATED_CHECK`**: Scoped to the parent project's owner.
4. **`CHAT_SESSION`**: Strictly restricted to `auth.uid()`.
