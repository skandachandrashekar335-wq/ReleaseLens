# Data Model & Schema — ReleaseLens

> **Document Status**: `SYNCHRONIZED`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Entity-Relationship Overview

```mermaid
erDiagram
    USER ||--o{ WEBSITE : owns
    WEBSITE ||--o{ OWNERSHIP_VERIFICATION : verifies
    WEBSITE ||--o{ AUDIT_RUN : undergoes
    AUDIT_RUN ||--o{ AUDIT_EVIDENCE : generates
    AUDIT_RUN ||--|| RQI_SCORE : computes
    WEBSITE ||--o{ CHAT_SESSION : contains
    CHAT_SESSION ||--o{ CHAT_MESSAGE : logs

    USER {
        uuid id PK
        string email
        string display_name
        string avatar_url
        datetime created_at
    }

    WEBSITE {
        uuid id PK
        uuid user_id FK
        string domain_or_url
        string name
        string tier_level "PUBLIC | VERIFIED | AUTHENTICATED"
        boolean is_verified
        datetime created_at
        datetime updated_at
    }

    OWNERSHIP_VERIFICATION {
        uuid id PK
        uuid website_id FK
        string verification_token
        string method "META_TAG | WELL_KNOWN_FILE | DNS_TXT"
        string status "PENDING | VERIFIED | FAILED"
        datetime verified_at
        string last_error
    }

    AUDIT_RUN {
        uuid id PK
        uuid website_id FK
        string target_url
        string audit_tier "PUBLIC | VERIFIED | AUTHENTICATED"
        string status "QUEUED | RUNNING | COMPLETED | FAILED"
        float rqi_composite_score
        datetime started_at
        datetime completed_at
    }

    RQI_SCORE {
        uuid id PK
        uuid audit_run_id FK
        float score_performance
        float score_accessibility
        float score_security_headers
        float score_functional_integrity
        float score_best_practices
        float composite_score
        json deductions
    }

    AUDIT_EVIDENCE {
        uuid id PK
        uuid audit_run_id FK
        string category "SSL | HEADERS | LIGHTHOUSE | CONSOLE | NETWORK | AUTH_FLOW"
        string test_name
        string status "PASSED | FAILED | WARNING | NOT_RUN"
        json raw_payload
        string log_excerpt
    }

    CHAT_SESSION {
        uuid id PK
        uuid website_id FK
        uuid user_id FK
        datetime created_at
    }

    CHAT_MESSAGE {
        uuid id PK
        uuid chat_session_id FK
        string role "USER | ASSISTANT | SYSTEM"
        string content
        json referenced_evidence_ids
        datetime created_at
    }
```

---

## 2. Row-Level Security (RLS) Rules (Supabase / Postgres)

1. **`WEBSITE`**: Users can only insert, select, update, or delete websites where `user_id = auth.uid()`.
2. **`AUDIT_RUN` & `RQI_SCORE`**: Access strictly bounded to the owner of the parent `website_id` (or publicly viewable if the owner flags a specific report as public).
3. **`CHAT_SESSION` & `CHAT_MESSAGE`**: Restricted strictly to the authenticated `user_id`.
