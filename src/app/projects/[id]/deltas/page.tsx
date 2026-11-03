"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { Project, ReleaseDelta } from "@/lib/types";
import {
  GitCompare,
  Activity,
  CheckSquare,
  Bug,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function ReleaseDeltasPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock sample release delta for presentation
  const delta: ReleaseDelta = {
    previousAuditId: "audit_run_prev_001",
    currentAuditId: "audit_run_curr_002",
    scoreDelta: 6,
    coverageDelta: 2,
    newBrokenLinks: [],
    fixedBrokenLinks: ["https://storefront.preview.app/terms"],
    regressedSecurityHeaders: [],
    improvedSecurityHeaders: ["Content-Security-Policy"],
    verdictTransition: {
      from: "REVIEW_REQUIRED",
      to: "PROVISIONAL_PASS",
    },
    regressionDetected: false,
  };

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/projects/${projectId}`);
        if (res.ok) setProject(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  const scoreDelta = delta.scoreDelta ?? 0;
  const fixedBrokenLinks = delta.fixedBrokenLinks || [];
  const improvedSecurityHeaders = delta.improvedSecurityHeaders || [];
  const regressedSecurityHeaders = delta.regressedSecurityHeaders || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <Link
            href={`/projects/${projectId}`}
            className="text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Overview
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Release Delta &amp; Regression Intelligence</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Comparative Analysis
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Application: <span className="text-foreground font-mono">{project?.name}</span> ({project?.targetUrl})
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-border text-xs font-mono overflow-x-auto pb-1">
        <Link
          href={`/projects/${projectId}`}
          className="px-3.5 py-2 rounded-t-lg text-muted-foreground hover:text-foreground hover:bg-surface/50 transition-colors flex items-center gap-2 shrink-0"
        >
          <Activity className="h-3.5 w-3.5" />
          Overview &amp; RQI
        </Link>
        <Link
          href={`/projects/${projectId}/findings`}
          className="px-3.5 py-2 rounded-t-lg text-muted-foreground hover:text-foreground hover:bg-surface/50 transition-colors flex items-center gap-2 shrink-0"
        >
          <CheckSquare className="h-3.5 w-3.5" />
          Findings Inbox
        </Link>
        <Link
          href={`/projects/${projectId}/bugs`}
          className="px-3.5 py-2 rounded-t-lg text-muted-foreground hover:text-foreground hover:bg-surface/50 transition-colors flex items-center gap-2 shrink-0"
        >
          <Bug className="h-3.5 w-3.5" />
          Bugs &amp; Retest
        </Link>
        <Link
          href={`/projects/${projectId}/deltas`}
          className="px-3.5 py-2 rounded-t-lg bg-surface border-t border-x border-border text-foreground font-semibold flex items-center gap-2 shrink-0"
        >
          <GitCompare className="h-3.5 w-3.5 text-emerald-400" />
          Release Deltas
        </Link>
      </div>

      {/* Delta Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
        {/* Score Delta */}
        <div className="p-5 rounded-xl bg-surface border border-border space-y-2">
          <span className="text-[10px] uppercase text-muted-foreground">RQI Score Delta</span>
          <div className="flex items-center gap-2">
            {scoreDelta >= 0 ? (
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-400" />
            )}
            <span
              className={`text-2xl font-bold ${
                scoreDelta >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta} pts
            </span>
          </div>
          <span className="text-muted-foreground text-[10px]">Quality score improved since last release</span>
        </div>

        {/* Verdict Transition */}
        <div className="p-5 rounded-xl bg-surface border border-border space-y-2">
          <span className="text-[10px] uppercase text-muted-foreground">Verdict Transition</span>
          <div className="text-sm font-bold text-foreground flex items-center gap-2">
            <span className="text-amber-400">{delta.verdictTransition?.from || "REVIEW_REQUIRED"}</span>
            <span>&rarr;</span>
            <span className="text-emerald-400">{delta.verdictTransition?.to || "PROVISIONAL_PASS"}</span>
          </div>
          <span className="text-muted-foreground text-[10px]">Positive gate transition verified</span>
        </div>

        {/* Regression Status */}
        <div className="p-5 rounded-xl bg-surface border border-border space-y-2">
          <span className="text-[10px] uppercase text-muted-foreground">Regression State</span>
          <div className="flex items-center gap-2">
            {delta.regressionDetected ? (
              <>
                <XCircle className="h-5 w-5 text-red-400" />
                <span className="text-lg font-bold text-red-400">REGRESSION DETECTED</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="text-lg font-bold text-emerald-400">NO REGRESSIONS</span>
              </>
            )}
          </div>
          <span className="text-muted-foreground text-[10px]">No previously passed checks failed</span>
        </div>
      </div>

      {/* Delta Breakdown Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
        {/* Link crawler changes */}
        <div className="p-5 rounded-xl bg-surface border border-border space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" /> Route &amp; Link Health Changes
          </h3>
          <div className="space-y-2">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block">New Broken Links:</span>
              {delta.newBrokenLinks.length === 0 ? (
                <div className="text-emerald-400 py-1">0 new broken routes detected.</div>
              ) : (
                <ul className="text-red-400 list-disc list-inside">
                  {delta.newBrokenLinks.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="pt-2 border-t border-border/40">
              <span className="text-[10px] text-muted-foreground uppercase block">Resolved Routes:</span>
              {fixedBrokenLinks.length === 0 ? (
                <div className="text-muted-foreground py-1">None</div>
              ) : (
                <ul className="text-emerald-400 list-disc list-inside">
                  {fixedBrokenLinks.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Security headers changes */}
        <div className="p-5 rounded-xl bg-surface border border-border space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Security Posture Changes
          </h3>
          <div className="space-y-2">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block">Newly Implemented Headers:</span>
              {improvedSecurityHeaders.length === 0 ? (
                <div className="text-muted-foreground py-1">No header changes</div>
              ) : (
                <ul className="text-emerald-400 list-disc list-inside">
                  {improvedSecurityHeaders.map((h, i) => (
                    <li key={i}>{h} (Now strictly configured)</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="pt-2 border-t border-border/40">
              <span className="text-[10px] text-muted-foreground uppercase block">Regressed / Dropped Headers:</span>
              {regressedSecurityHeaders.length === 0 ? (
                <div className="text-emerald-400 py-1">0 security regressions detected.</div>
              ) : (
                <ul className="text-red-400 list-disc list-inside">
                  {regressedSecurityHeaders.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
