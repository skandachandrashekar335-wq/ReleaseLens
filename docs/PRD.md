# Product Requirements Document (PRD) — ReleaseLens

> **Document Status**: `PROPOSED` / `INITIAL BASELINE`  
> **Last Synchronized**: 2026-11-03  
> **Target Release**: MVP v0.1.0  

---

## 1. Executive Summary

**ReleaseLens** is an intelligent release evaluation, risk scoring, and governance platform. It provides engineering teams, release managers, and cross-functional stakeholders with visibility into code changes, deployment blast radiuses, automated test integrity, and objective release safety metrics.

At its core, ReleaseLens introduces the **Release Quality Index (RQI)**—a weighted, verifiable scoring model that transforms pull requests, commits, CI/CD signals, and automated worker verifications into an actionable health score before code reaches production.

---

## 2. Problem Statement & Target Personas

### 2.1 The Problem
1. **Blind Releases**: Teams merge PRs without clear visibility into architectural impact or schema drift.
2. **Subjective Sign-Offs**: "Ready to deploy" decisions are often based on intuition rather than quantifiable risk metrics.
3. **Information Silos**: Developers see raw code diffs; product managers and customer success teams receive no digestible summary until customers encounter issues.
4. **Unverified UI & Workflow Integrity**: CI unit tests pass, but user-facing flows and browser regressions go unnoticed without headless/worker validation.

### 2.2 Target Personas
- **Engineering Leads & Release Engineers**: Need clear risk blast-radius analysis, dependency review, and automated gating.
- **Developers**: Need immediate feedback on PR risk score, breaking changes, and automated release note drafts.
- **Product Managers & Customer Success**: Need tailored, non-technical release notes, feature summaries, and changelog updates.

---

## 3. High-Level Capabilities & Functional Requirements

| Capability | Priority | Status | Description |
| :--- | :--- | :--- | :--- |
| **Git / PR Diff Ingestion** | Must-Have | `PLANNED` | Parse Git commits, PR metadata, unified diffs, and changed file paths. |
| **RQI (Release Quality Index)** | Must-Have | `PLANNED` | Multi-factor risk scoring engine evaluating blast radius, test coverage, schema migrations, and churn. |
| **Multi-Audience Release Notes** | Must-Have | `PLANNED` | Automated generation of technical changelogs, executive summaries, and customer-facing notes. |
| **Cloud / Browser Worker Execution** | Should-Have | `PROPOSED` | Isolated worker environment to execute health checks, smoke tests, and browser verification passes. |
| **Policy Gating & Thresholds** | Should-Have | `PLANNED` | Configurable rules (e.g. Block release if RQI < 75 or critical breaking changes detected). |
| **Interactive Release Dashboard** | Must-Have | `PLANNED` | Responsive web UI to visualize releases, inspect file diff impacts, and view RQI breakdowns. |

---

## 4. Acceptance Criteria (MVP Baseline)

1. **Analysis Accuracy**: The engine correctly parses commit diffs, categorizes change types (Feature, Fix, Breaking, Migration, Chore), and flags high-risk modifications (database schemas, auth routes).
2. **Deterministic RQI**: Given the same diff and CI metrics, the RQI engine outputs a consistent, explainable score from 0 to 100 with explicit factor contributions.
3. **Audience-Specific Views**: Users can toggle between Engineering, Product, and Stakeholder views for any evaluated release candidate.
4. **Zero Silent Failures**: All validation, parsing, and worker errors surface clear diagnostic feedback to the user.
