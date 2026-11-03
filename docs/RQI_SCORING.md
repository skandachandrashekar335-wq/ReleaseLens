# ReleaseLens Quality Index (RQI) — Tripartite Governance Model

> **Document Status**: `SYNCHRONIZED` / `RESET TO TESTING & BUG DISCOVERY PLATFORM`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Tripartite Governance Architecture

RQI evaluates release health by unifying **automated audit results** and **manual exploratory testing evidence** across three layers:
1. **Layer 1: Independent Hard Release Gates** (`PASS`, `FAIL`, `NOT_RUN`, `INCONCLUSIVE`).
2. **Layer 2: Tested Quality Score ($S_{\text{quality}}$)** (0–100 score factoring automated metrics and open bug severity deductions).
3. **Layer 3: Audit Coverage Completeness ($C_{\text{audit}}$)** (0–100% evaluated test surface).

```mermaid
flowchart TD
    Audit["Automated Audit + Manual Bug Review"] --> GateCheck{"Layer 1: Hard Release Gates"}
    GateCheck -->|"ANY Gate == FAIL"| Blocked["Verdict: RELEASE_BLOCKED"]
    GateCheck -->|"ANY Gate == INCONCLUSIVE"| Review["Verdict: REVIEW_REQUIRED"]
    GateCheck -->|"All Gates PASS"| ScoreCheck{"Layer 2: Quality Score & Coverage"}
    ScoreCheck -->|"Coverage < 100%"| Provisional["Verdict: PROVISIONAL_PASS"]
    ScoreCheck -->|"Coverage == 100% & Quality >= 85"| Ready["Verdict: VERIFIED_READY"]
```

---

## 2. Layer 1: Independent Hard Release Gates

Before computing numerical scores, the engine evaluates two critical release gates:

| Hard Gate | Scope | Evaluated Criteria | Blocker Condition (`FAIL`) |
| :--- | :--- | :--- | :--- |
| **`GATE_SECURITY`** | Automated Tier 1 | TLS validity, HTTPS enforcement, Clickjacking protection. | TLS expired ($\le 0$ days), imminent expiry ($\le 2$ days), plain HTTP without redirect, or missing clickjacking protection on sensitive paths. |
| **`GATE_FUNCTIONAL`** | Automated + Manual | Automated broken links + Manual Exploratory Bugs. | **One or more unresolved `CRITICAL` bugs exist**, or critical broken routes detected. |

> **CRITICAL RULE**: If **ANY** Hard Gate is `FAIL`, the release verdict is unconditionally **`RELEASE_BLOCKED`**, regardless of whether performance scored 100%.

---

## 3. Layer 2: Tested Quality Score ($S_{\text{quality}}$)

Calculated over executed automated categories and adjusted for active exploratory bugs:

$$S_{\text{quality}} = \max\left(0, \frac{\sum_{i \in T} w_i \cdot S_i}{\sum_{i \in T} w_i} - D_{\text{bugs}} - P_{\text{minor}}\right)$$

### Automated Category Allocation:
- Security & Headers ($w_1 = 0.25$)
- Performance & Vitals ($w_2 = 0.25$)
- Accessibility & SEO ($w_3 = 0.15$)
- Broken Links & Navigation ($w_4 = 0.35$)
- Total $W = 1.00$.

### Active Bug Deductions ($D_{\text{bugs}}$):
- **`CRITICAL` Bug**: Triggers `GATE_FUNCTIONAL = FAIL` $\to$ `RELEASE_BLOCKED`.
- **`HIGH` Severity Bug**: -15 points per open issue.
- **`MEDIUM` Severity Bug**: -5 points per open issue.
- **`LOW` Severity Bug**: -2 points per open issue.
- *(Bugs in `FIXED` or `VERIFIED` status apply ZERO deduction).*

---

## 4. Layer 3: Audit Coverage ($C_{\text{audit}}$)

$$C_{\text{audit}} = \sum_{i \in T} w_i \times 100\%$$

- **Tier 1 Only**: $C_{\text{audit}} = 0.25 + 0.25 + 0.15 = \mathbf{65\%}$
- **Tier 1 + Tier 2 (Link Crawl)**: $C_{\text{audit}} = 0.65 + 0.35 = \mathbf{100\%}$

---

## 5. Release Verdict Matrix

| Release Verdict | Gate Status | Quality Score ($S_{\text{quality}}$) | Coverage ($C_{\text{audit}}$) | Operational Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **`VERIFIED_READY`** | All Gates PASS | $\ge 85$ | $100\%$ | All automated checks passed; zero unresolved critical/high bugs; verified ready for production. |
| **`PROVISIONAL_PASS`** | All Gates PASS | $\ge 85$ | $< 100\%$ | No blockers detected in executed checks, but deep tiers were not evaluated. |
| **`REVIEW_REQUIRED`** | All Gates PASS | $70 \le S_{\text{quality}} < 85$ | Any | Non-critical warnings, performance headroom, or open medium-severity bugs. |
| **`RELEASE_BLOCKED`** | **ANY Gate FAILS** | Any (or $< 70$) | Any | **Deploy blocked**. Expired certificate or unresolved critical bug blocking core flows. |
