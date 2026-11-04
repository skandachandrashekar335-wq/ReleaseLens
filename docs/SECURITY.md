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


---

## 4. Multi-Tenant Server-Side IDOR Enforcement & Zero-Trust Authorization

Because the backend database adapter uses `SUPABASE_SERVICE_ROLE_KEY` in production, PostgreSQL Row Level Security (RLS) policies are bypassed automatically. ReleaseLens therefore enforces strict application-level zero-trust tenant isolation in TypeScript (ADR-027):

1. **Strict Ownership Verification**:
   - `GET /api/projects`, `GET /api/projects/[id]`, `DELETE /api/projects/[id]`, `POST /api/projects/[id]/audit`
   - `GET /api/findings?projectId=...`, `GET /api/bugs?projectId=...`
   - `POST /api/assistant/chat`
   - Every handler extracts the caller's authenticated `userId` from the session token and verifies `project.userId === auth.user.id`. The shared `user_demo_1` bypass has been completely eliminated. Unauthenticated access returns `401 Unauthorized`; cross-tenant access returns `403 Forbidden`.

2. **Dedicated Read-Only Public Demo Scope**:
   - Only the designated sample project `proj_hackathon_demo` is publicly viewable.
   - Demo content is strictly immutable: attempts to delete the demo project, execute audits, triage findings, modify bugs, or record retests are rejected with `403 Forbidden`.

3. **Entity Scoping & Write Protection**:
   - Writes to findings (`PATCH /api/findings/[id]`), bugs (`POST /api/bugs`, `PATCH /api/bugs/[id]`), and retests (`POST /api/bugs/[id]/retest`) require authenticated ownership of the parent project. Client-supplied `userId` parameters in request payloads are discarded in favor of the verified session identity.

---

## 5. Fail-Closed Production Configuration & OAuth Policy

1. **Database Provider Selection**:
   - `createDataStore()` inspects `DATABASE_PROVIDER`. If set to `supabase`, it strictly requires valid, non-placeholder `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. If either is missing, the application crashes on startup rather than silently falling back to local SQLite.

2. **Google OAuth Production Fail-Closed**:
   - In production (`NODE_ENV === "production"`), the development mock login endpoint (`/api/auth/google?email=...`) is strictly disabled and returns `503 Service Unavailable`.
   - Production authentication strictly requires real OAuth authorization code exchange (`exchangeCodeForSession`) via Supabase Auth or Google Cloud credentials.


---

## 5. Firebase Authentication Architecture & Token Security (v0.7.0, ADR-028)

ReleaseLens utilizes Firebase Authentication as its primary Identity Provider with server-side validation enforced by the Firebase Admin SDK:

1. **Client Identity & Token Retrieval**:
   - Google Sign-In is executed via the official Firebase Client SDK (`GoogleAuthProvider`, `signInWithPopup`).
   - The client never issues database writes directly from the browser; instead, it retrieves a cryptographically signed Firebase ID token (`getIdToken()`) and posts it to `/api/auth/session`.
2. **Server-Side Token Verification & Zero-Trust Derivation**:
   - The Next.js API server utilizes `firebase-admin/auth` (`admin.auth().verifyIdToken(idToken, true)`).
   - Identity (`userId`) is derived **exclusively from `decodedToken.uid`**. The server discards and ignores any client-supplied `userId`, `role`, or `email` payload parameters to prevent identity spoofing and privilege escalation.
3. **Session Cookies & Transport Security**:
   - Upon token validation, the server issues an application session token stored in the `sessions` table.
   - The token is delivered to the browser inside an `httpOnly`, `SameSite=Lax`, `Secure` (production) cookie named `releaselens_session`.
   - Direct API consumers may alternatively pass `Authorization: Bearer <idToken>`.
4. **Session Termination & Invalidation**:
   - Calling `DELETE /api/auth/session` removes the session from the database and sets the cookie max-age to 0.
   - Client calls `signOut(auth)` on the Firebase Client SDK to clear client-side token caches.
5. **Fail-Closed Provider Security**:
   - If Firebase Admin credentials are not provisioned in the deployment environment, all ID token exchanges return HTTP 503 (`FIREBASE_NOT_CONFIGURED`) rather than falling back to unauthenticated development sessions.
