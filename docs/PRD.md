# Product Requirements Document (PRD) — ReleaseLens

> **Document Status**: `SYNCHRONIZED` / `DISCOVERY IN PROGRESS`  
> **Last Synchronized**: 2026-11-03  
> **Target Release**: MVP v0.1.0  

---

## 1. Executive Summary

**ReleaseLens** is a cloud-hosted website quality auditing and release intelligence platform. It enables developers, QA engineers, and product teams to register web applications they own or are authorized to test (including preview/staging URLs such as `*.vercel.app`), execute comprehensive cloud-based quality inspections, track historical quality trends, and interact with a conversational AI assistant grounded strictly in verified inspection evidence.

---

## 2. Core Constraints & Guiding Principles

1. **Pure Cloud Execution (Zero Local Machine Dependency)**:
   - No local databases (no local SQLite or Docker required on the user's machine).
   - No local browser workers or CLI installations.
   - All persistence, inspection workers, and dashboard operations run in cloud environments.
2. **Strict Zero-Spend Target (₹0 Budget)**:
   - Built exclusively on generous, verified free-tier cloud platforms (Vercel, Supabase, Google PageSpeed API, Google Gemini API free tier).
   - Quotas, rate limits, and cold starts must be explicitly accounted for; no assumptions of infinite free capacity.
3. **Rigorous Three-Tier Authorization Model**:
   - URL submission is **never** treated as authorization to perform intrusive or authenticated tests.
   - **Tier 1 (Public Scan)**: Non-intrusive metadata, SSL, security headers, Core Web Vitals.
   - **Tier 2 (Verified Ownership)**: Deep link audits, console error monitoring, functional crawls. Requires DNS TXT or meta-tag verification.
   - **Tier 3 (Authenticated Testing)**: Testing login/auth flows (e.g. Google Sign-In verification). Requires Ownership Verification + designated test credentials.
4. **Evidence-Grounded AI Assistant**:
   - The assistant can answer questions (e.g., *"Does Google authentication work on my staging deployment?"*, *"What caused the RQI score to drop from 88 to 72?"*).
   - The AI assistant **must never invent test outcomes**. If evidence is missing or a test was not run, it must explicitly report `NOT RUN` or `NO EVIDENCE`.

---

## 3. High-Level Capabilities & Functional Requirements

| Capability | Tier / Priority | Status | Description |
| :--- | :--- | :--- | :--- |
| **Google Authentication** | Must-Have | `PLANNED` | Seamless Google OAuth sign-in for users to manage registered sites and audit history. |
| **Website Onboarding & Management** | Must-Have | `PLANNED` | Register websites, support custom domains and `*.vercel.app` staging URLs. |
| **Ownership Verification Engine** | Must-Have | `PLANNED` | HTML meta tag or `/.well-known/releaselens-verify.txt` verification to unlock Tier 2 & 3. |
| **Cloud Website Inspection Engine** | Must-Have | `PLANNED` | Automated checks: Core Web Vitals, SSL/TLS validity, security headers (CSP, HSTS, X-Frame-Options), console error traps, broken links. |
| **ReleaseLens Quality Index (RQI)** | Must-Have | `PLANNED` | Deterministic composite 0–100 score with transparent sub-category weights and penalties. |
| **Evidence-Grounded AI Assistant** | Must-Have | `PLANNED` | Conversational interface answering queries strictly using persisted audit logs, traces, and metrics. |
| **Historical Analytics & Trendlines** | Must-Have | `PLANNED` | Track RQI deltas across consecutive release audits; highlight regressions. |
| **Audience-Tailored Reporting** | Should-Have | `PLANNED` | Toggle between Engineering (deep logs, headers), QA (failures, broken flows), and Product (release health). |
| **Source Code / GitHub Integration** | Optional | `DEFERRED` | Optional secondary signal; not required for website auditing. |

---

## 4. Acceptance Criteria (MVP Baseline)

1. **Cloud Exclusivity**: End-to-end operation occurs via cloud URLs with zero local developer machine prerequisites.
2. **Safe Authorization Boundary**: Intrusive or authenticated tests are impossible to trigger against unverified domains.
3. **Deterministic RQI**: Transparent formula yields identical scores for identical test results.
4. **Truthful AI Responses**: The conversational assistant cites specific run IDs, timestamps, and log snippets, refusing to hallucinate unverified states.
