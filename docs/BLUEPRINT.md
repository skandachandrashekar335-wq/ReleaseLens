# System Blueprint — ReleaseLens

> **Document Status**: `SYNCHRONIZED`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Cloud-Only Architecture Blueprint

```mermaid
graph TD
    subgraph Client [Browser / Frontend]
        UI["ReleaseLens Web Dashboard (Next.js / React)"]
        GoogleAuthClient["Google OAuth Sign-In"]
        ChatUI["Evidence AI Assistant Drawer"]
    end

    subgraph Cloud Application Layer [Vercel Free Tier]
        AppServer["Next.js Server Actions & API Routes"]
        OwnershipVerifier["DNS / Meta-Tag Verification Service"]
        RQIEngine["Deterministic RQI Scoring Engine"]
        EvidenceEngine["Evidence Retrieval & Prompt Assembler"]
    end

    subgraph Cloud Inspection Layer [Zero-Cost Cloud APIs & Workers]
        PageSpeed["Google PageSpeed Insights API (Free: 25k req/day)"]
        HTTPInspector["Serverless SSL & Security Header Inspector"]
        CloudBrowserWorker["Cloud Worker (Playwright / Headless API)"]
    end

    subgraph Cloud Persistence & AI [Free-Tier Managed Services]
        SupabaseDB[("Supabase Free Tier (PostgreSQL + RLS)")]
        GeminiAPI["Google Gemini 1.5/2.0 Flash API (Free Tier: 15 RPM)"]
    end

    UI --> AppServer
    GoogleAuthClient --> SupabaseDB
    AppServer --> SupabaseDB
    AppServer --> OwnershipVerifier
    AppServer --> PageSpeed
    AppServer --> HTTPInspector
    AppServer --> CloudBrowserWorker
    PageSpeed --> RQIEngine
    HTTPInspector --> RQIEngine
    CloudBrowserWorker --> RQIEngine
    RQIEngine --> SupabaseDB
    ChatUI --> EvidenceEngine
    EvidenceEngine --> SupabaseDB
    EvidenceEngine --> GeminiAPI
    GeminiAPI --> ChatUI
```

---

## 2. Key Component Responsibilities

1. **Web Dashboard**: High-density interface for managing registered sites, initiating inspection runs, inspecting audit logs, viewing RQI breakdowns, and querying the AI assistant.
2. **Ownership Verification Service**: Validates domain ownership via HTML `<meta name="releaselens-verification" content="...">` or `https://<domain>/.well-known/releaselens-verify.txt`.
3. **Cloud Inspection Layer**:
   - Non-intrusive scans execute via Serverless HTTP workers and Google PageSpeed Insights API.
   - Deep and authenticated flows run in isolated cloud browser execution environments.
4. **Deterministic RQI Engine**: Aggregates all observed telemetry into a normalized 0–100 score.
5. **Evidence AI Engine**: Connects to the audit database to retrieve exact test logs and injects them into a strictly bounded prompt for Google Gemini API, ensuring zero hallucinated outcomes.
