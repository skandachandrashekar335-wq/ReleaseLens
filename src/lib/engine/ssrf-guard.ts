import dns from "dns/promises";
import net from "net";

export interface SsrfValidationResult {
  isAllowed: boolean;
  resolvedIp?: string;
  reason?: string;
}

// Private IPv4 and IPv6 CIDR blocks to prevent Server-Side Request Forgery (SSRF)
const BLOCKED_IP_PATTERNS = [
  /^127\./,                         // Loopback (127.0.0.0/8)
  /^10\./,                          // Private Class A (10.0.0.0/8)
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B (172.16.0.0/12)
  /^192\.168\./,                    // Private Class C (192.168.0.0/16)
  /^169\.254\./,                    // Link-local / AWS / GCP / Azure metadata (169.254.0.0/16)
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, // CGNAT (100.64.0.0/10)
  /^0\./,                           // Current network
  /^::1$/,                          // IPv6 Loopback
  /^::$|^::0$/,                     // IPv6 Unspecified
  /^fe80:/i,                        // IPv6 Link-local
  /^fc00:/i,                        // IPv6 Unique local address
  /^fd00:/i,                        // IPv6 Unique local address
  /^::ffff:(127\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|169\.254\.)/i, // IPv4-mapped IPv6
  /^255\.255\.255\.255$/,           // Broadcast
];

const BLOCKED_HOSTNAMES = [
  "localhost",
  "metadata.google.internal",
  "169.254.169.254",
  "instance-data",
  "localhost.localdomain",
];

const BLOCKED_EXTENSIONS = [
  ".internal",
  ".local",
  ".localhost",
  ".test",
  ".onion",
  ".lan",
];

export interface SsrfOptions {
  allowDataUrls?: boolean;
}

export async function validateTargetUrl(
  targetUrl: string,
  options: SsrfOptions = {}
): Promise<SsrfValidationResult> {
  let url: URL;
  try {
    url = new URL(targetUrl);
  } catch {
    return { isAllowed: false, reason: "Malformed URL format" };
  }

  // Allow data: URLs strictly when explicitly enabled for unit tests
  if (options.allowDataUrls && url.protocol === "data:") {
    return { isAllowed: true, resolvedIp: "data-uri" };
  }

  // 1. Protocol check: HTTP / HTTPS only
  if (!["http:", "https:"].includes(url.protocol)) {
    return { isAllowed: false, reason: `Unsupported protocol: ${url.protocol}. Only HTTP and HTTPS are permitted.` };
  }

  const hostname = url.hostname.toLowerCase().trim();

  // 2. Direct hostname blocklist
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return { isAllowed: false, reason: `Direct access to host '${hostname}' is prohibited (SSRF defense).` };
  }

  // 3. Blocked domain suffixes
  if (BLOCKED_EXTENSIONS.some((ext) => hostname.endsWith(ext))) {
    return { isAllowed: false, reason: `Domain suffix '${hostname}' belongs to a private or reserved network.` };
  }

  // 4. If hostname is already a raw IP literal
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      return { isAllowed: false, resolvedIp: hostname, reason: `IP literal '${hostname}' belongs to private/reserved subnet.` };
    }
    return { isAllowed: true, resolvedIp: hostname };
  }

  // 5. DNS Resolution check (prevent DNS rebinding to private IPs)
  try {
    const lookup = await dns.lookup(hostname, { all: true });
    if (!lookup || lookup.length === 0) {
      return { isAllowed: false, reason: `DNS lookup failed: Hostname '${hostname}' could not be resolved.` };
    }

    for (const record of lookup) {
      if (isPrivateIp(record.address)) {
        return {
          isAllowed: false,
          resolvedIp: record.address,
          reason: `DNS resolved '${hostname}' to private IP address ${record.address}. Blocked under SSRF policy.`,
        };
      }
    }

    return { isAllowed: true, resolvedIp: lookup[0].address };
  } catch (err: any) {
    return { isAllowed: false, reason: `DNS lookup error: ${err.message || "Hostname resolution failed"}` };
  }
}

export function isPrivateIp(ip: string): boolean {
  return BLOCKED_IP_PATTERNS.some((pattern) => pattern.test(ip));
}
