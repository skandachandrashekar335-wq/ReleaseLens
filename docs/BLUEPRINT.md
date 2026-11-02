# System Blueprint — ReleaseLens

> **Document Status**: `INITIAL BASELINE`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Architectural Blueprint

```mermaid
graph TD
    subgraph Client Layer
        UI["ReleaseLens Web App (Next.js / React)"]
        CLI["ReleaseLens CLI / GitHub Action (Planned)"]
    end

    subgraph Core Application Service
        API["API Server / Route Handlers"]
        Parser["Diff & AST Parser Engine"]
        Scorer["RQI Evaluation Engine"]
        Synth["Audience Synthesis Engine (LLM / Rules)"]
    end

    subgraph Execution & Worker Infrastructure
        WorkerPool["Cloud / Browser Worker Runner"]
        BrowserSession["Sandboxed Browser / Headless Smoke Check"]
    end

    subgraph Data & Storage
        Store[("ReleaseLens State / Audit Store")]
        ArtifactStore["Artifact Cache (Changelogs, Reports, Diff Snapshots)"]
    end

    UI --> API
    CLI --> API
    API --> Parser
    Parser --> Scorer
    API --> WorkerPool
    WorkerPool --> BrowserSession
    BrowserSession --> Scorer
    Scorer --> Synth
    Synth --> Store
    Synth --> ArtifactStore
```

---

## 2. Component Responsibilities

1. **Client Layer**:
   - Presents interactive visual telemetry, diff inspector, RQI score dial, and multi-audience preview tabs.
   - Provides drag-and-drop or Git repository connection controls.
2. **Core Service Engine**:
   - `Parser Engine`: Normalizes diffs, analyzes changed symbols, detects breaking changes and risky file paths.
   - `RQI Engine`: Executes deterministic mathematical scoring based on verified weights.
   - `Synthesis Engine`: Produces clean, human-readable release briefs tailored per stakeholder role.
3. **Cloud Worker & Isolation Layer**:
   - Executes sandboxed browser/endpoint smoke tests to verify deployed artifacts before release sign-off.
   - Captures logs, performance metrics, and failure traces without compromising main application security.
4. **Data & Storage Layer**:
   - Persists release evaluations, RQI histories, audit trails, and configuration presets.
