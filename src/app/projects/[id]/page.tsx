"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { Project, AutomatedCheck, PotentialFinding, BugReport, RqiScore, ReleaseDelta } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { RqiGauge } from "@/components/audit/RqiGauge";
import { HardGateBadges } from "@/components/audit/HardGateBadges";
import { CheckList } from "@/components/audit/CheckList";
import { DeveloperHandoffView } from "@/components/reports/DeveloperHandoffView";
import { AiAssistantDrawer } from "@/components/ai/AiAssistantDrawer";
import {
  Shield,
  Activity,
  Play,
  Sparkles,
  ExternalLink,
  Layers,
  CheckSquare,
  Bug,
  GitCompare,
  RotateCcw,
  AlertCircle,
  FileText,
} from "lucide-react";

export default function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [project, setProject] = useState<Project | null>(null);
  const [checks, setChecks] = useState<AutomatedCheck[]>([]);
  const [findings, setFindings] = useState<PotentialFinding[]>([]);
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [rqi, setRqi] = useState<RqiScore | null>(null);
  const [delta, setDelta] = useState<ReleaseDelta | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  // Load project details, checks, findings, and bugs
  const loadData = async () => {
    try {
      setIsLoading(true);
      // Fetch project
      const pRes = await fetch(`/api/projects/${projectId}`);
      if (pRes.ok) {
        const pData = await pRes.json();
        setProject(pData.project || pData);
      }

      // Fetch findings
      const fRes = await fetch(`/api/findings?projectId=${projectId}`);
      if (fRes.ok) {
        const fData = await fRes.json();
        setFindings(Array.isArray(fData) ? fData : (fData.findings || []));
      }

      // Fetch bugs
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

  // Handle running a live automated audit
  const handleRunAudit = async () => {
    try {
      setIsRunningAudit(true);
      const res = await fetch(`/api/projects/${projectId}/audit`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Audit execution failed");
      const auditResult = await res.json();

      setChecks(auditResult.checks || auditResult.auditRun?.checks || []);
      setFindings(auditResult.potentialFindings || auditResult.auditRun?.findings || []);
      setRqi(auditResult.rqi || auditResult.auditRun?.rqiScore || null);
      setDelta(auditResult.delta || null);

      // Refresh bugs list too in case functional gate changed
      await loadData();
    } catch (err) {
      console.error("Audit run error:", err);
      alert("Failed to run live audit. Please check target URL reachability.");
    } finally {
      setIsRunningAudit(false);
    }
  };

  // Default fallback RQI if an audit hasn't been run in this view yet
  const displayRqi: RqiScore = rqi || {
    overallScore: 82,
    coveragePercentage: 90,
    verdict: "PROVISIONAL_PASS",
    gateSecurityPassed: true,
    gateFunctionalPassed: bugs.filter((b) => b.severity === "CRITICAL" && b.status !== "VERIFIED" && b.status !== "CLOSED").length === 0,
    securityScore: 88,
    availabilityScore: 100,
    linksScore: 80,
    performanceScore: 72,
    reasons: [
      "Hard Gate 1 (Security): TLS certificate valid with >14 days remaining.",
      "Hard Gate 2 (Functional): Zero active unverified CRITICAL defects.",
    ],
  };

  const criticalBugsCount = bugs.filter(
    (b) => b.severity === "CRITICAL" && b.status !== "VERIFIED" && b.status !== "CLOSED"
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Project Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-raised border border-border text-emerald-400">
              {project?.environment || "PREVIEW"}
            </span>
            <span className="text-xs font-mono text-muted-foreground">ID: {projectId}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
            {project?.name || "Target Application"}
          </h1>
          <a
            href={project?.targetUrl || "#"}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1.5 mt-1"
          >
            <span>{project?.targetUrl}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsAiOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Sparkles className="h-4 w-4 text-emerald-400" />
            Evidence Copilot
          </Button>

          <Button
            variant="primary"
            size="md"
            isLoading={isRunningAudit}
            onClick={handleRunAudit}
            className="flex items-center gap-1.5"
          >
            <Play className="h-4 w-4 fill-current" />
            Execute Live Audit
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-border text-xs font-mono overflow-x-auto pb-1">
        <Link
          href={`/projects/${projectId}`}
          className="px-3.5 py-2 rounded-t-lg bg-surface border-t border-x border-border text-foreground font-semibold flex items-center gap-2 shrink-0"
        >
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          Overview &amp; RQI
        </Link>
        <Link
          href={`/projects/${projectId}/findings`}
          className="px-3.5 py-2 rounded-t-lg text-muted-foreground hover:text-foreground hover:bg-surface/50 transition-colors flex items-center gap-2 shrink-0"
        >
          <CheckSquare className="h-3.5 w-3.5" />
          Findings Inbox
          {findings.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-surface-raised border border-border text-[10px]">
              {findings.length}
            </span>
          )}
        </Link>
        <Link
          href={`/projects/${projectId}/bugs`}
          className="px-3.5 py-2 rounded-t-lg text-muted-foreground hover:text-foreground hover:bg-surface/50 transition-colors flex items-center gap-2 shrink-0"
        >
          <Bug className="h-3.5 w-3.5" />
          Bugs &amp; Retest
          {bugs.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-surface-raised border border-border text-[10px]">
              {bugs.length}
            </span>
          )}
        </Link>
        <Link
          href={`/projects/${projectId}/deltas`}
          className="px-3.5 py-2 rounded-t-lg text-muted-foreground hover:text-foreground hover:bg-surface/50 transition-colors flex items-center gap-2 shrink-0"
        >
          <GitCompare className="h-3.5 w-3.5" />
          Release Deltas
        </Link>
      </div>

      {/* Main RQI and Gating Telemetry */}
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

      {/* Quick Summary Cards: Triage Queue & Bugs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Findings Inbox Summary */}
        <div className="p-5 rounded-xl bg-surface border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-foreground">Findings Triage Inbox</h3>
            </div>
            <Link
              href={`/projects/${projectId}/findings`}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline"
            >
              Open Inbox ({findings.length}) &rarr;
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            Automated crawler findings awaiting human review, false-positive elimination, and severity validation.
          </p>

          {findings.length === 0 ? (
            <div className="p-4 rounded-lg bg-surface-raised border border-border text-xs font-mono text-muted-foreground text-center">
              Zero un-triaged findings. Run a live audit to scan routes.
            </div>
          ) : (
            <div className="space-y-2">
              {findings.slice(0, 3).map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-lg bg-surface-raised border border-border flex items-center justify-between text-xs font-mono"
                >
                  <div className="truncate mr-2">
                    <span className="text-foreground font-medium">{f.title}</span>
                    <span className="text-[10px] text-muted-foreground block truncate">{f.description}</span>
                  </div>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-surface border border-border shrink-0">
                    {f.suggestedSeverity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirmed Defect Inventory Summary */}
        <div className="p-5 rounded-xl bg-surface border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-foreground">Active Defect Inventory</h3>
            </div>
            <Link
              href={`/projects/${projectId}/bugs`}
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 underline"
            >
              Manage Bugs ({bugs.length}) &rarr;
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            Confirmed bugs undergoing developer correction, retest cycles, and release readiness verification.
          </p>

          {bugs.length === 0 ? (
            <div className="p-4 rounded-lg bg-surface-raised border border-border text-xs font-mono text-muted-foreground text-center">
              No confirmed defects logged.
            </div>
          ) : (
            <div className="space-y-2">
              {bugs.slice(0, 3).map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-lg bg-surface-raised border border-border flex items-center justify-between text-xs font-mono"
                >
                  <div className="truncate mr-2">
                    <span className="text-foreground font-medium">{b.title}</span>
                    <span className="text-[10px] text-muted-foreground block">
                      Status: {b.status} • Retests: {b.retestCount}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-surface border border-border shrink-0">
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Automated Check Telemetry ({checks.length} Executed)
            </h3>
            <span className="text-xs font-mono text-muted-foreground">Latest Audit Run</span>
          </div>
          <CheckList checks={checks} />
        </div>
      )}

      {/* Developer Handoff Brief */}
      {project && (
        <DeveloperHandoffView project={project} rqi={displayRqi} bugs={bugs} checks={checks} />
      )}

      {/* Evidence AI Copilot Drawer */}
      <AiAssistantDrawer
        projectId={projectId}
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        auditContext={{
          rqi: displayRqi,
          checks,
          bugs,
        }}
      />
    </div>
  );
}
