/**
 * ReleaseLens Safe Structured Logger
 * Automatically redacts tokens, credentials, cookies, and secret keys
 * to prevent accidental sensitive data leakage into logs or telemetry.
 */

const SENSITIVE_KEY_PATTERNS = [
  /authorization/i,
  /cookie/i,
  /token/i,
  /idtoken/i,
  /password/i,
  /secret/i,
  /apikey/i,
  /privatekey/i,
  /credential/i,
  /jwt/i,
  /session/i,
  /bearer/i,
];

const SECRET_STRING_REGEXES = [
  /Bearer\s+[A-Za-z0-9._~+/-]+/gi,
  /AIza[0-9A-Za-z-_]{35}/g,
  /-----BEGIN [A-Z ]+KEY-----[\s\S]*?-----END [A-Z ]+KEY-----/g,
  /ey[A-Za-z0-9_-]{10,}\.ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, // JWT
];

export function redactString(str: string): string {
  if (typeof str !== "string") return str;
  let result = str;
  for (const regex of SECRET_STRING_REGEXES) {
    result = result.replace(regex, "[REDACTED_SECRET]");
  }
  return result;
}

export function redactData(data: any, depth = 0): any {
  if (depth > 8) return "[MAX_DEPTH]";
  if (data === null || data === undefined) return data;

  if (typeof data === "string") {
    return redactString(data);
  }

  if (typeof data === "number" || typeof data === "boolean") {
    return data;
  }

  if (data instanceof Error) {
    return {
      name: data.name,
      message: redactString(data.message),
      stack: data.stack ? redactString(data.stack) : undefined,
    };
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactData(item, depth + 1));
  }

  if (typeof data === "object") {
    const cleansed: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) =>
        pattern.test(key)
      );
      if (isSensitive) {
        cleansed[key] = "[REDACTED]";
      } else {
        cleansed[key] = redactData(val, depth + 1);
      }
    }
    return cleansed;
  }

  return "[UNSUPPORTED]";
}

class SafeLogger {
  private format(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const sanitizedMsg = redactString(message);
    const sanitizedMeta = meta !== undefined ? redactData(meta) : undefined;

    if (process.env.NODE_ENV === "production") {
      return JSON.stringify({
        timestamp,
        level,
        message: sanitizedMsg,
        ...(sanitizedMeta !== undefined ? { data: sanitizedMeta } : {}),
      });
    }

    const metaStr =
      sanitizedMeta !== undefined
        ? ` ${JSON.stringify(sanitizedMeta)}`
        : "";
    return `[${timestamp}] [${level}] ${sanitizedMsg}${metaStr}`;
  }

  info(message: string, meta?: any): void {
    console.log(this.format("INFO", message, meta));
  }

  warn(message: string, meta?: any): void {
    console.warn(this.format("WARN", message, meta));
  }

  error(message: string, meta?: any): void {
    console.error(this.format("ERROR", message, meta));
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.format("DEBUG", message, meta));
    }
  }
}

export const safeLogger = new SafeLogger();
