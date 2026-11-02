# STRIDE Threat Model — ReleaseLens

> **Document Status**: `SYNCHRONIZED`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Threat Matrix

| Threat (STRIDE) | Attack Vector | Impact | Engineering Mitigation |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Attacker claims ownership of `google.com` or competitor domain to run intrusive scans. | Unauthorized active testing against external sites. | Cryptographic verification token checked via HTTP GET to `/.well-known/releaselens-verify.txt` or meta-tag before granting Tier 2/3 permissions. |
| **Tampering** | User manipulates audit request payload to target internal cloud metadata IP (`http://169.254.169.254` or `localhost`). | SSRF (Server-Side Request Forgery) attacking internal infrastructure. | SSRF filter: Restrict inspection targets to public domain names; strictly disallow RFC-1918 private IPs, loopback (`127.0.0.1`), and AWS/GCP metadata addresses. |
| **Repudiation** | User denies triggering an aggressive crawl on an external site. | Legal exposure. | Immutable audit log records `user_id`, timestamp, source IP, and target domain for all initiated inspections. |
| **Information Disclosure** | Test credentials used for authenticated testing leak via audit logs or AI assistant chat. | Compromise of target application test accounts. | Test credentials are scrubbed from all logs, network traces, and DOM dumps before storage or LLM prompt inclusion. |
| **Denial of Service** | Malicious actor repeatedly triggers audits to exhaust free-tier quotas (PageSpeed, Gemini, Supabase). | System outage or throttling for legitimate users. | Per-user rate limiting (e.g. 5 audits per hour on free tier) and serverless execution timeouts (max 45 seconds). |
| **Elevation of Privilege** | User attempts to bypass Tier 1 restrictions without completing verification. | Unauthorized Tier 2/3 execution. | API handlers and database RLS enforce `website.is_verified == true` before allowing Tier 2/3 jobs to queue. |
