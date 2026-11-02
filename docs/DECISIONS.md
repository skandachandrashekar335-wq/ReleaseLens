# Architecture Decision Records (ADRs) — ReleaseLens

> **Document Status**: `SYNCHRONIZED`  
> **Last Synchronized**: 2026-11-03  

---

## ADR Index

| ADR ID | Title | Date | Status |
| :--- | :--- | :--- | :--- |
| **ADR-001** | Documentation Governance as a Continuous Engineering Requirement | 2026-11-03 | `ACCEPTED` |
| **ADR-002** | Deterministic Mathematical Foundation for RQI Scoring | 2026-11-03 | `ACCEPTED` |
| **ADR-003** | Multi-Audience Synthesis Separation | 2026-11-03 | `ACCEPTED` |
| **ADR-004** | Cloud Worker Architecture for Dynamic Smoke Verification | 2026-11-03 | `SUPERSEDED by ADR-008 & ADR-011` |
| **ADR-005** | Pivot to Cloud-Hosted Website Quality & Intelligence Platform | 2026-11-03 | `ACCEPTED` |
| **ADR-006** | Zero-Spend Architecture (₹0 Budget) using Free-Tier Cloud Services | 2026-11-03 | `ACCEPTED` |
| **ADR-007** | Strict Three-Tier Authorization Model (Public vs Verified vs Authenticated) | 2026-11-03 | `ACCEPTED` |
| **ADR-008** | Two-Tier Cloud Inspection Pipeline (API-Driven + Ephemeral Worker) | 2026-11-03 | `ACCEPTED` |
| **ADR-009** | Safe Authentication Verification via OAuth Contract & Route Probing | 2026-11-03 | `ACCEPTED` |
| **ADR-010** | Tiered Evidence Retention Strategy for 500MB Free Database Cap | 2026-11-03 | `ACCEPTED` |
| **ADR-011** | Hybrid Headless Runner: Serverless HTTP Probes + GitHub Actions Ephemeral Runner | 2026-11-03 | `PROPOSED` |
| **ADR-012** | Defense-in-Depth SSRF & Anti-Rebinding Architecture | 2026-11-03 | `PROPOSED` |
| **ADR-013** | Dual-Metric RQI Model: Quality Score Normalized by Audit Coverage | 2026-11-03 | `PROPOSED` |

---

## ADR-011: Hybrid Headless Runner: Serverless HTTP Probes + GitHub Actions Ephemeral Runner

### Context
Running full Chromium via `@sparticuz/chromium` inside Vercel Serverless Functions on the Hobby tier suffers from:
1. Cold boot times of 4–8 seconds to decompress the 50MB Chromium binary into `/tmp`.
2. Vercel Hobby hard timeout limits (default 10s, configurable to 60s, but prone to 504 errors on slow staging networks).
3. Concurrency caps (100 concurrent requests account-wide) and tight memory allocation (1024MB).

Cloudflare Workers Browser Rendering requires a paid subscription ($5/month), violating the ₹0 budget constraint.

### Decision
Adopt a **Hybrid Inspection Architecture**:
1. **Tier 1 (Public Scan)**: Runs 100% within Vercel Serverless Functions via native Node.js `fetch` and TLS socket connections, calling Google PageSpeed Insights REST API + custom TLS/Security Header probes. Completes in 2–4 seconds without any Chromium binary.
2. **Tier 2 (Deep Crawl) & Tier 3 (Headless Verifications)**: Executed via **GitHub Actions Repository Dispatch**:
   - Free tier provides 2,000 Linux runner minutes/month per private repo (and unlimited on public repos).
   - Dedicated runner VM: 2 vCPU, 7 GB RAM, 14 GB SSD, pre-installed real Google Chrome and Playwright.
   - Complete VM-level sandbox isolation; runs a bounded Playwright script (max 45 seconds), posts the structured evidence payload back to the ReleaseLens API via a signed webhook token, and terminates.

### Consequences
- **Positive**: 100% free (₹0); zero timeout failures; real Chrome browser with full devtools protocol; true OS-level isolation.
- **Trade-off**: Tier 2/3 audits run asynchronously (typical latency 20–35s due to runner dispatch queue) rather than instant synchronous response.

---

## ADR-012: Defense-in-Depth SSRF & Anti-Rebinding Architecture

### Context
Auditing arbitrary user-submitted URLs creates critical SSRF (Server-Side Request Forgery) risks. Attackers can:
1. Target internal cloud metadata endpoints (`169.254.169.254`, `metadata.google.internal`).
2. Target loopback (`127.0.0.1`) or private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
3. Exploit **DNS Rebinding**: Domain resolves to a public IP during initial validation, then resolves to `127.0.0.1` when the HTTP client initiates connection.
4. Exploit IPv4-mapped IPv6 addresses (`::ffff:127.0.0.1`, `::ffff:169.254.169.254`).
5. Use HTTP 302 redirect chains to sneak past initial URL validation.

### Decision
Implement strict **Defense-in-Depth SSRF Mitigation**:
1. **Custom DNS Pinning**: Resolve DNS once using `dns.promises.lookup` with `all: true`. Iterate through all returned A and AAAA records. If **any** IP is private, reserved, loopback, or cloud-metadata, reject the request immediately.
2. **Pinned Connection Socket**: In Node.js, create a custom `http.Agent` / `https.Agent` that forces the socket connection directly to the verified IP address, passing the target domain strictly in the `Host` header and SNI. This physically prevents DNS rebinding between validation and connection.
3. **Manual Redirect Inspection**: Set `redirect: 'manual'` on all fetches. Every HTTP 3xx response is intercepted; the `Location` header is parsed, validated against the protocol allowlist (HTTP/HTTPS only), resolved, and re-checked against the IP filter. Max redirect depth is capped at 5 hops. Cross-protocol redirects (HTTPS -> HTTP) are dropped.
4. **Port Allowlist**: Restrict connections strictly to ports 80 and 443. All other ports (22, 25, 3306, 5432, 6379, 8080) are blocked.
5. **Crawler Scope Containment**: Crawlers are strictly bound to `URL.origin`. External domains, non-HTTP schemes (`file:`, `ftp:`, `data:`, `blob:`), and query-string explosion loops are blocked. Max crawl depth: 2 hops. Max pages: 15 pages per run.

---

## ADR-013: Dual-Metric RQI Model: Quality Score Normalized by Audit Coverage

### Context
A single number RQI score without coverage context is dangerous. If a website only runs Tier 1 public checks and achieves 95/100, the user might assume their authentication and functional flows are production-ready. Conversely, treating unrun tests as 0 points unfairly gives a healthy site a failing grade (e.g. 38/100) simply because they haven't verified ownership yet.

### Decision
RQI is mathematically defined and presented as **Dual Metrics**:
1. **Tested Quality Index ($S_{\text{tested}}$)**: The weighted score (0–100) of all executed tests, minus severe deductions.
2. **Coverage Completeness ($C_{\text{audit}}$)**: The proportion of total testable weight actually executed:
   $$C_{\text{audit}} = \frac{\sum_{i \in \text{Tested}} w_i}{\sum_{\text{All}} w_i} \times 100\%$$
3. **Release Readiness Verdict**:
   - `VERIFIED_READY` ($S_{\text{tested}} \ge 85$ AND $C_{\text{audit}} \ge 80\%$)
   - `PROVISIONAL_PASS` ($S_{\text{tested}} \ge 85$ AND $C_{\text{audit}} < 80\%$)
   - `REVIEW_REQUIRED` ($70 \le S_{\text{tested}} < 85$)
   - `RELEASE_BLOCKED` ($S_{\text{tested}} < 70$ OR Critical Penalty Triggered)

### Consequences
- **Positive**: Complete transparency; zero false positives; missing tests never silently pass or unfairly destroy scores.
