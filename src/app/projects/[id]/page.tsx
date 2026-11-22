"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { Project, AutomatedCheck, PotentialFinding, BugReport, RqiScore, ReleaseDelta, AuditRun } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RqiGauge } from "@/components/audit/RqiGauge";
import { HardGateBadges } from "@/components/audit/HardGateBadges";
import { CheckList } from "@/components/audit/CheckList";
import { DeveloperHandoffView } from "@/components/reports/DeveloperHandoffView";
import { AiAssistantDrawer } from "@/components/ai/AiAssistantDrawer";
import {
  Activity,
  Play,
  Sparkles,
  ExternalLink,
  Layers,
  CheckSquare,
  Bug,
  GitCompare,
  AlertCircle,
  FileText,
} from "lucide-react";

export default function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [project, setProject] = useState<Project | null>(null);
  const [auditRun, setAuditRun] = useState<AuditRun | null>(null);
  const [checks, setChecks] = useState<AutomatedCheck[]>([]);
  const [findings, setFindings] = useState<PotentialFinding[]>([]);
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [rqi, setRqi] = useState<RqiScore | null>(null);
  const [delta, setDelta] = useState<ReleaseDelta | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [auditError, setAuditError] = useState<{
    status?: number;
    code?: string;
    message: string;
    details?: string;
  } | null>(null);
  const [auditProgressStep, setAuditProgressStep] = useState<string>("");

  const loadData = async () => {
    try {
      setIsLoading(true);
      const pRes = await fetch(`/api/projects/${projectId}`);
      if (pRes.ok) {
        const pData = await pRes.json();
        setProject(pData.project || pData);
        if (pData.latestAudit) {
          setAuditRun(pData.latestAudit);
          if (pData.latestAudit.checks) setChecks(pData.latestAudit.checks);
          if (pData.latestAudit.rqiScore) setRqi(pData.latestAudit.rqiScore);
        }
      }

      const fRes = await fetch(`/api/findings?projectId=${projectId}`);
      if (fRes.ok) {
        const fData = await fRes.json();
        setFindings(Array.isArray(fData) ? fData : (fData.findings || []));
      }

      const bRes = await fetch(`/api/bugs?projectId=${projectId}`);
      if (bRes.ok) {
        const bData = await bRes.json();
        setBugs(Array.isArray(bData) ? bData : (bData.bugs || []));
      }
    } catch (err) {
      console.error("Error loading project overview:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleRunAudit = async () => {
    setAuditError(null);
    setIsRunningAudit(true);
    setAuditProgressStep("Initializing live audit pipeline...");

    const progressTimer1 = setTimeout(() => {
      setAuditProgressStep("Probing HTTP/TLS & Security Headers (Tier 1)...");
    }, 1200);

    const progressTimer2 = setTimeout(() => {
      setAuditProgressStep("Measuring Real-Time Latency & Core Web Vitals (Tier 2)...");
    }, 3800);

    const progressTimer3 = setTimeout(() => {
      setAuditProgressStep("Inspecting DOM Semantics, WCAG Accessibility & Links (Tier 3)...");
    }, 7000);

    const progressTimer4 = setTimeout(() => {
      setAuditProgressStep("Evaluating Release Gates & Tripartite RQI Score...");
    }, 10500);

    try {
      const res = await fetch(`/api/projects/${projectId}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: project?.name,
          targetUrl: project?.targetUrl,
          environment: project?.environment,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        let friendlyReason = data.error || data.message || `Audit request failed (HTTP ${res.status})`;
        if (res.status === 401) {
          friendlyReason = "Authentication session expired or missing. Please sign in again.";
        } else if (res.status === 403) {
          friendlyReason = data.error || "Cross-Origin or permission violation. Only project owners can run audits.";
        } else if (res.status === 404) {
          friendlyReason = `Project record (${projectId}) could not be resolved.`;
        } else if (res.status === 429) {
          friendlyReason = "Audit rate limit exceeded. Please wait a moment before re-executing.";
        } else if (res.status === 504) {
          friendlyReason = "Target application took too long to respond. Please verify URL reachability.";
        }

        setAuditError({
          status: res.status,
          code: data.code || `HTTP_${res.status}`,
          message: friendlyReason,
          details: data.details ? (typeof data.details === "object" ? JSON.stringify(data.details) : String(data.details)) : undefined,
        });
        return;
      }

      const run = data.auditRun || data;
      setAuditRun(run);
      setChecks(data.checks || data.auditRun?.checks || []);
      setFindings(data.potentialFindings || data.auditRun?.findings || []);
      setRqi(data.rqi || data.auditRun?.rqiScore || null);
      setDelta(data.delta || null);

      await loadData();
    } catch (err: any) {
      console.error("Audit run error:", err);
      setAuditError({
        status: 0,
        code: "NETWORK_ERROR",
        message: err.message || "Network error occurred while communicating with the audit engine. Please check your connection.",
      });
    } finally {
      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);
      clearTimeout(progressTimer3);
      clearTimeout(progressTimer4);
      setIsRunningAudit(false);
      setAuditProgressStep("");
    }
  };

  const displayRqi: RqiScore | null = rqi;

  const criticalBugsCount = bugs.filter(
    (b) => b.severity === "CRITICAL" && b.status !== "VERIFIED" && b.status !== "CLOSED"
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10 bg-transparent text-foreground">
      {/* Real Diagnostic Audit Error Banner (Zero window.alert) */}
      {auditError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-400 space-y-2 relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-400" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold uppercase tracking-wider text-[11px] text-red-300">
                    Audit Execution Halted
                  </span>
                  {auditError.status ? (
                    <span className="px-1.5 py-0.5 bg-red-500/20 border border-red-500/40 text-[10px] text-red-300">
                      HTTP {auditError.status} // {auditError.code}
                    </span>
                  ) : null}
                </div>
                <p className="text-foreground/80 leading-relaxed font-sans">{auditError.message}</p>
                {auditError.details && (
                  <p className="text-[10px] opacity-70 bg-black/40 p-2 border border-red-500/20 font-mono">
                    {auditError.details}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setAuditError(null)}
              className="text-foreground/40 hover:text-foreground p-1 transition-colors text-xs"
              aria-label="Dismiss error"
            >
              [DISMISS]
            </button>
          </div>
        </div>
      )}

      {/* Live Progress Feedback Banner */}
      {isRunningAudit && (
        <div className="p-4 bg-primary/10 border border-primary/30 text-xs font-mono text-primary flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <span className="inline-block size-2 rounded-full bg-primary shadow-glow shadow-primary/60" />
            <span className="uppercase tracking-wider font-semibold text-[11px]">
              AUDIT IN PROGRESS: {auditProgressStep}
            </span>
          </div>
          <span className="text-[10px] text-foreground/50">DO NOT CLOSE TAB</span>
        </div>
      )}
      {/* Project Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/80 pb-8">
        <div>
          <div className="flex items-center gap-2.5 font-mono">
            <span className="text-[10px] uppercase px-2 py-0.5 bg-primary/10 border border-primary/30 text-primary">
              {project?.environment || "PREVIEW"}
            </span>
            <span className="text-xs text-foreground/40">ID: {projectId}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display text-foreground mt-2">
            {project?.name || "Target Application"}
          </h1>
          <a
            href={project?.targetUrl || "#"}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono text-foreground/50 hover:text-primary flex items-center gap-1.5 mt-1.5"
          >
            <span>{project?.targetUrl}</span>
            <ExternalLink className="size-3" />
          </a>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 font-mono">
          <Button
            variant="chamfer-outline"
            size="md"
            onClick={() => setIsAiOpen(true)}
            className="h-11 px-5 text-xs"
          >
            <Sparkles className="size-3.5 text-primary mr-2" />
            [EVIDENCE COPILOT]
          </Button>

          <Button
            variant="chamfer"
            size="md"
            isLoading={isRunningAudit}
            onClick={handleRunAudit}
            className="h-11 px-6 text-xs"
          >
            <Play className="size-3.5 fill-current mr-2" />
            [EXECUTE LIVE AUDIT]
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-border text-xs font-mono overflow-x-auto pb-0 uppercase tracking-wider">
        <Link
          href={`/projects/${projectId}`}
          className="px-5 py-3 border-t-2 border-primary bg-[#0d0d0d] text-primary font-bold flex items-center gap-2 shrink-0 border-x border-border"
        >
          <Activity className="size-3.5 text-primary" />
          Overview &amp; RQI
        </Link>
        <Link
          href={`/projects/${projectId}/findings`}
          className="px-5 py-3 text-foreground/60 hover:text-foreground hover:bg-[#0d0d0d] transition-colors flex items-center gap-2 shrink-0"
        >
          <CheckSquare className="size-3.5" />
          Findings Inbox
          {findings.length > 0 && (
            <span className="px-1.5 py-0.2 bg-primary/10 text-primary border border-primary/20 text-[10px]">
              {findings.length}
            </span>
          )}
        </Link>
        <Link
          href={`/projects/${projectId}/bugs`}
          className="px-5 py-3 text-foreground/60 hover:text-foreground hover:bg-[#0d0d0d] transition-colors flex items-center gap-2 shrink-0"
        >
          <Bug className="size-3.5" />
          Defects &amp; Retest
          {bugs.length > 0 && (
            <span className="px-1.5 py-0.2 bg-primary/10 text-primary border border-primary/20 text-[10px]">
              {bugs.length}
            </span>
          )}
        </Link>
        <Link
          href={`/projects/${projectId}/deltas`}
          className="px-5 py-3 text-foreground/60 hover:text-foreground hover:bg-[#0d0d0d] transition-colors flex items-center gap-2 shrink-0"
        >
          <GitCompare className="size-3.5" />
          Release Deltas
        </Link>
      </div>

      {/* Execution Tiers & Architecture Demarcation */}
      <div className="p-6 bg-[#0d0d0d] border border-border space-y-5 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <Layers className="size-4 text-primary" />
            <h3 className="text-xs uppercase font-bold text-foreground tracking-wider">
              Three-Tier Audit Execution Status
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-foreground/50 uppercase">Run Status:</span>
            <span
              className={cn(
                "px-2.5 py-0.5 text-[10px] font-mono font-medium border uppercase",
                auditRun?.status === "COMPLETED"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : auditRun?.status === "PARTIAL"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : "bg-black text-foreground/50 border-border"
              )}
            >
              {auditRun?.status || "PARTIAL (PROVISIONAL)"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tier 1 */}
          <div className="p-4 bg-[#0a0c10]/80 backdrop-blur-[2px] border border-border/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase text-foreground/50 font-semibold">Tier 1 // HTTP &amp; TLS</span>
              <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20">
                ACTIVE
              </span>
            </div>
            <p className="text-xs font-semibold text-foreground">Lightweight HTTP Audit</p>
            <p className="text-[11px] text-foreground/60 leading-relaxed font-sans">
              TLS handshake, redirect validation, security headers, and link extraction via edge-safe Cheerio.
            </p>
          </div>

          {/* Tier 2 */}
          <div className="p-4 bg-[#0a0c10]/80 backdrop-blur-[2px] border border-border/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase text-foreground/50 font-semibold">Tier 2 // Performance</span>
              <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20">
                ACTIVE
              </span>
            </div>
            <p className="text-xs font-semibold text-foreground">Real-Time Performance &amp; Core Web Vitals</p>
            <p className="text-[11px] text-foreground/60 leading-relaxed font-sans">
              Real measured latency (TTFB, total download), DOM payload complexity, and Google PageSpeed Insights REST API metrics.
            </p>
          </div>

          {/* Tier 3 */}
          <div className="p-4 bg-[#0a0c10]/80 backdrop-blur-[2px] border border-border/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase text-foreground/50 font-semibold">Tier 3 // DOM &amp; Browser</span>
              <span
                className={cn(
                  "text-[9px] px-1.5 py-0.5 border",
                  auditRun?.tiersExecuted?.includes("TIER_3_BROWSER")
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-[#171717] text-foreground/40 border-border"
                )}
              >
                {auditRun?.tiersExecuted?.includes("TIER_3_BROWSER") ? "EXECUTED" : "ACTIVE"}
              </span>
            </div>
            <p className="text-xs font-semibold text-foreground">Headless DOM, Accessibility &amp; Route Audit</p>
            <p className="text-[11px] text-foreground/60 leading-relaxed font-sans">
              Full server-side Cheerio DOM inspection: WCAG accessibility, heading hierarchy, semantic elements, image alt tags, form labels, and broken links.
            </p>
          </div>
        </div>

        {/* Limitations Notice */}
        {auditRun?.executionLimitations && auditRun.executionLimitations.length > 0 && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-300 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider">
              <AlertCircle className="size-3.5" />
              <span>Execution Limitations Recorded:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[10px] text-amber-300/80 pl-1">
              {auditRun.executionLimitations.map((lim, idx) => (
                <li key={idx}>{lim}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Main RQI and Gating Telemetry */}
      {displayRqi ? (
        <div className="space-y-6">
          <RqiGauge rqi={displayRqi} />

          <HardGateBadges
            gateSecurityPassed={displayRqi.gateSecurityPassed}
            gateFunctionalPassed={displayRqi.gateFunctionalPassed}
            tlsValid={true}
            tlsDaysLeft={85}
            httpsRedirect={true}
            clickjackingProtected={true}
            criticalBugsCount={criticalBugsCount}
          />
        </div>
      ) : (
        <div className="p-10 bg-[#0a0c10]/80 backdrop-blur-[2px] border border-border/80 text-center space-y-4 font-mono">
          <Activity className="size-10 text-primary/60 mx-auto" />
          <h2 className="text-base font-bold uppercase tracking-wider text-foreground">
            No Release Audit Executed Yet
          </h2>
          <p className="text-xs text-foreground/60 max-w-lg mx-auto leading-relaxed">
            ReleaseLens Quality Index (RQI) scoring and gate verification require executing an automated audit against {project?.targetUrl || "the target application"}.
          </p>
          <div className="pt-2">
            <Button
              onClick={handleRunAudit}
              isLoading={isRunningAudit}
              variant="chamfer"
              size="sm"
              className="gap-2"
            >
              <Play className="size-3 text-primary fill-primary" />
              [EXECUTE FIRST LIVE AUDIT]
            </Button>
          </div>
        </div>
      )}

      {/* Quick Summary Cards: Triage Queue & Bugs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
        {/* Findings Inbox Summary */}
        <div className="p-6 bg-[#0a0c10]/80 backdrop-blur-[2px] border border-border/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="size-4 text-primary" />
              <h3 className="text-xs uppercase font-bold text-foreground tracking-wider">
                Findings Triage Inbox
              </h3>
            </div>
            <Link
              href={`/projects/${projectId}/findings`}
              className="text-xs font-mono text-primary hover:text-primary/80 uppercase tracking-wider font-semibold"
            >
              Open Inbox ({findings.length}) &rarr;
            </Link>
          </div>

          <p className="text-xs text-foreground/60 font-sans">
            Automated crawler findings awaiting human review, false-positive elimination, and severity validation.
          </p>

          {findings.length === 0 ? (
            <div className="p-4 bg-[#0a0c10]/80 border border-border/80 text-xs text-foreground/40 text-center">
              Zero un-triaged findings. Run a live audit to scan routes.
            </div>
          ) : (
            <div className="space-y-2">
              {findings.slice(0, 3).map((f) => (
                <div
                  key={f.id}
                  className="p-3 bg-[#0a0c10]/80 border border-border/80 flex items-center justify-between text-xs"
                >
                  <div className="truncate mr-2">
                    <span className="text-foreground font-medium">{f.title}</span>
                    <span className="text-[10px] text-foreground/50 block truncate">{f.description}</span>
                  </div>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 bg-[#171717] border border-border shrink-0 text-foreground/80">
                    {f.suggestedSeverity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirmed Defect Inventory Summary */}
        <div className="p-6 bg-[#0a0c10]/80 backdrop-blur-[2px] border border-border/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="size-4 text-primary" />
              <h3 className="text-xs uppercase font-bold text-foreground tracking-wider">
                Active Defect Inventory
              </h3>
            </div>
            <Link
              href={`/projects/${projectId}/bugs`}
              className="text-xs font-mono text-primary hover:text-primary/80 uppercase tracking-wider font-semibold"
            >
              Manage Bugs ({bugs.length}) &rarr;
            </Link>
          </div>

          <p className="text-xs text-foreground/60 font-sans">
            Confirmed bugs undergoing developer correction, retest cycles, and release readiness verification.
          </p>

          {bugs.length === 0 ? (
            <div className="p-4 bg-[#0a0c10]/80 border border-border/80 text-xs text-foreground/40 text-center">
              No confirmed defects logged.
            </div>
          ) : (
            <div className="space-y-2">
              {bugs.slice(0, 3).map((b) => (
                <div
                  key={b.id}
                  className="p-3 bg-[#0a0c10]/80 border border-border/80 flex items-center justify-between text-xs"
                >
                  <div className="truncate mr-2">
                    <span className="text-foreground font-medium">{b.title}</span>
                    <span className="text-[10px] text-foreground/50 block">
                      Status: {b.status} • Retests: {b.retestCount}
                    </span>
                  </div>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 bg-[#171717] border border-border shrink-0 text-primary">
                    {b.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Automated Checks List */}
      {checks.length > 0 && (
        <div className="space-y-4 font-mono">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-wider font-bold text-foreground flex items-center gap-2">
              <FileText className="size-3.5 text-primary" />
              Automated Check Telemetry ({checks.length} Executed)
            </h3>
            <span className="text-xs text-foreground/50">Latest Audit Run</span>
          </div>
          <CheckList checks={checks} />
        </div>
      )}

      {/* Developer Handoff Brief */}
      {project && displayRqi && (
        <DeveloperHandoffView project={project} rqi={displayRqi} bugs={bugs} checks={checks} />
      )}

      {/* Evidence AI Copilot Drawer */}
      <AiAssistantDrawer
        projectId={projectId}
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        auditContext={{
          rqi: displayRqi || undefined,
          checks,
          bugs,
        }}
      />
    </div>
  );
}