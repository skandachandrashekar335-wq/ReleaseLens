# Data Model & Schema — ReleaseLens

> **Document Status**: `INITIAL BASELINE` / `PROPOSED`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Entity-Relationship Overview

```mermaid
erDiagram
    PROJECT ||--o{ RELEASE_EVALUATION : contains
    RELEASE_EVALUATION ||--o{ EVALUATION_FACTOR : includes
    RELEASE_EVALUATION ||--o{ AUDIENCE_REPORT : generates
    RELEASE_EVALUATION ||--o{ WORKER_RUN : triggers
    PROJECT ||--o{ GATING_POLICY : configures

    PROJECT {
        string id PK
        string name
        string repository_url
        datetime created_at
        datetime updated_at
    }

    RELEASE_EVALUATION {
        string id PK
        string project_id FK
        string base_ref
        string head_ref
        string commit_sha
        float rqi_score
        string status
        int files_changed
        int additions
        int deletions
        datetime created_at
    }

    EVALUATION_FACTOR {
        string id PK
        string evaluation_id FK
        string category
        float weight
        float raw_score
        float weighted_score
        json details
    }

    AUDIENCE_REPORT {
        string id PK
        string evaluation_id FK
        string audience_type
        string content_markdown
        json structured_highlights
        datetime created_at
    }

    WORKER_RUN {
        string id PK
        string evaluation_id FK
        string worker_type
        string status
        int duration_ms
        json logs
        datetime completed_at
    }

    GATING_POLICY {
        string id PK
        string project_id FK
        float min_rqi_score
        boolean block_on_breaking_changes
        boolean require_worker_pass
    }
```

---

## 2. Key Entity Definitions

1. **`Project`**: Represents an ingested software repository or tracked workspace.
2. **`ReleaseEvaluation`**: A discrete evaluation of a release candidate (e.g. tag `v1.2.0`, PR #42, or commit range `main..staging`). Stores aggregate RQI score and metrics.
3. **`EvaluationFactor`**: Component scores contributing to the overall RQI score (Code Churn, Migration Risk, Security Impact, Test Coverage Delta).
4. **`AudienceReport`**: Tailored synthesis outputs generated for Engineering, Product, or Customer audiences.
5. **`WorkerRun`**: Execution record of automated cloud/browser smoke verification passes.
6. **`GatingPolicy`**: Rules determining whether an evaluation passes, warns, or blocks release progression.
