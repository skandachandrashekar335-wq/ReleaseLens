# Test Strategy & Quality Plan — ReleaseLens

> **Document Status**: `SYNCHRONIZED` / `RESET TO TESTING & BUG DISCOVERY PLATFORM`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Testing Philosophy

As a testing and bug discovery platform, ReleaseLens must hold itself to the highest standard of **empirical verification**:
1. **Zero Fabricated Outcomes**: No test is ever recorded as passed in documentation or reports unless actually executed and observed in the environment.
2. **Dual Verification Scope**:
   - Automated quality probes (TLS, headers, broken links, PageSpeed).
   - Manual bug logging and retest lifecycle verification.
3. **Contract & Regression Testing**:
   - API endpoints, payload validation, and RQI scoring formulas are validated with unit and integration tests.
   - Retest workflows (`OPEN` $\to$ `FIXED` $\to$ `VERIFIED`) are tested against edge cases.

---

## 2. Test Matrix for MVP (v0.1.0)

| Test Layer | Framework / Tools | Scope | Status |
| :--- | :--- | :--- | :--- |
| **Unit Tests** | Vitest | RQI scoring engine, 4-state hard gate logic, evidence sanitization, release delta math. | `PLANNED` |
| **Integration Tests** | Supertest / Node Test Runner | Project registration, automated audit dispatch, bug CRUD, retest transitions, shareable reports. | `PLANNED` |
| **E2E Tests** | Playwright | Full tester journey: Register app -> run audit -> log bug with steps -> mark fixed -> retest & verify. | `PLANNED` |
| **Security Audits** | Static Analysis / ESLint | Deny-by-default header filtering, SSRF IP validation, prompt injection delimiting. | `PLANNED` |

---

## 3. Test Execution Standard

Every recorded test execution in `docs/TEST_RESULTS.md` must capture:
- Execution timestamp and runtime environment.
- Exact invocation command.
- Passed, failed, and skipped counts.
- Known issues and reproduction steps.
- If a test was not run, record strictly `NOT RUN`.
