"use client";

import React from "react";
import { RqiScore, ReleaseVerdict } from "@/lib/types";
import { getVerdictStyle } from "@/lib/utils";
import { ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

interface RqiGaugeProps {
  rqi: RqiScore;
  className?: string;
}

export function RqiGauge({ rqi, className = "" }: RqiGaugeProps) {
  const {
    overallScore,
    qualityScore,
    coveragePercentage,
    coveragePercent,
    verdict,
    releaseVerdict,
    gateSecurityPassed,
    gateFunctionalPassed,
    gateSecurity,
    gateFunctional,
    securityScore,
    availabilityScore,
    linksScore,
    performanceScore,
    reasons,
    categoryScores,
  } = rqi;

  const currentVerdict = verdict || releaseVerdict || "PROVISIONAL_PASS";
  const verdictStyle = getVerdictStyle(currentVerdict);
  const currentCoverage = coveragePercentage ?? coveragePercent ?? 100;
  const currentOverall = overallScore !== undefined ? overallScore : (qualityScore ?? 80);
  const isSecurityGatePassed = gateSecurityPassed ?? (gateSecurity === "PASS");
  const isFunctionalGatePassed = gateFunctionalPassed ?? (gateFunctional === "PASS");

  // Circumference for circular gauge
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  // If currentOverall is null (blocked by hard gate), stroke is red or 0
  const normalizedScore = currentOverall ?? 0;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  const getScoreColor = () => {
    if (currentVerdict === "RELEASE_BLOCKED" || currentOverall === null) return "text-red-500 stroke-red-500";
    if (normalizedScore >= 80) return "text-primary stroke-primary";
    if (normalizedScore >= 60) return "text-amber-400 stroke-amber-400";
    return "text-red-400 stroke-red-400";
  };

  return (
    <div className={`p-6 bg-[#0d0d0d] border border-border flex flex-col gap-6 shadow-2xl ${className}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-primary flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-primary shadow-glow shadow-primary/60" />
            ReleaseLens Quality Index (RQI)
          </h3>
          <p className="text-[11px] font-mono text-foreground/50 mt-0.5">
            Tripartite Governance (ADR-020 &amp; ADR-023)
          </p>
        </div>

        {/* Verdict Badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-medium border ${verdictStyle.bg} ${verdictStyle.text} ${verdictStyle.border}`}
        >
          {currentVerdict === "VERIFIED_READY" && <CheckCircle2 className="size-3.5" />}
          {currentVerdict === "PROVISIONAL_PASS" && <CheckCircle2 className="size-3.5 text-primary" />}
          {currentVerdict === "REVIEW_REQUIRED" && <AlertTriangle className="size-3.5 text-amber-400" />}
          {currentVerdict === "RELEASE_BLOCKED" && <XCircle className="size-3.5 text-red-400" />}
          {currentVerdict.replace("_", " ")}
        </div>
      </div>

      {/* Main Gauge and Gate Status */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Dial */}
        <div className="md:col-span-4 flex flex-col items-center justify-center">
          <div className="relative size-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              {/* Background track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-[#1f1f1f]"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Progress track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className={`transition-all duration-1000 ease-out ${getScoreColor()}`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Score Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              {currentOverall === null ? (
                <>
                  <span className="text-2xl font-bold font-mono text-red-400">BLOCKED</span>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">Hard Gate Tripped</span>
                </>
              ) : (
                <>
                  <span className="text-4xl font-bold font-mono tracking-tight text-foreground">
                    {currentOverall}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">Score / 100</span>
                </>
              )}
            </div>
          </div>

          {/* Coverage Pill */}
          <div className="mt-3 flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-surface-raised px-3 py-1 rounded-full border border-border">
            <span>Audit Coverage:</span>
            <span className="text-foreground font-semibold">{currentCoverage}%</span>
          </div>
        </div>

        {/* Hard Gates & Metric Bars */}
        <div className="md:col-span-8 flex flex-col gap-4">
          {/* Hard Gates Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Security Hard Gate */}
            <div
              className={`p-3 rounded-xl border flex items-center gap-3 ${
                isSecurityGatePassed
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                  : "bg-red-500/5 border-red-500/20 text-red-400"
              }`}
            >
              {isSecurityGatePassed ? (
                <ShieldCheck className="h-5 w-5 shrink-0" />
              ) : (
                <ShieldAlert className="h-5 w-5 shrink-0" />
              )}
              <div className="flex flex-col">
                <span className="text-[11px] font-mono uppercase text-muted-foreground">Gate 1: Security</span>
                <span className="text-xs font-semibold">
                  {isSecurityGatePassed ? "PASSED (TLS & Headers)" : "FAILED (Critical Vuln)"}
                </span>
              </div>
            </div>

            {/* Functional Hard Gate */}
            <div
              className={`p-3 rounded-xl border flex items-center gap-3 ${
                isFunctionalGatePassed
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                  : "bg-red-500/5 border-red-500/20 text-red-400"
              }`}
            >
              {isFunctionalGatePassed ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 shrink-0" />
              )}
              <div className="flex flex-col">
                <span className="text-[11px] font-mono uppercase text-muted-foreground">Gate 2: Functional</span>
                <span className="text-xs font-semibold">
                  {isFunctionalGatePassed ? "PASSED (0 Critical Bugs)" : "FAILED (Critical Bugs Open)"}
                </span>
              </div>
            </div>
          </div>

          {/* Dimension Breakdown */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-black p-2.5 border border-border">
                <div className="text-[10px] text-foreground/50 font-mono uppercase">Security</div>
                <div className="text-sm font-semibold font-mono text-primary">
                  {securityScore ?? categoryScores?.security ?? 85}/100
                </div>
              </div>
              <div className="bg-black p-2.5 border border-border">
                <div className="text-[10px] text-foreground/50 font-mono uppercase">Availability</div>
                <div className="text-sm font-semibold font-mono text-primary">
                  {availabilityScore ?? 100}/100
                </div>
              </div>
              <div className="bg-black p-2.5 border border-border">
                <div className="text-[10px] text-foreground/50 font-mono uppercase">Links & Routes</div>
                <div className="text-sm font-semibold font-mono text-primary">
                  {linksScore ?? categoryScores?.links ?? 80}/100
                </div>
              </div>
              <div className="bg-black p-2.5 border border-border">
                <div className="text-[10px] text-foreground/50 font-mono uppercase">Performance</div>
                <div className="text-sm font-semibold font-mono text-primary">
                  {performanceScore ?? categoryScores?.performance ?? 75}/100
                </div>
              </div>
            </div>
          </div>

          {/* Reasons / Verdict explanation */}
          {reasons && reasons.length > 0 && (
            <div className="bg-black p-3 border border-border text-xs space-y-1">
              <span className="font-mono text-[10px] uppercase text-primary tracking-wider">Verdict Basis:</span>
              <ul className="list-disc list-inside space-y-0.5 text-foreground/70 font-mono text-[11px]">
                {reasons.map((r, i) => (
                  <li key={i} className="text-foreground/80">
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
