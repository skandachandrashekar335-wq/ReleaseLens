# Data Privacy, Retention & Scrubbing — ReleaseLens

> **Document Status**: `INITIAL BASELINE`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Data Classification

ReleaseLens categorizes data into three operational tiers:

| Tier | Description | Retention Policy | Scrubbing Rule |
| :--- | :--- | :--- | :--- |
| **Tier 1: Transient Diff Payloads** | Full unified diff text, commit hunk lines, raw source snippets. | 24–48 hours (Ephemeral Cache) | Automatically purged after evaluation and report generation. |
| **Tier 2: Release Metadata & RQI Metrics** | File paths changed, additions/deletions count, RQI score, factor breakdown. | Indefinite (Project Audit History) | Kept for historical trend analysis; contains zero source code bodies. |
| **Tier 3: Credentials & Access Tokens** | GitHub PATs, OAuth tokens, webhook secrets. | Ephemeral in-memory only | Never stored in plain text or logged to disk. |

---

## 2. Automated Secret & PII Scrubbing

Before diff text is processed or stored, the scrubbing engine applies deterministic filters:
1. **API Keys & Tokens**: Matches against common formats (e.g. `sk-[a-zA-Z0-9]{32}`, `ghp_[a-zA-Z0-9]{36}`, AWS key patterns).
2. **Connection Strings & Passwords**: Strips `password=...`, `postgres://user:pass@host...`.
3. **Personal Identifiable Information**: Sanitizes author emails where configured for privacy.
