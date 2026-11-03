import * as tls from "tls";
import { URL } from "url";
import { AutomatedCheck } from "../types";

export interface TlsInspectionResult {
  check: AutomatedCheck;
  daysRemaining: number;
  validTo: string;
  issuer: string;
  subject: string;
}

export async function inspectTlsCertificate(targetUrl: string, auditRunId: string): Promise<TlsInspectionResult> {
  const parsed = new URL(targetUrl);
  const host = parsed.hostname;
  const port = parsed.port ? parseInt(parsed.port, 10) : 443;

  return new Promise((resolve) => {
    // If not HTTPS
    if (parsed.protocol !== "https:") {
      resolve({
        check: {
          id: `check_tls_${Date.now()}`,
          auditRunId,
          category: "TLS",
          checkName: "TLS & Certificate Validity",
          status: "FAIL",
          score: 0,
          weight: 0.15,
          rawEvidence: { error: "Target is served over plain HTTP without TLS." },
          errorMessage: "Target is not using HTTPS.",
          timestamp: new Date().toISOString(),
        },
        daysRemaining: 0,
        validTo: "",
        issuer: "None",
        subject: host,
      });
      return;
    }

    const socket = tls.connect(
      {
        host,
        port,
        servername: host,
        timeout: 5000,
        rejectUnauthorized: false, // We inspect the cert explicitly
      },
      () => {
        const cert = socket.getPeerCertificate();
        const authorized = socket.authorized;
        const authError = socket.authorizationError;

        socket.end();

        if (!cert || Object.keys(cert).length === 0) {
          resolve({
            check: {
              id: `check_tls_${Date.now()}`,
              auditRunId,
              category: "TLS",
              checkName: "TLS & Certificate Validity",
              status: "FAIL",
              score: 0,
              weight: 0.15,
              rawEvidence: { error: "No peer certificate presented by server." },
              errorMessage: "No TLS certificate found.",
              timestamp: new Date().toISOString(),
            },
            daysRemaining: 0,
            validTo: "",
            issuer: "Unknown",
            subject: host,
          });
          return;
        }

        const validTo = new Date(cert.valid_to);
        const now = new Date();
        const diffMs = validTo.getTime() - now.getTime();
        const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const issuerRaw = typeof cert.issuer === "object" ? cert.issuer.O || cert.issuer.CN || "Unknown" : "Unknown";
        const issuerName = Array.isArray(issuerRaw) ? issuerRaw.join(", ") : String(issuerRaw);
        const subjectRaw = cert.subject?.CN || host;
        const subjectName = Array.isArray(subjectRaw) ? subjectRaw.join(", ") : String(subjectRaw);

        let status: "PASS" | "FAIL" = "PASS";
        let score = 100;
        let errorMessage: string | undefined;

        if (!authorized) {
          status = "FAIL";
          score = 0;
          errorMessage = `Certificate validation error: ${authError || "Untrusted certificate authority"}`;
        } else if (daysRemaining <= 0) {
          status = "FAIL";
          score = 0;
          errorMessage = `Certificate is EXPIRED (expired on ${cert.valid_to}).`;
        } else if (daysRemaining <= 2) {
          status = "FAIL";
          score = 20;
          errorMessage = `Certificate is in imminent expiry failure (${daysRemaining} days remaining).`;
        } else if (daysRemaining <= 14) {
          status = "PASS";
          score = 75; // Minor deduction for short renewal window
          errorMessage = `Certificate expiring in ${daysRemaining} days. Automated renewal recommended.`;
        }

        resolve({
          check: {
            id: `check_tls_${Date.now()}`,
            auditRunId,
            category: "TLS",
            checkName: "TLS & Certificate Validity",
            status,
            score,
            weight: 0.15,
            rawEvidence: {
              subject: subjectName,
              issuer: issuerName,
              validFrom: cert.valid_from,
              validTo: cert.valid_to,
              daysRemaining,
              authorized,
              authorizationError: authError || null,
              serialNumber: cert.serialNumber,
            },
            errorMessage,
            timestamp: new Date().toISOString(),
          },
          daysRemaining,
          validTo: cert.valid_to,
          issuer: issuerName,
          subject: subjectName,
        });
      }
    );

    socket.on("error", (err) => {
      socket.destroy();
      resolve({
        check: {
          id: `check_tls_${Date.now()}`,
          auditRunId,
          category: "TLS",
          checkName: "TLS & Certificate Validity",
          status: "INCONCLUSIVE",
          score: 50,
          weight: 0.15,
          rawEvidence: { error: err.message },
          errorMessage: `TLS connection failed: ${err.message}`,
          timestamp: new Date().toISOString(),
        },
        daysRemaining: 0,
        validTo: "",
        issuer: "Connection Error",
        subject: host,
      });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({
        check: {
          id: `check_tls_${Date.now()}`,
          auditRunId,
          category: "TLS",
          checkName: "TLS & Certificate Validity",
          status: "INCONCLUSIVE",
          score: 50,
          weight: 0.15,
          rawEvidence: { error: "TLS connection timed out after 5 seconds." },
          errorMessage: "TLS handshake timed out.",
          timestamp: new Date().toISOString(),
        },
        daysRemaining: 0,
        validTo: "",
        issuer: "Timeout",
        subject: host,
      });
    });
  });
}
