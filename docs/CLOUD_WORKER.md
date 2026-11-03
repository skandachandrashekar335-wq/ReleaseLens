# Cloud Worker & Crawler Architecture — ReleaseLens

> **Document Status**: `SYNCHRONIZED` / `FINAL SPECIFICATION (ROUND 5)`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Cloud Execution Architecture for MVP

In accordance with strict ₹0 budget and platform compliance requirements:
- **Zero Local Footprint**: No Playwright or Puppeteer execution on the developer's machine.
- **Vercel Hobby Compliance**: Outbound link crawling is decoupled from Vercel Serverless Functions to comply with Vercel Fair Use policies.
- **Provider Sourcing**:
  - **Tier 1 (Public Scan)**: Direct Google PageSpeed Insights REST API + native TLS/Header socket probe.
  - **Tier 2 (Deep Link Audit)**: **Cloudflare Workers Free Tier** (100,000 requests/day, 10ms CPU limit, up to 50 subrequests).
  - **Tier 3 (Headless Browser Worker)**: **Deferred to Post-MVP (v0.2.0)** pending live container network egress firewall verification.

---

## 2. Cloudflare Worker Tier 2 Link Crawler Design

- **Runtime**: Cloudflare V8 Worker on free plan.
- **Execution Flow**:
  1. Worker receives POST payload: `{ "targetUrl": "https://myapp.vercel.app", "maxDepth": 2, "maxPages": 15 }`.
  2. Fetches root page, extracts internal `<a href="...">` links matching `URL.origin`.
  3. Executes parallel subrequests (`HEAD` / `GET`) up to 15 unique internal URLs.
  4. Records HTTP response statuses (200, 301, 404, 500).
  5. Returns structured JSON: `{ "scannedCount": 14, "brokenLinks": [{ "url": "/pricing", "status": 404, "source": "/" }], "durationMs": 420 }`.
- **Resource Consumption**: Consumes $\sim 2\text{ms}$ of CPU time (limit: 10ms) and 1 invocation (limit: 100,000/day).
- **Zero Billing Guarantee**: Cloudflare Workers free plan returns HTTP 1027 when daily quota is reached; it **never** auto-bills.
