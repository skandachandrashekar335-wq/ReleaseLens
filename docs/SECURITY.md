# Security Architecture & Authorization Rules — ReleaseLens

> **Document Status**: `SYNCHRONIZED`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Ethical & Legal Auditing Boundaries

ReleaseLens enforces strict rules to prevent misuse as a denial-of-service tool or unauthorized vulnerability scanner:

1. **URL Submission Is NOT Authorization**:
   - Submitting a URL grants permission **only** for Tier 1 (Public, passive inspection: standard HTTP `GET` requests, public Google PageSpeed queries, and public SSL handshake).
2. **Mandatory Proof of Ownership for Active Tests (Tier 2 & 3)**:
   - Deep crawls, broken link scanning, automated form checks, or authenticated flows **require active domain ownership verification**.
3. **Verification Mechanisms**:
   - **HTML Meta Tag**: `<meta name="releaselens-verification" content="rl_verify_<uuid>">`
   - **Well-Known Verification File**: `https://<domain>/.well-known/releaselens-verify.txt` (Instant verification for Vercel/Next.js/SPA preview deployments).
   - **DNS TXT Record**: `_releaselens-challenge.<domain>`
4. **Credential Isolation**:
   - For Tier 3 authenticated testing, test credentials must never be shared in chat or committed to git. They are encrypted at rest using AES-GCM-256 with keys stored in cloud environment variables.

---

## 2. Authentication & Data Protection

- **Google OAuth**: User sign-in uses Google OAuth 2.0 via Supabase Auth.
- **Row-Level Security (RLS)**: Enforced at the database layer; users cannot read or trigger audits on other users' registered private sites.
