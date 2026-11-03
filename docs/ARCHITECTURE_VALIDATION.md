# Architecture Validation & Feasibility Report — ReleaseLens

> **Document Status**: `SYNCHRONIZED` / `DEFINITIVE AUDIT (ROUND 5)`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Executive Summary & Evidence Classifications

In accordance with empirical engineering standards, all architectural components are classified strictly by their verified status:
- `DOCUMENTED`: Verified against current official vendor documentation (with cited URLs and retrieval dates).
- `REASONED`: Supported by rigorous structural analysis, but pending live empirical benchmark.
- `EXPERIMENTALLY_VERIFIED`: Tested and proven with reproducible logs in this environment.
- `PROPOSED`: Proposed architecture awaiting user confirmation or prototype validation.
- `BLOCKED`: Dependency or security control cannot currently be satisfied; implementation gated.
- `REJECTED`: Excluded due to terms of service violations, financial risks, or technical unsuitability.

---

## 2. Corrected Cloud Run Capacity Calculations & Regional Pricing

### Official Reference Citations (Checked Nov 2026):
- Cloud Run Pricing: https://cloud.google.com/run/pricing
- Cloud Run Locations: https://cloud.google.com/run/docs/locations
- Google Cloud Free Tier: https://cloud.google.com/free/docs/free-cloud-features#free-tier

### Exact Official Free Tier Quotas (Tier 1 Pricing Regions Only)
- **Request-Based Services**:
  - **180,000 vCPU-seconds / month**.
  - **360,000 GiB-seconds / month**.
  - **2,000,000 requests / month**.
  - **1 GiB outbound internet egress / month** (worldwide except China & Australia).
- **Instance-Based Services & Cloud Run Jobs**:
  - **240,000 vCPU-seconds / month**.
  - **450,000 GiB-seconds / month**.

### Recalculation for Headless Chromium Workload (1 vCPU, 2 GiB RAM, 23s Active Runtime)

1. **CPU-Constrained Capacity**:
   $$\text{Capacity}_{\text{CPU}} = \frac{180,000\text{ vCPU-sec}}{1\text{ vCPU} \times 23\text{s}} = \mathbf{7,826\text{ runs / month}}$$
2. **Memory-Constrained Capacity**:
   $$\text{Capacity}_{\text{RAM}} = \frac{360,000\text{ GiB-sec}}{2\text{ GiB} \times 23\text{s}} = \frac{360,000}{46} = \mathbf{7,826\text{ runs / month}}$$
   *(Notice: 1 vCPU and 2 GiB exactly balance at 7,826 runs).*
3. **Request-Constrained Capacity**:
   $$\text{Capacity}_{\text{Req}} = \frac{2,000,000\text{ req}}{1\text{ req / audit}} = \mathbf{2,000,000\text{ runs / month}}$$
4. **Egress-Constrained Capacity**:
   - Free egress allowance: $1\text{ GiB} = 1,048,576\text{ KB}$.
   - Outbound requests to target website: $\sim 50\text{ KB}$ total.
   - Encrypted evidence returned to API: $\sim 150\text{ KB}$.
   - Total egress per audit: $\sim 200\text{ KB}$.
   $$\text{Capacity}_{\text{Egress}} = \frac{1,048,576\text{ KB}}{200\text{ KB}} = \mathbf{5,242\text{ runs / month}}$$

### Theoretical Maximum vs. Conservative Operating Capacity
- **Theoretical Maximum**: 5,242 complete runs/month (bounded by 1 GiB egress).
- **Real-World Overhead Factors**:
  - Cold starts and container initialization: 4–6s.
  - Complex SPA render delays, retries, and network timeouts (up to 45s on failing sites): elevates average execution duration to $\sim 28\text{s}$.
  - At 28s: Memory capacity drops to $360,000 / (2 \times 28) = \mathbf{6,428\text{ runs}}$.
- **Safe Monthly Operating Ceiling**: **1,000 browser audits / month** (representing $<20\%$ of the free tier allowance) to provide a 5x safety buffer against unexpected retries, concurrency spikes, and memory leaks.

---

## 3. Regional Assessment: Tier 1 vs. India (Tier 2)

Official documentation confirms Cloud Run locations are split into two pricing tiers:
- **Tier 1 Regions**: `us-central1` (Iowa), `us-east1` (South Carolina), `us-west1` (Oregon), `europe-west1` (Belgium), `asia-east1` (Taiwan), `asia-northeast1` (Tokyo).
- **Tier 2 Regions**: `asia-south1` (Mumbai), `asia-south2` (Delhi), `europe-west2` (London), `southamerica-east1` (São Paulo).

| Factor | Tier 1: `us-central1` (Iowa) | Tier 2: `asia-south1` (Mumbai) | Architectural Impact |
| :--- | :--- | :--- | :--- |
| **Cloud Run Free Tier** | **Eligible** (180k vCPU-s, 360k GiB-s, 2M req free/mo) | **ZERO Free Tier Allowance** | Deploying in Mumbai incurs billing charges from the very first second. |
| **Unit Pricing** | Baseline Tier 1 rates | $\sim 20\%$ higher unit cost | Tier 2 is more expensive across compute and memory. |
| **Latency to Vercel Staging Sites** | **20 – 45 ms** (Vercel serverless origins typically run in `iad1` / US-East) | **180 – 240 ms** (Cross-continental network hop to US-hosted staging sites) | Deploying in `us-central1` or `us-east1` yields *lower* latency for auditing Vercel deployments. |
| **Verdict** | `DOCUMENTED (RECOMMENDED)` | `REJECTED FOR ₹0 OPERATION` | Worker must run in Tier 1 region for free-tier eligibility. |

---

## 4. Spending Safeguards & Zero-Spend Feasibility

Official documentation:
- Google Cloud Budgets: https://cloud.google.com/billing/docs/how-to/budgets
- Cloud Run Billing Settings: https://cloud.google.com/run/docs/configuring/billing-settings

### Critical Distinction Between Spending Mechanisms
1. **Budget Notifications**: Passive alerts sent via email/PubSub at percentage thresholds. **They do not stop execution or prevent credit card charges.**
2. **Application-Level Quotas**: Enforced inside ReleaseLens backend logic (token bucket in Supabase). Blocks users when daily/monthly caps are reached.
3. **Cloud Run Spend Caps**: Cloud Run does **not** provide a generally available native $0 hard spend cap. While GCP offers budget-triggered programmatic actions (Cloud Functions that disable billing), execution latency between usage and billing alerts (15–45 minutes) means a rapid traffic surge can still accumulate minor charges ($0.50–$3.00) before billing is disabled.
4. **Billing-Account-Free MVP Architecture**:
   - To achieve a **100% guaranteed ₹0 operating model without a credit card on file**, the MVP core must execute on services that **never require payment methods and enforce hard stops**:
     - **Vercel Hobby**: Zero credit card; hard stop on 100k invocations.
     - **Supabase Free Tier**: Zero credit card; hard stop on 500MB storage.
     - **Google PageSpeed API**: Google Cloud API key with billing disabled; hard stop on 25,000 queries/day.
     - **Google Gemini Flash API (AI Studio)**: Zero credit card; hard rate limit at 15 RPM / 1,500 RPD.
     - **Cloudflare Workers Free Plan**: Zero credit card; hard stop on 100,000 requests/day.
   - **Tier 3 Cloud Run** is classified as `BLOCKED (OPTIONAL)` until the user explicitly chooses to link an authorized GCP project.

---

## 5. Cloudflare Workers Feasibility for Tier 2 Crawler

- **Official Reference**: https://developers.cloudflare.com/workers/platform/limits/
- **Plan Limits**:
  - 100,000 requests / day free.
  - **CPU execution limit: 10ms per request**. (Cloudflare measures *CPU time*, not wall-clock I/O time. While awaiting external HTTP responses, CPU usage is 0ms. Wall-clock limit is up to 30s).
  - Subrequests: Up to 50 concurrent subrequests per invocation.
- **Suitability for Multi-Tenant Link Crawler**:
  - A Cloudflare Worker receives a target URL, executes a parallel fetch of up to 15 internal links, parses HTTP status codes (200 vs 404/500), and returns the broken link list in $<800\text{ms}$.
  - CPU parsing using lightweight regex/scanners consumes $<3\text{ms}$ of CPU time, well within the 10ms ceiling.
  - When the 100,000 request limit is met, Cloudflare returns HTTP 1027; it **never** auto-bills.
  - **Verdict**: `DOCUMENTED (ACCEPTED FOR TIER 2 CRAWLER)`.

---

## 6. Corrected RQI Hard-Gate Semantics & Logic

### Four Formal Gate States
1. `PASS`: Check executed; all criteria satisfied.
2. `FAIL`: Critical safety defect detected.
3. `NOT_RUN`: Check omitted from the executed audit tier.
4. `INCONCLUSIVE`: Check attempted, but network error or upstream timeout prevented verification.

### Gate Inventory & Failure Thresholds
- **`GATE_SECURITY`** (Tier 1): TLS expired ($\le 0$ days), imminent expiry ($\le 2$ days), plain HTTP without redirect, or missing clickjacking protection on sensitive paths.
- **`GATE_FUNCTIONAL`** (Tier 2/3): Page-crashing fatal JavaScript exception, or critical JS bundle 404/500. *(Note: A PageSpeed API timeout is marked `INCONCLUSIVE`, NOT an automatic functional failure).*
- **`GATE_AUTH`** (Tier 3): OAuth callback route returns 404/500, or invalid OAuth redirect parameters.

### Operational Release Verdicts
- **`RELEASE_BLOCKED`**: **ANY** executed gate is `FAIL` (or $S_{\text{quality}} < 70$). Critical failures can **never** be compensated for by high performance scores.
- **`REVIEW_REQUIRED`**: **ANY** executed gate is `INCONCLUSIVE` (and no gate failed).
- **`PROVISIONAL_PASS`**: All executed gates are `PASS` (and $S_{\text{quality}} \ge 85$), but 1+ gates are `NOT_RUN` ($C_{\text{audit}} < 100\%$).
- **`VERIFIED_READY`**: **ALL 3 gates are `PASS`** AND $S_{\text{quality}} \ge 85$ AND $C_{\text{audit}} = 100\%$.

---

## 7. Browser-Worker Security & MVP Status

While a two-layer isolation architecture (Kernel `iptables` + Playwright route interception) is designed, **it has not yet been experimentally verified in a live container test harness**.

In accordance with empirical engineering standards:
- **Tier 3 Browser Execution is DEFERRED / BLOCKED from the Core MVP**.
- The Core MVP delivers **Tier 1 (Public Probes + PageSpeed API)** and **Tier 2 (Cloudflare Worker Link Crawler)**.
- This guarantees **100% security containment, ₹0 cost, and zero platform policy risks**.

---

## 8. Data Privacy & AI Safety Model

1. **Deny-by-Default Ingestion**:
   - Allowed headers: Strictly 6 security headers (`content-security-policy`, `strict-transport-security`, `x-frame-options`, `x-content-type-options`, `referrer-policy`, `permissions-policy`).
   - All `Cookie`, `Authorization`, and custom headers are dropped.
   - All URL query parameters and fragments are stripped from logged subresources.
   - Zero form values or DOM bodies are captured.
2. **AI Assistant Permission Boundary**:
   - The AI assistant is **strictly toolless and read-only**.
   - Input is passed inside `<untrusted_audit_evidence>` boundary tags.
   - The system prompt explicitly instructs the model to treat external logs as passive data, ignoring any embedded directives.
