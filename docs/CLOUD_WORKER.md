# Cloud Worker & Browser Inspection Architecture — ReleaseLens

> **Document Status**: `SYNCHRONIZED`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Cloud Execution Mandate

In strict accordance with project requirements:
- **No local execution**: No Playwright or Puppeteer running on the user's personal development machine.
- **Zero Cost (₹0 Budget)**: Inspection jobs run in cloud environments utilizing free-tier compute:
  - **Tier 1 (Public)**: Direct API calls to Google PageSpeed Insights REST API + serverless Edge/Node HTTP workers (Vercel serverless functions).
  - **Tier 2 & 3 (Deep & Authenticated)**: Ephemeral cloud browser workers (e.g. `@sparticuz/chromium` in serverless function or free-tier container runner) bounded by strict 30-45s execution timeouts.

---

## 2. Worker Lifecycle & Evidence Ingestion

```mermaid
flowchart TD
    A["User triggers Audit (Tier 1/2/3)"] --> B["API checks Ownership Tier & Rate Limits"]
    B --> C["Dispatch Cloud Inspection Job"]
    C --> D1["Worker 1: Google PageSpeed API (Vitals & a11y)"]
    C --> D2["Worker 2: Serverless HTTP/TLS Inspector (Headers & SSL)"]
    C --> D3["Worker 3: Cloud Headless Worker (Console errors & Auth flow)"]
    D1 --> E["Raw Evidence Collector"]
    D2 --> E
    D3 --> E
    E --> F["RQI Calculation Engine"]
    F --> G["Persist Run & Evidence in Supabase DB"]
```
