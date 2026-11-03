# Security Architecture & Authorization Rules — ReleaseLens

> **Document Status**: `SYNCHRONIZED` / `REVISED SPECIFICATION (ROUND 4)`  
> **Last Synchronized**: 2026-11-03  

---

## 1. Ethical & Legal Auditing Boundaries

ReleaseLens enforces strict rules to prevent misuse as a denial-of-service tool or unauthorized vulnerability scanner:

1. **URL Submission Is NOT Authorization**:
   - Submitting a URL grants permission **only** for Tier 1 (Public, passive inspection: standard HTTP `GET` requests, public Google PageSpeed queries, and public SSL handshake).
2. **Mandatory Proof of Ownership for Active Tests (Tier 2 & 3)**:
   - Deep crawls, broken link scanning, automated form checks, or authenticated flows **require active domain ownership verification**.
3. **Verification Mechanisms & Origin Integrity**:
   - **HTML Meta Tag**: `<meta name="releaselens-verification" content="rl_verify_<256_bit_token>">`
   - **Well-Known Verification File**: `https://<origin>/.well-known/releaselens-verify.txt` (Instant verification for Vercel/Next.js/SPA preview deployments).
   - **DNS TXT Record**: `_releaselens-challenge.<domain>` with value `rl_verify_<256_bit_token>`.
   - **Origin Matching & Redirect Policy**: Verification strictly requires origin matching (protocol, host, port). Same-domain HTTP to HTTPS redirects are allowed; **cross-domain redirects are rejected**. Verification challenges expire after 7 days if unverified.

---

## 2. Comprehensive Browser Network Isolation

Application-level Playwright route interception (`page.route`) cannot block native WebRTC UDP packets or native socket rebinding. ReleaseLens implements a **Two-Tier Defense-in-Depth Architecture (ADR-019)**:

### Layer 1: Infrastructure / Kernel Egress Firewall (OS Level)
Executed inside the container runner environment prior to launching Chromium:
```bash
# Block all outbound traffic to RFC-1918 private subnets
iptables -A OUTPUT -d 10.0.0.0/8 -j DROP
iptables -A OUTPUT -d 172.16.0.0/12 -j DROP
iptables -A OUTPUT -d 192.168.0.0/16 -j DROP

# Block loopback and link-local cloud metadata
iptables -A OUTPUT -d 127.0.0.0/8 -j DROP
iptables -A OUTPUT -d 169.254.169.254/32 -j DROP
iptables -A OUTPUT -d 100.100.100.100/32 -j DROP

# Block all outbound UDP except DNS (port 53) to eliminate WebRTC data-channel leakage
iptables -A OUTPUT -p udp --dport 53 -j ACCEPT
iptables -A OUTPUT -p udp -j DROP
```

### Layer 2: Application / Playwright Route Interception (CDP Level)
```typescript
await page.route('**/*', async (route) => {
  const url = new URL(route.request().url());

  // Protocol check
  if (!['http:', 'https:'].includes(url.protocol)) {
    return route.abort('blockedbyclient');
  }

  // Port check
  if (url.port && !['80', '443', ''].includes(url.port)) {
    return route.abort('blockedbyclient');
  }

  // Pre-resolve destination hostname against IP blacklist
  const isSafe = await validateDestinationIp(url.hostname);
  if (!isSafe) {
    return route.abort('blockedbyclient');
  }

  route.continue();
});
```

### Context-Level Hardening:
- Service workers disabled: `context.setServiceWorkers('block')`.
- File downloads cancelled: `context.on('download', d => d.cancel())`.
- Permissions denied: Geolocation, camera, microphone, notifications.

---

## 3. Allowlist-Based Privacy & Evidence Sanitization

ReleaseLens enforces a **deny-by-default** data collection model:
1. **HTTP Headers**: Only 6 security headers are retained (`content-security-policy`, `strict-transport-security`, `x-frame-options`, `x-content-type-options`, `referrer-policy`, `permissions-policy`). All cookies, authorization headers, and custom headers are dropped.
2. **URL Query Stripping**: Query parameters and hash fragments are stripped from all logged subresource URLs.
3. **DOM & Forms**: Zero form values, passwords, or raw body dumps are stored. Only metadata elements (`title`, `meta`, `script[src]`) are captured.
4. **AI Assistant Isolation**: The conversational AI assistant is completely **toolless** and operates strictly in read-only mode, ingesting structured evidence inside `<untrusted_evidence>` boundary tags.
