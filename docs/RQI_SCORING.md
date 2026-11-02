# Release Quality Index (RQI) — Scoring Methodology & Weights

> **Document Status**: `INITIAL BASELINE` / `PROPOSED`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Overview & Objective

The **Release Quality Index (RQI)** is a normalized metric on a scale of **0 to 100** that evaluates the overall health, stability, and operational risk of a planned release candidate.

- **90 – 100**: **High Confidence / Safe** (Low risk, comprehensive test coverage, minimal blast radius).
- **75 – 89**: **Moderate Risk / Review Advised** (Moderate churn or schema changes; standard deployment with monitoring).
- **Below 75**: **High Risk / Gated** (High blast radius, breaking changes, missing tests, or unverified worker passes).

---

## 2. Mathematical Model & Component Weights

The composite RQI score is computed as:

$$\text{RQI} = \sum_{i=1}^{n} w_i \cdot S_i - P_{\text{penalties}}$$

Where $w_i$ represents category weights ($\sum w_i = 1.0$), $S_i \in [0, 100]$ represents category sub-scores, and $P$ represents absolute safety deductions.

### Baseline Category Breakdown

| Category ($i$) | Weight ($w_i$) | Description & Signal Inputs |
| :--- | :--- | :--- |
| **1. Blast Radius & Path Criticality** ($S_{\text{blast}}$) | 0.25 | Evaluates how close changes are to mission-critical infrastructure (Auth, Payments, DB migrations, Core Routing). |
| **2. Code Churn & Complexity** ($S_{\text{churn}}$) | 0.20 | Analyzes lines added/deleted, file count, and cyclomatic diff complexity. Large single-file diffs penalize stability. |
| **3. Test & Verification Integrity** ($S_{\text{test}}$) | 0.30 | CI test pass rate, code coverage delta ($\Delta \text{cov}$), and headless worker verification pass status. |
| **4. Dependency & Security Hygiene** ($S_{\text{sec}}$) | 0.15 | Vulnerability alerts in updated dependencies, modified permission boundaries, and secret exposure checks. |
| **5. Migration & Reversibility Risk** ($S_{\text{mig}}$) | 0.10 | Non-additive database migrations (dropped columns, renamed tables) or irreversible state changes. |

---

## 3. Penalty Modifiers ($P_{\text{penalties}}$)

Certain conditions trigger immediate deductions regardless of otherwise high sub-scores:
- **Critical Breaking API Change without Version Bump**: -15 points.
- **Destructive Database Migration (e.g. `DROP TABLE`)**: -20 points.
- **Failed Cloud Worker Smoke Pass**: -25 points.
- **Coverage Drop > 5%**: -10 points.

---

## 4. Limitations & Edge Cases

- **Small Diff Distortion**: Diffs with fewer than 5 lines may exhibit disproportionate percentage swings; minimum baseline thresholds are applied.
- **Vendor/Generated Files**: Lockfiles (`package-lock.json`), build artifacts, and auto-generated GraphQL/Prisma clients must be filtered from code churn to avoid skewing the score.
