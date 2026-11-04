"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { BugReport, BugStatus, Severity, RetestVerdict, Project } from "@/lib/types";
import { BugCard } from "@/components/bugs/BugCard";
import { RetestModal } from "@/components/bugs/RetestModal";
import { ManualBugModal } from "@/components/bugs/ManualBugModal";
import { Button } from "@/components/ui/Button";
import {
  Bug,
  Activity,
  CheckSquare,
  GitCompare,
  ArrowLeft,
  Plus,
  Filter,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

export default function BugsAndRetestPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [project, setProject] = useState<Project | null>(null);
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");

  const [selectedBugForRetest, setSelectedBugForRetest] = useState<BugReport | null>(null);
  const [isRetestModalOpen, setIsRetestModalOpen] = useState(false);
  const [isManualBugModalOpen, setIsManualBugModalOpen] = useState(false);

  const fetchBugs = async () => {
    try {
      setIsLoading(true);
      const [pRes, bRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/bugs?projectId=${projectId}`),
      ]);

      if (pRes.ok) {
        const pData = await pRes.json();
        setProject(pData.project || pData);
      }
      if (bRes.ok) {
        const bData = await bRes.json();
        setBugs(Array.isArray(bData) ? bData : (bData.bugs || []));
      }
    } catch (err) {
      console.error("Failed to fetch bugs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBugs();
  }, [projectId]);

  // Handle direct lifecycle status change
  const handleStatusChange = async (bugId: string, newStatus: BugStatus) => {
    const res = await fetch(`/api/bugs/${bugId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) throw new Error("Failed to update status");
    await fetchBugs();
  };

  // Handle retest verification submission
  const handleRecordRetest = async (
    bugId: string,
    verdict: RetestVerdict,
    comments: string,
    tester: string
  ) => {
    const res = await fetch(`/api/bugs/${bugId}/retest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        verdict,
        comments,
        tester,
      }),
    });

    if (!res.ok) throw new Error("Failed to record retest");
    await fetchBugs();
  };

  // Handle manual defect creation
  const handleCreateBug = async (bugData: any) => {
    const res = await fetch("/api/bugs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bugData),
    });

    if (!res.ok) throw new Error("Failed to create defect");
    await fetchBugs();
  };

  const filteredBugs = bugs.filter((b) => {
    const matchesStatus = filterStatus === "ALL" || b.status === filterStatus;
    const matchesSeverity = filterSeverity === "ALL" || b.severity === filterSeverity;
    return matchesStatus && matchesSeverity;
  });

  const criticalBugs = bugs.filter((b) => b.severity === "CRITICAL" && b.status !== "VERIFIED" && b.status !== "CLOSED");

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
            <h1 className="text-2xl font-bold text-foreground">Defect Tracker &amp; Retest Verification</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {bugs.length} Verified Defect{bugs.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Application: <span className="text-foreground font-mono">{project?.name}</span> ({project?.targetUrl})
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsManualBugModalOpen(true)}
          className="flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Log Exploratory Defect
        </Button>
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
          className="px-3.5 py-2 rounded-t-lg bg-surface border-t border-x border-border text-foreground font-semibold flex items-center gap-2 shrink-0"
        >
          <Bug className="h-3.5 w-3.5 text-emerald-400" />
          Bugs &amp; Retest
          <span className="px-1.5 py-0.2 rounded-full bg-surface-raised border border-border text-[10px]">
            {bugs.length}
          </span>
        </Link>
        <Link
          href={`/projects/${projectId}/deltas`}
          className="px-3.5 py-2 rounded-t-lg text-muted-foreground hover:text-foreground hover:bg-surface/50 transition-colors flex items-center gap-2 shrink-0"
        >
          <GitCompare className="h-3.5 w-3.5" />
          Release Deltas
        </Link>
      </div>

      {/* Critical Release Gate Warning if critical bugs active */}
      {criticalBugs.length > 0 && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-red-400">
            <span className="h-2 w-2 rounded-full bg-red-400 animate-ping" />
            <span className="font-semibold">
              GATE_FUNCTIONAL TRIPPED: {criticalBugs.length} Active CRITICAL Defect(s)
            </span>
            <span className="text-muted-foreground hidden sm:inline">
              &bull; Release verdict blocked until resolved and verified.
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
            RELEASE BLOCKED
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface p-4 rounded-xl border border-border font-mono text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span>Status Filter:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-surface-raised border border-border rounded px-2 py-1 text-foreground focus:outline-none"
          >
            <option value="ALL">ALL STATUSES</option>
            <option value="OPEN">OPEN</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="FIXED">FIXED</option>
            <option value="RETEST_REQUIRED">RETEST_REQUIRED</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="REOPENED">REOPENED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Severity Filter:</span>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-surface-raised border border-border rounded px-2 py-1 text-foreground focus:outline-none"
          >
            <option value="ALL">ALL SEVERITIES</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
            <option value="INFO">INFO</option>
          </select>
        </div>
      </div>

      {/* Bugs List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs font-mono text-muted-foreground">
          Loading defect inventory...
        </div>
      ) : filteredBugs.length === 0 ? (
        <div className="p-12 text-center text-xs font-mono text-muted-foreground bg-surface rounded-xl border border-border space-y-2">
          <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto" />
          <div className="font-semibold text-foreground">No Defects Match Active Filter</div>
          <p className="max-w-md mx-auto text-muted-foreground">
            No bugs found. You can log manual exploratory findings using the button above or confirm findings in the inbox.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBugs.map((bug) => (
            <BugCard
              key={bug.id}
              bug={bug}
              onStatusChange={handleStatusChange}
              onTriggerRetest={(b) => {
                setSelectedBugForRetest(b);
                setIsRetestModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Retest Verification Modal */}
      <RetestModal
        bug={selectedBugForRetest}
        isOpen={isRetestModalOpen}
        onClose={() => {
          setIsRetestModalOpen(false);
          setSelectedBugForRetest(null);
        }}
        onRecordRetest={handleRecordRetest}
      />

      {/* Manual Bug Creation Modal */}
      <ManualBugModal
        projectId={projectId}
        isOpen={isManualBugModalOpen}
        onClose={() => setIsManualBugModalOpen(false)}
        onCreateBug={handleCreateBug}
      />
    </div>
  );
}
