# ReleaseLens Quality Index (RQI) — Website Quality Scoring

> **Document Status**: `SYNCHRONIZED`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Overview & Objective

The **ReleaseLens Quality Index (RQI)** is a deterministic composite score from **0 to 100** evaluating the release-readiness and technical health of a deployed website or staging build (e.g. `*.vercel.app`).

- **90 – 100**: **Production Ready** (Excellent Core Web Vitals, strong security headers, zero console crashes, accessible).
- **75 – 89**: **Acceptable with Warnings** (Minor accessibility issues or moderate performance headroom; low deployment risk).
- **Below 75**: **Release Gated / Review Required** (SSL issues, missing security headers, unhandled console exceptions, or broken critical journeys).

---

## 2. Category Weights & Scoring Breakdown

$$\text{RQI} = \sum_{i=1}^{5} w_i \cdot S_i - P_{\text{penalties}}$$

| Category ($i$) | Weight ($w_i$) | Metrics & Data Sources |
| :--- | :--- | :--- |
| **1. Security & Header Hygiene ($S_{\text{sec}}$)** | 0.25 | HTTPS enforcement, valid TLS certificate, HSTS, Content-Security-Policy (CSP), X-Frame-Options, X-Content-Type-Options, Referrer-Policy. |
| **2. Performance & Core Web Vitals ($S_{\text{perf}}$)** | 0.25 | Google PageSpeed / Lighthouse Performance score (LCP, INP, CLS, TTFB, Speed Index). |
| **3. Functional Integrity ($S_{\text{func}}$)** | 0.20 | JavaScript console error count, 4xx/5xx network asset failures, DOM hydration stability. |
| **4. Accessibility ($S_{\text{a11y}}$)** | 0.15 | Lighthouse Accessibility score (color contrast, ARIA landmarks, alt attributes, tab navigation order). |
| **5. Best Practices & SEO ($S_{\text{seo}}$)** | 0.15 | Mobile viewport meta tag, modern image formats, valid robots.txt, canonical tag. |

---

## 3. Strict Safety Deductions ($P_{\text{penalties}}$)

Specific critical failures trigger immediate point deductions:
- **Expired or Invalid SSL/TLS Certificate**: -35 points (immediately blocks production release readiness).
- **Unhandled JavaScript Crash on Page Load**: -20 points.
- **Critical Auth Flow Failure (Tier 3)**: -25 points.
- **Clickjacking Vulnerability (Missing `X-Frame-Options` or `frame-ancestors`)**: -10 points.

---

## 4. Evidence Traceability

Every factor in the formula links directly to an immutable `AUDIT_EVIDENCE` record. When a user asks the AI assistant why the RQI is low, the assistant reads the exact deduction log (e.g. *"Deducted 20 points because of unhandled TypeError: Cannot read properties of undefined at main.js:142"*).
