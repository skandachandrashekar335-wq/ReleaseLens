"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";

interface HardGateBadgesProps {
  gateSecurityPassed?: boolean;
  gateFunctionalPassed?: boolean;
  tlsValid?: boolean;
  tlsDaysLeft?: number;
  httpsRedirect?: boolean;
  clickjackingProtected?: boolean;
  criticalBugsCount?: number;
}

export function HardGateBadges({
  gateSecurityPassed = true,
  gateFunctionalPassed = true,
  tlsValid = true,
  tlsDaysLeft = 85,
  httpsRedirect = true,
  clickjackingProtected = true,
  criticalBugsCount = 0,
}: HardGateBadgesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
      {/* Gate 1: Security Hard Gate */}
      <div
        className={`p-5 border flex flex-col justify-between ${
          gateSecurityPassed
            ? "bg-[#0d0d0d] border-emerald-500/40"
            : "bg-[#0d0d0d] border-red-500/50"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {gateSecurityPassed ? (
              <ShieldCheck className="size-5 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="size-5 text-red-400 shrink-0" />
            )}
            <div>
              <h4 className="text-xs uppercase font-bold text-foreground tracking-wider">
                Hard Gate 1: Security &amp; Transport
              </h4>
              <p className="text-[11px] text-foreground/50">ADR-020 Non-Negotiable Baseline</p>
            </div>
          </div>
          <span
            className={`px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider border ${
              gateSecurityPassed
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-red-500/10 text-red-400 border-red-500/30"
            }`}
          >
            {gateSecurityPassed ? "PASS" : "FAIL"}
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            {tlsValid ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <XCircle className="size-3.5 text-red-400" />}
            <span className="text-foreground/70">TLS Valid &amp; Trusted</span>
          </div>
          <div className="flex items-center gap-1.5">
            {tlsDaysLeft > 14 ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <XCircle className="size-3.5 text-red-400" />}
            <span className="text-foreground/70">Expiry ({tlsDaysLeft}d &gt; 14d)</span>
          </div>
          <div className="flex items-center gap-1.5">
            {httpsRedirect ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <XCircle className="size-3.5 text-red-400" />}
            <span className="text-foreground/70">HTTPS Redirect</span>
          </div>
          <div className="flex items-center gap-1.5">
            {clickjackingProtected ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <XCircle className="size-3.5 text-red-400" />}
            <span className="text-foreground/70">Clickjacking Guard</span>
          </div>
        </div>
      </div>

      {/* Gate 2: Functional Hard Gate */}
      <div
        className={`p-5 border flex flex-col justify-between ${
          gateFunctionalPassed
            ? "bg-[#0d0d0d] border-emerald-500/40"
            : "bg-[#0d0d0d] border-red-500/50"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {gateFunctionalPassed ? (
              <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="size-5 text-red-400 shrink-0" />
            )}
            <div>
              <h4 className="text-xs uppercase font-bold text-foreground tracking-wider">
                Hard Gate 2: Functional Integrity
              </h4>
              <p className="text-[11px] text-foreground/50">ADR-023 Human-Verified Triage Gate</p>
            </div>
          </div>
          <span
            className={`px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider border ${
              gateFunctionalPassed
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-red-500/10 text-red-400 border-red-500/30"
            }`}
          >
            {gateFunctionalPassed ? "PASS" : "FAIL"}
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
          <span className="text-foreground/70">Confirmed Critical Defects:</span>
          <span
            className={`font-semibold px-2 py-0.5 border ${
              criticalBugsCount === 0
                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                : "text-red-400 bg-red-500/10 border-red-500/20"
            }`}
          >
            {criticalBugsCount} Active Critical
          </span>
        </div>
      </div>
    </div>
  );
}