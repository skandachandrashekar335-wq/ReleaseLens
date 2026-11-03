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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Gate 1: Security Hard Gate */}
      <div
        className={`p-4 rounded-xl border flex flex-col justify-between ${
          gateSecurityPassed
            ? "bg-surface border-emerald-500/30"
            : "bg-surface border-red-500/40"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            {gateSecurityPassed ? (
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
            )}
            <div>
              <h4 className="text-sm font-semibold text-foreground">Hard Gate 1: Security & Transport</h4>
              <p className="text-xs text-muted-foreground">ADR-020 Non-Negotiable Baseline</p>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 text-[11px] font-mono rounded-full border ${
              gateSecurityPassed
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}
          >
            {gateSecurityPassed ? "PASS" : "FAIL"}
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            {tlsValid ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}
            <span className="text-muted-foreground">TLS Valid & Trusted</span>
          </div>
          <div className="flex items-center gap-1.5">
            {tlsDaysLeft > 14 ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}
            <span className="text-muted-foreground">Expiry ({tlsDaysLeft}d &gt; 14d)</span>
          </div>
          <div className="flex items-center gap-1.5">
            {httpsRedirect ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}
            <span className="text-muted-foreground">HTTPS Redirect</span>
          </div>
          <div className="flex items-center gap-1.5">
            {clickjackingProtected ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}
            <span className="text-muted-foreground">Clickjacking (CSP/XFO)</span>
          </div>
        </div>
      </div>

      {/* Gate 2: Functional Hard Gate */}
      <div
        className={`p-4 rounded-xl border flex flex-col justify-between ${
          gateFunctionalPassed
            ? "bg-surface border-emerald-500/30"
            : "bg-surface border-red-500/40"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            {gateFunctionalPassed ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-red-400 shrink-0" />
            )}
            <div>
              <h4 className="text-sm font-semibold text-foreground">Hard Gate 2: Functional Integrity</h4>
              <p className="text-xs text-muted-foreground">ADR-023 Human-Verified Triage Gate</p>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 text-[11px] font-mono rounded-full border ${
              gateFunctionalPassed
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}
          >
            {gateFunctionalPassed ? "PASS" : "FAIL"}
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-mono">
          <span className="text-muted-foreground">Confirmed Critical Defects:</span>
          <span
            className={`font-semibold px-2 py-0.5 rounded ${
              criticalBugsCount === 0
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-red-400 bg-red-500/10"
            }`}
          >
            {criticalBugsCount} Active Critical
          </span>
        </div>
      </div>
    </div>
  );
}
