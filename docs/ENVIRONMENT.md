# Environment Configuration & Secret Management — ReleaseLens

> **Document Status**: `INITIAL BASELINE`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Environment Configuration Principles

- **No Secrets in Source Control**: Never commit `.env` or files containing live credentials.
- **Strict Placeholder Convention**: `.env.example` must contain only valid placeholder names and safe default values.
- **Runtime Validation**: Application startup verifies all required environment variables and crashes fast with actionable error messages if missing.

---

## 2. Environment Variables Specification

| Variable Name | Required | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | `development` | Environment mode (`development`, `test`, `production`) |
| `PORT` | No | `3000` | HTTP port for the web dashboard & API |
| `DATABASE_URL` | Yes | `file:./dev.db` | Connection string for SQLite / PostgreSQL |
| `GITHUB_APP_ID` | No | `""` | Optional GitHub integration App ID |
| `GITHUB_WEBHOOK_SECRET` | No | `""` | HMAC secret for verifying GitHub webhook deliveries |
| `WORKER_ISOLATION_DRIVER` | No | `local_process` | Runner driver (`local_process`, `docker`, `cloud_sandbox`) |
| `LLM_API_KEY` | No | `""` | Optional API key for AI-assisted audience synthesis |
