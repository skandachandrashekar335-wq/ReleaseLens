import path from "path";

/**
 * ReleaseLens Payload & File Upload Guard
 * Validates payload size, magic-byte MIME signatures, and sanitizes filenames.
 */

export interface UploadValidationOptions {
  maxSizeBytes?: number;
  allowedMimes?: string[];
}

export interface UploadValidationResult {
  valid: boolean;
  sanitizedFilename: string;
  detectedMime?: string;
  sizeBytes: number;
  error?: string;
}

const DEFAULT_MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

const ALLOWED_MIME_TYPES = [
  "application/json",
  "image/png",
  "image/jpeg",
  "application/pdf",
];

/**
 * Sanitizes a filename, stripping directory path traversals, null bytes,
 * and dangerous shell characters.
 */
export function sanitizeFilename(rawFilename: string): string {
  if (!rawFilename || typeof rawFilename !== "string") {
    return `upload_${Date.now()}.bin`;
  }

  // Remove null bytes and normalize Windows backslashes to forward slashes
  let clean = rawFilename.replace(/\0/g, "").replace(/\\/g, "/");

  // Extract base filename (removes ../ and /)
  clean = path.basename(clean);

  // Strip consecutive dots (prevent directory traversal remnants like ..)
  clean = clean.replace(/\.{2,}/g, "_");

  // Keep only safe characters: alphanumeric, dash, underscore, dot
  clean = clean.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Prevent hidden file or leading dot artifact
  clean = clean.replace(/^\.+/, "");

  if (!clean || clean === "_") {
    return `upload_${Date.now()}.bin`;
  }

  return clean;
}

/**
 * Detect MIME type using strict magic-byte signatures
 */
export function detectMagicMime(buffer: Uint8Array): string | null {
  if (!buffer || buffer.length === 0) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // JPEG: FF D8 FF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  // PDF: 25 50 44 46 (%PDF)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return "application/pdf";
  }

  // JSON: check if valid UTF-8 JSON starting with '{' or '['
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    const trimmed = text.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      JSON.parse(trimmed);
      return "application/json";
    }
  } catch {}

  return null;
}

/**
 * Validates file/payload upload against size, magic bytes, and filename safety
 */
export function validateUploadPayload(
  payload: Buffer | Uint8Array | string,
  rawFilename: string,
  options: UploadValidationOptions = {}
): UploadValidationResult {
  const maxBytes = options.maxSizeBytes || DEFAULT_MAX_SIZE_BYTES;
  const allowed = options.allowedMimes || ALLOWED_MIME_TYPES;

  let buffer: Uint8Array;
  if (typeof payload === "string") {
    buffer = new TextEncoder().encode(payload);
  } else if (Buffer.isBuffer(payload)) {
    buffer = new Uint8Array(payload);
  } else {
    buffer = payload;
  }

  const sizeBytes = buffer.byteLength;
  const sanitizedFilename = sanitizeFilename(rawFilename);

  // 1. Max size enforcement
  if (sizeBytes > maxBytes) {
    return {
      valid: false,
      sanitizedFilename,
      sizeBytes,
      error: `Payload size (${(sizeBytes / 1024).toFixed(1)} KB) exceeds maximum limit of ${(maxBytes / 1024).toFixed(1)} KB.`,
    };
  }

  // 2. Minimum length check
  if (sizeBytes === 0) {
    return {
      valid: false,
      sanitizedFilename,
      sizeBytes: 0,
      error: "Payload cannot be empty.",
    };
  }

  // 3. Magic-byte verification
  const detectedMime = detectMagicMime(buffer);
  if (!detectedMime) {
    return {
      valid: false,
      sanitizedFilename,
      sizeBytes,
      error: "Unsupported file content: Magic-byte inspection failed. Allowed formats: PNG, JPEG, PDF, JSON.",
    };
  }

  if (!allowed.includes(detectedMime)) {
    return {
      valid: false,
      sanitizedFilename,
      detectedMime,
      sizeBytes,
      error: `MIME type '${detectedMime}' is not permitted by upload policy. Allowed: ${allowed.join(", ")}.`,
    };
  }

  return {
    valid: true,
    sanitizedFilename,
    detectedMime,
    sizeBytes,
  };
}
