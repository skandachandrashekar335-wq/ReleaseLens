# ReleaseLens Quality Index (RQI) — Tripartite Governance Model

> **Document Status**: `SYNCHRONIZED` / `REVISED SPECIFICATION (ROUND 4)`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Tripartite Governance Architecture

RQI separates blocker evaluation from numerical performance metrics using three independent layers:
1. **Layer 1: Hard Release Gates** (Independent Pass / Fail / Not Run / Inconclusive checks).
2. **Layer 2: Tested Quality Score ($S_{\text{quality}}$)** (0–100 weighted quality score across executed categories).
3. **Layer 3: Audit Coverage Completeness ($C_{\text{audit}}$)** (0–100% test surface evaluated).

---

## 2. Layer 1: Independent Hard Release Gates

Before computing numerical scores, the engine evaluates three critical safety gates. Every gate resolves to one of four states:
- `PASS`: Check executed; all criteria satisfied.
- `FAIL`: Critical safety defect detected.
- `NOT_RUN`: Check omitted from the executed audit tier.
- `INCONCLUSIVE`: Check attempted, but network error, target timeout, or upstream API error prevented verification.

| Hard Gate | Scope | Evaluated Safety Criteria | Blocker Failure Condition (`FAIL`) |
| :--- | :--- | :--- | :--- |
| **`GATE_SECURITY`** | Tier 1 | TLS validity, HTTPS enforcement, Clickjacking protection. | TLS expired ($\le 0$ days), imminent expiry ($\le 2$ days), plain HTTP without redirect, or missing clickjacking protection. |
| **`GATE_FUNCTIONAL`** | Tier 2/3 | Client-side runtime crashes, hydration integrity. | Unhandled fatal JavaScript exception during page load, or critical JS bundle 404/500 error. |
| **`GATE_AUTH`** | Tier 3 | OAuth redirect contract, callback route reachability. | Callback route returns 404/500, or invalid OAuth redirect parameters. |

---

## 3. Operational Release Verdict Matrix

| Condition | Release Verdict | User-Facing Meaning |
| :--- | :--- | :--- |
| **ANY Gate == `FAIL`** (or $S_{\text{quality}} < 70$) | **`RELEASE_BLOCKED`** | **Deployment Blocked**. A critical security defect, JS page crash, or broken auth route was detected. No numerical score can override this. |
| **ANY Gate == `INCONCLUSIVE`** (and no gate failed) | **`REVIEW_REQUIRED`** | **Manual Review Required**. A critical check could not be conclusively verified due to an upstream timeout or network error. |
| **ALL 3 Gates == `PASS`** AND $S_{\text{quality}} \ge 85$ AND $C_{\text{audit}} = 100\%$ | **`VERIFIED_READY`** | **Production Ready**. Full audit completed; all hard gates passed; high quality confirmed. |
| **Executed Gates == `PASS`**, but 1+ Gates == `NOT_RUN` (and $S_{\text{quality}} \ge 85$) | **`PROVISIONAL_PASS`** | **Provisional Pass**. No blockers detected in executed checks, but release readiness is **NOT fully verified** because deeper tiers were not evaluated. |

---

## 4. Layer 2: Tested Quality Score ($S_{\text{quality}}$)

Calculated strictly over executed categories ($T \subseteq \{1, 2, 3, 4, 5\}$):

$$S_{\text{quality}} = \frac{\sum_{i \in T} w_i \cdot S_i}{\sum_{i \in T} w_i} - P_{\text{minor}}$$

Where:
- Category Weights: Security ($0.25$), Performance ($0.25$), a11y/SEO ($0.15$), Functional ($0.20$), Auth ($0.15$). Total $W = 1.00$.
- $P_{\text{minor}}$ represents non-blocking deductions (e.g. missing `Referrer-Policy`: -5 pts; TLS expiry between 3–14 days: -5 pts).
- **If $T = \emptyset$, $S_{\text{quality}} = 0$ (Undefined).**

---

## 5. Corrected Worked Examples

### Example 1: Full Audit (All Gates Passed)
- Hard Gates: `GATE_SECURITY`: **PASS**, `GATE_FUNCTIONAL`: **PASS**, `GATE_AUTH`: **PASS**.
- Evaluated: All 5 categories ($C_{\text{audit}} = 100\%$).
- Category Scores: Security 92, Performance 88, a11y 95, Functional 90, Auth 100. Minor Deductions: 0.
- $S_{\text{quality}} = \mathbf{92.3} / 100$ | Coverage: $\mathbf{100\%}$.
- **Verdict**: **`VERIFIED_READY`**.

---

### Example 2: Tier 1 Public Scan Only
- Hard Gates:
  - `GATE_SECURITY`: **PASS**
  - `GATE_FUNCTIONAL`: **`NOT_RUN`**
  - `GATE_AUTH`: **`NOT_RUN`**
- Evaluated: Categories 1, 2, 3 ($C_{\text{audit}} = 65\%$).
- Category Scores: Security 90, Performance 86, a11y 92.
- $S_{\text{quality}} = \frac{(0.25 \times 90) + (0.25 \times 86) + (0.15 \times 92)}{0.65} = \frac{57.8}{0.65} = \mathbf{88.9} / 100$.
- **Verdict**: **`PROVISIONAL_PASS`**.
- **Display**: Quality: **88.9 / 100** | Coverage: **65%** | Status: **Provisional Pass (2 Gates NOT_RUN: Functional & Auth unverified)**.

---

### Example 3: High Performance but Broken Hard Security Gate
- Target achieves 100% Core Web Vitals ($S_2 = 100$), but serves an expired TLS certificate ($S_1 = 30$).
- Hard Gate Status: `GATE_SECURITY`: **`FAIL`** (Expired TLS certificate).
- **Verdict**: **`RELEASE_BLOCKED`**. Zero numerical compensation; deployment is immediately blocked.

---

### Example 4: Audit with Upstream API Timeout
- Target passes Security ($S_1 = 90$), but Google PageSpeed times out due to rate limits.
- Hard Gates: `GATE_SECURITY`: **PASS**, `GATE_FUNCTIONAL`: **`INCONCLUSIVE`** (timed out).
- **Verdict**: **`REVIEW_REQUIRED`** *(Banner: "Functional check inconclusive due to network timeout; re-run recommended before deploying")*.
