"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { RqiScore, BugReport, Project } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { RqiGauge } from "@/components/audit/RqiGauge";
import { HardGateBadges } from "@/components/audit/HardGateBadges";
import {
  Shield,
  Copy,
  Check,
  ExternalLink,
  Bug,
  Lock,
  ArrowLeft,
  FileText,
  AlertCircle,
} from "lucide-react";

export default function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/reports/shared/${token}`);
        if (!res.ok) {
          throw new Error("Report not found or expired");
        }
        const data = await res.json();
        setReport(data);
      } catch (err: any) {
        setError(err.message || "Failed to load report");
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-xs font-mono text-muted-foreground">
        Loading shared developer handoff report...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl bg-surface border border-red-500/30 text-center space-y-4 font-mono">
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto" />
        <h2 className="text-base font-semibold text-foreground">Report Not Available</h2>
        <p className="text-xs text-muted-foreground">
          {error || "The requested developer report permalink is invalid or expired."}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 underline"
        >
          Return to ReleaseLens Home
        </Link>
      </div>
    );
  }

  const { project, rqi, bugs }: { project: Project; rqi: RqiScore; bugs: BugReport[] } = report.data;

  const handleCopyMarkdown = () => {
    const md = `# ReleaseLens Developer Handoff Report
Target: ${project?.name || "Application"} (${project?.targetUrl || ""})
Verdict: ${rqi?.verdict || "UNKNOWN"} (RQI: ${rqi?.overallScore ?? "BLOCKED"}/100)
Hard Gates: Security=${rqi?.gateSecurityPassed ? "PASS" : "FAIL"} | Functional=${rqi?.gateFunctionalPassed ? "PASS" : "FAIL"}

Defects (${bugs?.length || 0}):
${
  bugs && bugs.length > 0
    ? bugs
        .map(
          (b, i) =>
            `${i + 1}. [${b.severity}] ${b.title}\n   Status: ${b.status}\n   Description: ${b.description}`
        )
        .join("\n")
    : "Zero defects reported."
}
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8 font-sans">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-surface-raised border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-400" />
          <span className="text-foreground font-semibold">Shared Developer Handoff Report</span>
          <span className="text-muted-foreground hidden sm:inline">&bull; Read-Only Snapshot</span>
        </div>

        <Button variant="outline" size="sm" onClick={handleCopyMarkdown}>
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Copied Markdown
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 mr-1" /> Copy for Linear / GitHub
            </>
          )}
        </Button>
      </div>

      {/* Target Application Header */}
      <div className="border-b border-border/60 pb-6">
        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface border border-border text-emerald-400">
          {project?.environment || "PREVIEW"}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-2">{project?.name}</h1>
        <a
          href={project?.targetUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mt-1"
        >
          <span>{project?.targetUrl}</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* RQI & Hard Gates */}
      {rqi && (
        <div className="space-y-6">
          <RqiGauge rqi={rqi} />
          <HardGateBadges
            gateSecurityPassed={rqi.gateSecurityPassed ?? (rqi.gateSecurity === "PASS")}
            gateFunctionalPassed={rqi.gateFunctionalPassed ?? (rqi.gateFunctional === "PASS")}
            criticalBugsCount={bugs?.filter((b) => b.severity === "CRITICAL").length || 0}
          />
        </div>
      )}

      {/* Verified Defect Package */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Bug className="h-4 w-4 text-emerald-400" /> Verified Defect Package ({bugs?.length || 0})
          </h2>
          <span className="text-xs font-mono text-muted-foreground">Actionable Developer Brief</span>
        </div>

        {bugs && bugs.length === 0 ? (
          <div className="p-8 rounded-xl bg-surface border border-border text-center text-xs font-mono text-muted-foreground">
            Zero defects currently pending resolution.
          </div>
        ) : (
          <div className="space-y-3 font-mono">
            {bugs?.map((bug, idx) => (
              <div key={bug.id} className="p-5 rounded-xl bg-surface border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                    <span className="text-sm font-semibold text-foreground">{bug.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-surface-raised border border-border text-foreground">
                      {bug.severity}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-surface-raised border border-border text-muted-foreground">
                      {bug.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                  {bug.description}
                </p>

                {/* Reproduction Steps */}
                {bug.stepsToReproduce && bug.stepsToReproduce.length > 0 && (
                  <div className="p-3 rounded-lg bg-surface-raised border border-border text-xs">
                    <span className="text-[10px] uppercase text-muted-foreground block mb-1">
                      Steps to Reproduce:
                    </span>
                    <ol className="list-decimal list-inside space-y-1 text-foreground/90">
                      {bug.stepsToReproduce.map((step, sIdx) => (
                        <li key={sIdx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Expected vs Actual */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-surface-raised border border-border">
                    <span className="text-[10px] uppercase text-emerald-400 block mb-0.5">
                      Expected Behavior:
                    </span>
                    <span className="text-foreground/90">{bug.expectedBehavior || "None"}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-raised border border-border">
                    <span className="text-[10px] uppercase text-red-400 block mb-0.5">
                      Actual Behavior:
                    </span>
                    <span className="text-foreground/90">{bug.actualBehavior || "None"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
