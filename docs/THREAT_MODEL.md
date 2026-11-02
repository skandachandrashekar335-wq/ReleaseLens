# Threat Model (STRIDE) — ReleaseLens

> **Document Status**: `INITIAL BASELINE` / `PROPOSED`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Threat Surface Overview

ReleaseLens ingests Git diffs, parses code changes, triggers browser/cloud workers, and synthesizes release summaries. The threat boundary encompasses:
- Git Ingestion API (REST & Webhooks).
- Diff & AST Parsing Engine.
- Cloud/Browser Execution Worker.
- LLM / Synthesis Prompts.
- Dashboard & Storage Store.

---

## 2. STRIDE Assessment Matrix

| Threat Category | Potential Attack Vector | Impact | Mitigations |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Attacker spoofs GitHub webhook payloads or sends fake commit signatures. | Inaccurate RQI scores, false release sign-offs. | HMAC SHA-256 signature verification on webhooks; token authentication on internal API routes. |
| **Tampering** | Malicious commit diff containing embedded injection payloads intended to manipulate LLM synthesis or escape worker sandbox. | Prompt injection, biased release reports, sandbox breach. | Treat diff text as untrusted raw string data; enforce prompt isolation; run workers in ephemeral unprivileged containers. |
| **Repudiation** | Release approval or gating override performed without audit trail. | Inability to identify who authorized risky deployment. | Immutable audit log stored for every evaluation and policy override. |
| **Information Disclosure** | Secret keys, passwords, or PII contained within committed code diffs exposed in reports or logs. | Credential compromise. | Built-in regex secret scrubbing masks API keys (`sk-...`, tokens, passwords) before persisting diff summaries. |
| **Denial of Service** | Massive 100MB+ minified or binary diffs uploaded to exhaust memory and CPU during parsing. | API degradation, worker thread lock. | Max diff payload cap (e.g. 5MB); reject binary files; parser timeout enforcement. |
| **Elevation of Privilege** | Sandboxed browser worker exploits container kernel to escape to host system. | Host system compromise. | Rootless container execution, seccomp profiles, restricted network namespaces. |
