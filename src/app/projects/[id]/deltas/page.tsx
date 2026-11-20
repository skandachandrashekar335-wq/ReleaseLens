"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { Project, ReleaseDelta, AuditRun } from "@/lib/types";
import { analyzeReleaseDelta } from "@/lib/engine/delta-analyzer";
import {
  GitCompare,
  Activity,
  CheckSquare,
  Bug,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ReleaseDeltasPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [project, setProject] = useState<Project | null>(null);
  const [audits, setAudits] = useState<AuditRun[]>([]);
  const [delta, setDelta] = useState<ReleaseDelta | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjectAndAudits = async () => {
      try {
        setIsLoading(true);
        const [pRes, aRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/audit`),
        ]);
        if (pRes.ok) setProject(await pRes.json());
        if (aRes.ok) {
          const auditList: AuditRun[] = await aRes.json();
          setAudits(auditList);
          if (auditList && auditList.length >= 2) {
            setDelta(analyzeReleaseDelta(auditList[0], auditList[1]));
          } else if (auditList && auditList.length === 1) {
            setDelta(analyzeReleaseDelta(auditList[0], undefined));
          }
        }
      } catch (err) {
        console.error("Delta load error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjectAndAudits();
  }, [projectId]);

  const scoreDelta = delta ? (delta.scoreDelta ?? delta.qualityDelta ?? 0) : 0;
  const fixedBrokenLinks = delta ? (delta.fixedBrokenLinks || delta.resolvedBrokenLinks || []) : [];
  const improvedSecurityHeaders = delta?.improvedSecurityHeaders || [];
  const regressedSecurityHeaders = delta?.regressedSecurityHeaders || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8 bg-transparent text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <Link
            href={`/projects/${projectId}`}
            className="text-xs font-mono text-foreground/50 hover:text-primary flex items-center gap-1.5 mb-2 uppercase tracking-wider"
          >
            <ArrowLeft className="size-3" /> Back to Overview
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display text-foreground">Release Delta &amp; Regression Intelligence</h1>
            <span className="text-xs font-mono px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/30 uppercase tracking-wider font-semibold">
              Comparative Analysis
            </span>
          </div>
          <p className="text-xs font-mono text-foreground/60 mt-1">
            Application: <span className="text-foreground font-semibold">{project?.name}</span> ({project?.targetUrl})
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-border text-xs font-mono overflow-x-auto pb-0 uppercase tracking-wider">
        <Link
          href={`/projects/${projectId}`}
          className="px-5 py-3 text-foreground/60 hover:text-foreground hover:bg-[#0d0d0d] transition-colors flex items-center gap-2 shrink-0"
        >
          <Activity className="size-3.5" />
          Overview &amp; RQI
        </Link>
        <Link
          href={`/projects/${projectId}/findings`}
          className="px-5 py-3 text-foreground/60 hover:text-foreground hover:bg-[#0d0d0d] transition-colors flex items-center gap-2 shrink-0"
        >
          <CheckSquare className="size-3.5" />
          Findings Inbox
        </Link>
        <Link
          href={`/projects/${projectId}/bugs`}
          className="px-5 py-3 text-foreground/60 hover:text-foreground hover:bg-[#0d0d0d] transition-colors flex items-center gap-2 shrink-0"
        >
          <Bug className="size-3.5" />
          Defects &amp; Retest
        </Link>
        <Link
          href={`/projects/${projectId}/deltas`}
          className="px-5 py-3 border-t-2 border-primary bg-[#0c0e14]/85 backdrop-blur-[2px] text-primary font-bold flex items-center gap-2 shrink-0 border-x border-border/80"
        >
          <GitCompare className="size-3.5 text-primary" />
          Release Deltas
        </Link>
      </div>

      {/* Empty state if no audits exist yet */}
      {!delta && audits.length === 0 && !isLoading ? (
        <div className="p-12 text-center bg-[#0a0c10]/80 backdrop-blur-[2px] border border-border/80 space-y-4 font-mono">
          <GitCompare className="size-10 text-primary/60 mx-auto" />
          <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">
            No Release Audits Recorded Yet
          </h2>
          <p className="text-xs text-foreground/60 max-w-lg mx-auto leading-relaxed">
            Release delta intelligence requires at least one baseline audit run, and compares regressions across successive releases.
          </p>
          <div className="pt-2">
            <Link href={`/projects/${projectId}`}>
              <Button variant="chamfer" size="sm" className="gap-2">
                <Play className="size-3 text-primary fill-primary" />
                [EXECUTE INITIAL AUDIT]
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Delta Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 font-mono text-xs">
            {/* Score Delta */}
            <div className="p-6 bg-[#0a0c10]/80 backdrop-blur-[2px] border border-border/80 space-y-2">
              <span className="text-[10px] uppercase text-foreground/50 tracking-wider">RQI Score Delta</span>
              <div className="flex items-center gap-2">
                {scoreDelta >= 0 ? (
                  <TrendingUp className="size-5 text-primary" />
                ) : (
                  <TrendingDown className="size-5 text-red-400" />
                )}
                <span
                  className={`text-3xl font-bold font-mono ${
                    scoreDelta >= 0 ? "text-primary" : "text-red-400"
                  }`}
                >
                  {scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta} pts
                </span>
              </div>
              <span className="text-foreground/50 text-[11px] block">
                {audits.length === 1 ? "Baseline release score established" : "Quality score change since last release"}
              </span>
            </div>

            {/* Verdict Transition */}
            <div className="p-6 bg-[#0a0c10]/80 backdrop-blur-[2px] border border-border/80 space-y-2">
              <span className="text-[10px] uppercase text-foreground/50 tracking-wider">Verdict Transition</span>
              <div className="text-base font-bold text-foreground flex items-center gap-2">
                <span className="text-amber-400">{delta?.previousVerdict || delta?.verdictTransition?.from || "BASELINE"}</span>
                <span>&rarr;</span>
                <span className="text-primary">{delta?.currentVerdict || delta?.verdictTransition?.to || "PROVISIONAL_PASS"}</span>
              </div>
              <span className="text-foreground/50 text-[11px] block">
                {delta?.verdictChanged ? "Gate transition recorded" : "Stable release verdict maintained"}
              </span>
            </div>

            {/* Regression Status */}
            <div className="p-6 bg-[#0a0c10]/80 backdrop-blur-[2px] border border-border/80 space-y-2">
              <span className="text-[10px] uppercase text-foreground/50 tracking-wider">Regression State</span>
              <div className="flex items-center gap-2">
                {delta?.regressionDetected ? (
                  <>
                    <XCircle className="size-5 text-red-400" />
                    <span className="text-base font-bold text-red-400 uppercase tracking-wider">REGRESSION DETECTED</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-5 text-emerald-400" />
                    <span className="text-base font-bold text-emerald-400 uppercase tracking-wider">NO REGRESSIONS</span>
                  </>
                )}
              </div>
              <span className="text-foreground/50 text-[11px] block">
                {delta?.notes?.[0] || "No previously passed checks regressed"}
              </span>
            </div>
          </div>

          {/* Delta Breakdown Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            {/* Link crawler changes */}
            <div className="p-6 bg-[#0d0d0d] border border-border space-y-4">
              <h3 className="font-bold uppercase tracking-wider text-foreground flex items-center gap-2 text-xs">
                <Activity className="size-4 text-primary" /> Route &amp; Link Health Changes
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] text-foreground/50 uppercase tracking-wider block mb-1">New Broken Links:</span>
                  {(delta?.newBrokenLinks || []).length === 0 ? (
                    <div className="text-emerald-400 py-1">0 new broken routes detected.</div>
                  ) : (
                    <ul className="text-red-400 list-disc list-inside">
                      {delta?.newBrokenLinks.map((l, i) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="pt-3 border-t border-border">
                  <span className="text-[10px] text-foreground/50 uppercase tracking-wider block mb-1">Resolved Routes:</span>
                  {fixedBrokenLinks.length === 0 ? (
                    <div className="text-foreground/40 py-1">None</div>
                  ) : (
                    <ul className="text-primary list-disc list-inside">
                      {fixedBrokenLinks.map((l, i) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Security headers changes */}
            <div className="p-6 bg-[#0d0d0d] border border-border space-y-4">
              <h3 className="font-bold uppercase tracking-wider text-foreground flex items-center gap-2 text-xs">
                <ShieldCheck className="size-4 text-primary" /> Security Posture Changes
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] text-foreground/50 uppercase tracking-wider block mb-1">Newly Implemented Headers:</span>
                  {improvedSecurityHeaders.length === 0 ? (
                    <div className="text-foreground/40 py-1">No header changes</div>
                  ) : (
                    <ul className="text-primary list-disc list-inside">
                      {improvedSecurityHeaders.map((h, i) => (
                        <li key={i}>{h} (Now strictly configured)</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="pt-3 border-t border-border">
                  <span className="text-[10px] text-foreground/50 uppercase tracking-wider block mb-1">Regressed / Dropped Headers:</span>
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
        </>
      )}
    </div>
  );
}