"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { PotentialFinding, Severity, Project } from "@/lib/types";
import { FindingCard } from "@/components/findings/FindingCard";
import { TriageModal } from "@/components/findings/TriageModal";
import { Button } from "@/components/ui/Button";
import {
  CheckSquare,
  Activity,
  Bug,
  GitCompare,
  ArrowLeft,
  Filter,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function FindingsInboxPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [project, setProject] = useState<Project | null>(null);
  const [findings, setFindings] = useState<PotentialFinding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [selectedFinding, setSelectedFinding] = useState<PotentialFinding | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchFindings = async () => {
    try {
      setIsLoading(true);
      const [pRes, fRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/findings?projectId=${projectId}`),
      ]);

      if (pRes.ok) {
        const pData = await pRes.json();
        setProject(pData.project || pData);
      }
      if (fRes.ok) {
        const fData = await fRes.json();
        setFindings(Array.isArray(fData) ? fData : (fData.findings || []));
      }
    } catch (err) {
      console.error("Failed to fetch findings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFindings();
  }, [projectId]);

  // Handle quick triage from card
  const handleQuickTriage = async (
    finding: PotentialFinding,
    action: "CONFIRMED" | "REJECTED" | "DUPLICATE" | "ACCEPTED_RISK"
  ) => {
    try {
      const res = await fetch(`/api/findings/${finding.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          status: action,
          triagedBy: "QA Lead",
          triageNotes: `Triaged via Quick Triage as ${action}`,
        }),
      });

      if (!res.ok) throw new Error("Failed to triage finding");
      await fetchFindings();
    } catch (err) {
      console.error("Quick triage error:", err);
      alert("Failed to triage finding.");
    }
  };

  // Handle detailed modal triage
  const handleConfirmTriage = async (
    findingId: string,
    action: "CONFIRMED" | "REJECTED" | "DUPLICATE" | "ACCEPTED_RISK",
    severity: Severity,
    notes: string,
    triagedBy: string
  ) => {
    const res = await fetch(`/api/findings/${findingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        status: action,
        suggestedSeverity: severity,
        triageNotes: notes,
        triagedBy,
      }),
    });

    if (!res.ok) throw new Error("Failed to triage finding");
    await fetchFindings();
  };

  const pendingFindings = findings.filter((f) => f.status === "NEEDS_REVIEW");
  const filteredFindings = pendingFindings.filter(
    (f) => filterSeverity === "ALL" || f.suggestedSeverity === filterSeverity
  );

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
            <h1 className="text-2xl font-bold text-foreground">Findings Triage Inbox</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {pendingFindings.length} Pending Review
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Application: <span className="text-foreground font-mono">{project?.name}</span> ({project?.targetUrl})
          </p>
        </div>

        {/* Quick link to Bugs */}
        <Link
          href={`/projects/${projectId}/bugs`}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 bg-surface-raised px-3.5 py-2 rounded-xl border border-border"
        >
          <Bug className="h-3.5 w-3.5" />
          View Verified Defects &rarr;
        </Link>
      </div>

      {/* Tabs */}
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
          className="px-3.5 py-2 rounded-t-lg bg-surface border-t border-x border-border text-foreground font-semibold flex items-center gap-2 shrink-0"
        >
          <CheckSquare className="h-3.5 w-3.5 text-cyan-400" />
          Findings Inbox
          <span className="px-1.5 py-0.2 rounded-full bg-surface-raised border border-border text-[10px]">
            {pendingFindings.length}
          </span>
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
          className="px-3.5 py-2 rounded-t-lg text-muted-foreground hover:text-foreground hover:bg-surface/50 transition-colors flex items-center gap-2 shrink-0"
        >
          <GitCompare className="h-3.5 w-3.5" />
          Release Deltas
        </Link>
      </div>

      {/* Filter and Severity Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface p-4 rounded-xl border border-border">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span>Filter by Severity:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition-colors border ${
                filterSeverity === sev
                  ? "bg-foreground text-background border-foreground font-semibold"
                  : "bg-surface-raised text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Findings Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs font-mono text-muted-foreground">
          Loading triage queue...
        </div>
      ) : filteredFindings.length === 0 ? (
        <div className="p-12 text-center text-xs font-mono text-muted-foreground bg-surface rounded-xl border border-border space-y-2">
          <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto" />
          <div className="font-semibold text-foreground">Findings Inbox is Empty</div>
          <p className="max-w-md mx-auto text-muted-foreground">
            All potential findings from previous runs have been triaged or no anomalies were discovered.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFindings.map((finding) => (
            <FindingCard
              key={finding.id}
              finding={finding}
              onTriage={handleQuickTriage}
              onOpenDetails={(f) => {
                setSelectedFinding(f);
                setIsModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Detailed Triage Modal */}
      <TriageModal
        finding={selectedFinding}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFinding(null);
        }}
        onConfirmTriage={handleConfirmTriage}
      />
    </div>
  );
}
