# Contributing to ReleaseLens

Thank you for contributing to ReleaseLens. All contributors (engineers and AI agents) are bound by the project governance detailed in [AGENTS.md](file:///Users/skandachandrashekar335/projects/ReleaseLens/AGENTS.md).

---

## 1. Golden Rules of Development

1. **Continuous Documentation Synchronization**: No code changes will be approved or merged without the corresponding updates to documentation in `docs/` and `README.md`.
2. **Empirical Evidence Only**: Never mark a test passed or feature complete unless verified with real execution evidence. Record test results in `docs/TEST_RESULTS.md`.
3. **Architecture Decisions**: When adding third-party libraries, altering the schema, or introducing new architectural patterns, create or append an Architecture Decision Record (ADR) in `docs/DECISIONS.md`.
4. **Zero Untyped / Swallow Exceptions**: All error paths must be handled cleanly and logged safely without leaking sensitive tokens or PII.

---

## 2. Development Workflow

1. **Check Out Branch**: Branch naming conventions:
   - `feat/<feature-name>`
   - `fix/<bug-description>`
   - `docs/<doc-update>`
2. **Implement & Test**: Write unit, integration, and contract tests alongside feature code.
3. **Synchronize Docs**: Update the relevant files across `docs/` (`PRD.md`, `ARCHITECTURE.md`, `API_CONTRACTS.md`, etc.).
4. **Verify Locally**: Execute test suites and verify static analysis before submitting.
