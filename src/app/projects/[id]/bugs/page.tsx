"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { BugReport, BugStatus, Severity, RetestVerdict, Project } from "@/lib/types";
import { BugCard } from "@/components/bugs/BugCard";
import { RetestModal } from "@/components/bugs/RetestModal";
import { ManualBugModal } from "@/components/bugs/ManualBugModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Bug,
  Activity,
  CheckSquare,
  GitCompare,
  ArrowLeft,
  Plus,
  Filter,
  CheckCircle2,
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

  const handleStatusChange = async (bugId: string, newStatus: BugStatus) => {
    const res = await fetch(`/api/bugs/${bugId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) throw new Error("Failed to update status");
    await fetchBugs();
  };

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
            <h1 className="text-3xl font-display text-foreground">Defect Tracker &amp; Retest Verification</h1>
            <span className="text-xs font-mono px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/30 uppercase tracking-wider font-semibold">
              {bugs.length} Verified Defect{bugs.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-xs font-mono text-foreground/60 mt-1">
            Application: <span className="text-foreground font-semibold">{project?.name}</span> ({project?.targetUrl})
          </p>
        </div>

        <Button
          variant="chamfer"
          size="md"
          onClick={() => setIsManualBugModalOpen(true)}
          className="h-11 px-5 text-xs"
        >
          <Plus className="size-3.5 mr-2" />
          [LOG EXPLORATORY DEFECT]
        </Button>
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
          className="px-5 py-3 border-t-2 border-primary bg-[#0c0e14]/85 backdrop-blur-[2px] text-primary font-bold flex items-center gap-2 shrink-0 border-x border-border/80"
        >
          <Bug className="size-3.5 text-primary" />
          Defects &amp; Retest
          <span className="px-1.5 py-0.2 bg-primary/10 text-primary border border-primary/20 text-[10px]">
            {bugs.length}
          </span>
        </Link>
        <Link
          href={`/projects/${projectId}/deltas`}
          className="px-5 py-3 text-foreground/60 hover:text-foreground hover:bg-[#0c0e14]/50 transition-colors flex items-center gap-2 shrink-0"
        >
          <GitCompare className="size-3.5" />
          Release Deltas
        </Link>
      </div>

      {/* Critical Release Gate Warning if critical bugs active */}
      {criticalBugs.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/40 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2.5 text-red-400">
            <span className="size-2 rounded-full bg-red-400 animate-ping" />
            <span className="font-bold uppercase tracking-wider">
              GATE_FUNCTIONAL TRIPPED: {criticalBugs.length} Active CRITICAL Defect(s)
            </span>
            <span className="text-foreground/50 hidden sm:inline font-sans">
              &bull; Release verdict blocked until resolved and verified.
            </span>
          </div>
          <span className="px-2.5 py-0.5 bg-red-500/20 text-red-300 border border-red-500/40 font-bold uppercase tracking-wider text-[10px]">
            RELEASE BLOCKED
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0a0c10]/80 backdrop-blur-[2px] p-4 border border-border/80 font-mono text-xs">
        <div className="flex items-center gap-2.5 text-foreground/60">
          <Filter className="size-3.5 text-primary" />
          <span className="uppercase tracking-wider text-[11px]">Status Filter:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-black border border-border px-2.5 py-1 text-foreground focus:outline-none focus:border-primary/50 text-xs"
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

        <div className="flex items-center gap-2.5 text-foreground/60">
          <span className="uppercase tracking-wider text-[11px]">Severity Filter:</span>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-black border border-border px-2.5 py-1 text-foreground focus:outline-none focus:border-primary/50 text-xs"
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
        <div className="p-16 text-center text-xs font-mono text-foreground/40 border border-border bg-[#0d0d0d]">
          Loading defect inventory...
        </div>
      ) : filteredBugs.length === 0 ? (
        <div className="p-16 text-center text-xs font-mono text-foreground/50 bg-[#0d0d0d] border border-border space-y-3">
          <CheckCircle2 className="size-6 text-primary mx-auto" />
          <div className="font-semibold text-foreground text-sm">No Defects Match Active Filter</div>
          <p className="max-w-md mx-auto text-foreground/50 text-[11px]">
            No bugs found. You can log manual exploratory findings using the button above or confirm findings in the inbox.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
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