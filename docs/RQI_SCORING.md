# ReleaseLens Quality Index (RQI) — Mathematical Scoring Model

> **Document Status**: `SYNCHRONIZED` / `REVISED SPECIFICATION`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Mathematical Architecture

To prevent incomplete scans from presenting false confidence, RQI operates on a **Dual-Metric Architecture**:
1. **Quality Score ($S_{\text{tested}}$)**: The normalized health of all successfully executed checks [0 – 100].
2. **Coverage Completeness ($C_{\text{audit}}$)**: The percentage of the full audit surface actually evaluated [0 – 100%].
3. **Composite RQI ($RQI_{\text{comp}}$)**: A calibrated score that factors coverage into the release-readiness index.

---

## 2. Category Weights & Allocation

The full audit surface is divided into five core categories with a total weight sum of $W_{\text{total}} = 1.00$:

| Category ($i$) | Weight ($w_i$) | Tier | Measurement Signals |
| :--- | :--- | :--- | :--- |
| **1. Security & Headers ($S_{\text{sec}}$)** | 0.25 | Tier 1 | HTTPS enforcement, TLS validity/expiry (>30 days), HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Cookie secure flags. |
| **2. Performance & Vitals ($S_{\text{perf}}$)** | 0.25 | Tier 1 | Google PageSpeed Lighthouse Performance score (LCP, INP, CLS, TTFB, Speed Index). Lab metric when field data is unavailable. |
| **3. Accessibility & SEO ($S_{\text{a11y}}$)** | 0.15 | Tier 1 | Lighthouse Accessibility (contrast, ARIA, alt tags) + SEO best practices (viewport, robots.txt, canonical tag). |
| **4. Functional Integrity ($S_{\text{func}}$)** | 0.20 | Tier 2 | Unhandled JavaScript console errors, 4xx/5xx network asset drops, hydration mismatch warnings, broken internal links (up to 15 pages). |
| **5. Authentication & Contracts ($S_{\text{auth}}$)** | 0.15 | Tier 3 | Google Identity Services SDK detection, Client ID syntax, OAuth redirect parameter validity, callback route status, protected route authorization gates. |

---

## 3. Mathematical Formula

Let $T \subseteq \{1, 2, 3, 4, 5\}$ be the set of categories tested in a given run.

### Step 1: Coverage Completeness
$$C_{\text{audit}} = \sum_{i \in T} w_i \times 100\%$$

### Step 2: Tested Base Score
$$S_{\text{base}} = \frac{\sum_{i \in T} w_i \cdot S_i}{\sum_{i \in T} w_i}$$

### Step 3: Absolute Penalties ($P$)
Critical defects trigger fixed deductions that cut across category averages:
- **Critical Security Defect**: Expired or invalid TLS certificate (-35 pts).
- **Critical Functional Defect**: Uncaught JavaScript exception crashing page load (-20 pts).
- **Critical Auth Defect**: Broken OAuth callback endpoint returning 5xx or invalid redirect URI (-25 pts).
- **Severe Vulnerability**: Clickjacking risk (Missing both `X-Frame-Options` and `frame-ancestors`) (-10 pts).

### Step 4: Tested Quality Score
$$S_{\text{tested}} = \max\left(0, \min\left(100, S_{\text{base}} - P\right)\right)$$

### Step 5: Composite Release Readiness Index
$$RQI_{\text{comp}} = S_{\text{tested}} \times \left(0.50 + 0.50 \times \frac{C_{\text{audit}}}{100}\right)$$

---

## 4. Release Verdict Classification

| Verdict | Conditions | Meaning |
| :--- | :--- | :--- |
| `VERIFIED_READY` | $S_{\text{tested}} \ge 85$ **AND** $C_{\text{audit}} \ge 80\%$ | Fully audited release candidate; high confidence for production deployment. |
| `PROVISIONAL_PASS` | $S_{\text{tested}} \ge 85$ **AND** $C_{\text{audit}} < 80\%$ | High quality in public scans, but deeper/auth tiers were not evaluated. |
| `REVIEW_REQUIRED` | $70 \le S_{\text{tested}} < 85$ | Warnings, performance bottlenecks, or non-critical headers missing. |
| `RELEASE_BLOCKED` | $S_{\text{tested}} < 70$ **OR** Critical Penalty Triggered ($P \ge 20$) | High risk of user-facing breakage or security vulnerability. |

---

## 5. Worked Concrete Examples

### Example 1: Complete Audit (Tier 1 + Tier 2 + Tier 3)
- Tested categories: All 5 ($T = \{1, 2, 3, 4, 5\}$).
- Category Scores:
  - Security ($S_1$): 92 ($w_1 = 0.25$)
  - Performance ($S_2$): 88 ($w_2 = 0.25$)
  - Accessibility & SEO ($S_3$): 95 ($w_3 = 0.15$)
  - Functional Integrity ($S_4$): 90 ($w_4 = 0.20$)
  - Auth Contract ($S_5$): 100 ($w_5 = 0.15$)
- Penalties: $P = 0$.
- **Calculations**:
  - $C_{\text{audit}} = 100\%$
  - $S_{\text{base}} = (0.25 \times 92) + (0.25 \times 88) + (0.15 \times 95) + (0.20 \times 90) + (0.15 \times 100) = 23.0 + 22.0 + 14.25 + 18.0 + 15.0 = \mathbf{92.25}$
  - $S_{\text{tested}} = \mathbf{92.3}$
  - $RQI_{\text{comp}} = 92.25 \times (0.50 + 0.50 \times 1.0) = \mathbf{92.3}$
- **Verdict**: `VERIFIED_READY`

---

### Example 2: Tier 1 Public Scan Only
- Tested categories: Security ($S_1$), Performance ($S_2$), Accessibility ($S_3$). Categories 4 and 5 were NOT RUN.
- Category Scores:
  - Security ($S_1$): 90 ($w_1 = 0.25$)
  - Performance ($S_2$): 86 ($w_2 = 0.25$)
  - Accessibility & SEO ($S_3$): 92 ($w_3 = 0.15$)
- Penalties: $P = 0$.
- **Calculations**:
  - $C_{\text{audit}} = 0.25 + 0.25 + 0.15 = \mathbf{65\%}$
  - Tested weight sum: $0.65$.
  - $S_{\text{base}} = \frac{(0.25 \times 90) + (0.25 \times 86) + (0.15 \times 92)}{0.65} = \frac{22.5 + 21.5 + 13.8}{0.65} = \frac{57.8}{0.65} = \mathbf{88.9}$
  - $S_{\text{tested}} = \mathbf{88.9}$
  - $RQI_{\text{comp}} = 88.9 \times (0.50 + 0.50 \times 0.65) = 88.9 \times 0.825 = \mathbf{73.3}$
- **Display**: Quality Score 88.9 / 100 (Coverage: 65% — Public Scan Only).
- **Verdict**: `PROVISIONAL_PASS` (Warning: Functional and Auth flows unverified).

---

### Example 3: Audit with Unavailable / Inconclusive Checks
- Scenario: Target is a staging preview where Google PageSpeed fails or returns 504 timeout due to rate limits.
- Tested categories: Security ($S_1 = 85$), Accessibility ($S_3 = 90$), Functional ($S_4 = 92$). Performance ($S_2$) marked `INCONCLUSIVE`.
- Penalties: $P = 0$.
- **Calculations**:
  - Tested categories: $T = \{1, 3, 4\}$. Tested weight sum = $0.25 + 0.15 + 0.20 = 0.60$.
  - $C_{\text{audit}} = \mathbf{60\%}$
  - $S_{\text{base}} = \frac{(0.25 \times 85) + (0.15 \times 90) + (0.20 \times 92)}{0.60} = \frac{21.25 + 13.5 + 18.4}{0.60} = \frac{53.15}{0.60} = \mathbf{88.6}$
  - Inconclusive check does NOT count as 0, but is explicitly flagged as unverified coverage.
  - $RQI_{\text{comp}} = 88.6 \times (0.50 + 0.50 \times 0.60) = 88.6 \times 0.80 = \mathbf{70.9}$
- **Verdict**: `PROVISIONAL_PASS` with flag: *"Performance metrics unavailable; rerun advised"*.

---

### Example 4: Audit with Critical Failures
- Scenario: Website has valid headers and performance, but throws an uncaught JavaScript error on page load and is missing clickjacking protection.
- Tested: Tier 1 + Tier 2 ($C_{\text{audit}} = 85\%$).
- Category Scores:
  - Security ($S_1$): 70 ($w_1 = 0.25$) (Missing X-Frame-Options)
  - Performance ($S_2$): 85 ($w_2 = 0.25$)
  - Accessibility ($S_3$): 90 ($w_3 = 0.15$)
  - Functional ($S_4$): 40 ($w_4 = 0.20$) (Console crash detected)
- Base score: $\frac{(0.25 \times 70) + (0.25 \times 85) + (0.15 \times 90) + (0.20 \times 40)}{0.85} = \frac{17.5 + 21.25 + 13.5 + 8.0}{0.85} = \frac{60.25}{0.85} = 70.9$.
- Penalties:
  - Uncaught JS Crash: -20 pts.
  - Clickjacking risk: -10 pts.
  - Total $P = 30$ pts.
- **Calculations**:
  - $S_{\text{tested}} = \max(0, 70.9 - 30) = \mathbf{40.9}$
  - $RQI_{\text{comp}} = 40.9 \times (0.50 + 0.50 \times 0.85) = 40.9 \times 0.925 = \mathbf{37.8}$
- **Verdict**: `RELEASE_BLOCKED` (Critical defects detected: Page-load JavaScript exception).
