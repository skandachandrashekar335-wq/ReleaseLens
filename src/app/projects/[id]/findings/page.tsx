"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, use, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PotentialFinding, Severity, Project, FindingStatus } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { getSeverityStyle, formatDate, formatRelativeTime, cn } from "@/lib/utils";
import {
  CheckSquare,
  Activity,
  Bug,
  GitCompare,
  ArrowLeft,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Search,
  Sparkles,
  Clock,
  ExternalLink,
  FileText,
  ChevronRight,
  XCircle,
  Copy,
  ShieldAlert,
  Terminal,
  RotateCcw,
  Code,
  SlidersHorizontal,
} from "lucide-react";

function FindingsWorkbench({ projectId }: { projectId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state
  const urlFindingId = searchParams.get("findingId");
  const urlSeverity = searchParams.get("severity") || "ALL";
  const urlStatus = searchParams.get("status") || "NEEDS_REVIEW";

  const [project, setProject] = useState<Project | null>(null);
  const [findings, setFindings] = useState<PotentialFinding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<string>(urlSeverity);
  const [filterStatus, setFilterStatus] = useState<string>(urlStatus);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(urlFindingId);

  // Inspector state
  const [activeTab, setActiveTab] = useState<"evidence" | "steps" | "copilot">("evidence");
  const [isTriageSubmitting, setIsTriageSubmitting] = useState(false);
  const [triageNotes, setTriageNotes] = useState("");
  const [overrideSeverity, setOverrideSeverity] = useState<Severity | "">("");

  // AI Copilot state
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Mobile detail view toggle
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  // Fetch initial data
  const fetchFindings = useCallback(async () => {
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
        const loaded: PotentialFinding[] = Array.isArray(fData) ? fData : (fData.findings || []);
        setFindings(loaded);

        // If URL has findingId, select it; else select first pending item
        if (urlFindingId && loaded.some((f) => f.id === urlFindingId)) {
          setSelectedFindingId(urlFindingId);
        } else if (loaded.length > 0 && !selectedFindingId) {
          const firstPending = loaded.find((f) => f.status === "NEEDS_REVIEW") || loaded[0];
          setSelectedFindingId(firstPending.id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch findings:", err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, urlFindingId, selectedFindingId]);

  useEffect(() => {
    fetchFindings();
  }, [fetchFindings]);

  // Synchronize URL when selected finding or filter changes
  const updateUrlParams = useCallback(
    (newFindingId: string | null, sev: string, stat: string) => {
      const params = new URLSearchParams();
      if (newFindingId) params.set("findingId", newFindingId);
      if (sev !== "ALL") params.set("severity", sev);
      if (stat !== "NEEDS_REVIEW") params.set("status", stat);
      const newQuery = params.toString();
      const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [pathname, router]
  );

  const handleSelectFinding = (id: string) => {
    setSelectedFindingId(id);
    setShowMobileDetail(true);
    setAiAnalysis(null);
    setAiError(null);
    setTriageNotes("");
    setOverrideSeverity("");
    updateUrlParams(id, filterSeverity, filterStatus);
  };

  // Filtered list
  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchesStatus =
        filterStatus === "ALL" || f.status === filterStatus;
      const severity = f.suggestedSeverity || f.recommendedSeverity || "MEDIUM";
      const matchesSeverity =
        filterSeverity === "ALL" || severity === filterSeverity;
      const matchesSearch =
        !searchQuery.trim() ||
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.sourceCheck && f.sourceCheck.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSeverity && matchesSearch;
    });
  }, [findings, filterStatus, filterSeverity, searchQuery]);

  // Currently selected finding
  const selectedFinding = useMemo(() => {
    if (!selectedFindingId) return filteredFindings[0] || null;
    return findings.find((f) => f.id === selectedFindingId) || filteredFindings[0] || null;
  }, [findings, filteredFindings, selectedFindingId]);

  // Execute Triage Action
  const handleTriageAction = async (
    action: "CONFIRMED" | "REJECTED" | "DUPLICATE" | "ACCEPTED_RISK"
  ) => {
    if (!selectedFinding) return;
    const targetFinding = selectedFinding;

    // Optimistic UI update
    setFindings((prev) =>
      prev.map((f) =>
        f.id === targetFinding.id
          ? { ...f, status: action as FindingStatus }
          : f
      )
    );

    // Auto-advance to next finding
    const currentIndex = filteredFindings.findIndex((f) => f.id === targetFinding.id);
    const nextFinding = filteredFindings[currentIndex + 1] || filteredFindings[currentIndex - 1] || null;
    if (nextFinding) {
      setSelectedFindingId(nextFinding.id);
      updateUrlParams(nextFinding.id, filterSeverity, filterStatus);
    }

    try {
      setIsTriageSubmitting(true);
      const res = await fetch(`/api/findings/${targetFinding.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          status: action,
          suggestedSeverity: overrideSeverity || targetFinding.suggestedSeverity || "MEDIUM",
          triageNotes: triageNotes || `Triaged via Two-Pane Findings Workbench as ${action}`,
          triagedBy: "QA Engineer (Live Session)",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to persist triage status");
      }
    } catch (err) {
      console.error("Triage error:", err);
      // Rollback on failure
      setFindings((prev) =>
        prev.map((f) => (f.id === targetFinding.id ? targetFinding : f))
      );
      alert("Failed to triage finding. Please check server logs.");
    } finally {
      setIsTriageSubmitting(false);
    }
  };

  // Guarded Keyboard Shortcuts (J / K / C / R / D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Guard: ignore when typing inside inputs, textareas, selects, or contenteditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (filteredFindings.length === 0) return;

      const currentIndex = selectedFinding
        ? filteredFindings.findIndex((f) => f.id === selectedFinding.id)
        : -1;

      switch (e.key.toLowerCase()) {
        case "j":
        case "arrowdown": {
          e.preventDefault();
          const nextIndex = Math.min(currentIndex + 1, filteredFindings.length - 1);
          const nextF = filteredFindings[nextIndex];
          if (nextF) handleSelectFinding(nextF.id);
          break;
        }
        case "k":
        case "arrowup": {
          e.preventDefault();
          const prevIndex = Math.max(currentIndex - 1, 0);
          const prevF = filteredFindings[prevIndex];
          if (prevF) handleSelectFinding(prevF.id);
          break;
        }
        case "c": {
          e.preventDefault();
          if (selectedFinding) handleTriageAction("CONFIRMED");
          break;
        }
        case "r": {
          e.preventDefault();
          if (selectedFinding) handleTriageAction("REJECTED");
          break;
        }
        case "d": {
          e.preventDefault();
          if (selectedFinding) handleTriageAction("DUPLICATE");
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredFindings, selectedFinding, handleTriageAction]);

  // Trigger On-Demand AI Copilot Analysis for Selected Finding
  const handleRunAiAnalysis = async () => {
    if (!selectedFinding) return;
    try {
      setIsAiLoading(true);
      setAiError(null);
      setActiveTab("copilot");

      const prompt = `Analyze this automated finding and provide:
1. Root cause hypothesis based strictly on the telemetry evidence.
2. Deterministic 3-step reproduction procedure.
3. Recommended developer resolution.

Finding: ${selectedFinding.title}
Source Check: ${selectedFinding.sourceCheck || selectedFinding.testSource}
Evidence Payload: ${JSON.stringify(selectedFinding.evidence)}
Affected URL: ${selectedFinding.affectedUrl || project?.targetUrl}`;

      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          userQuery: prompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Copilot query failed");
      }

      setAiAnalysis(data.answer || data.reply || "No response generated.");
    } catch (err: any) {
      setAiError(err.message || "Failed to query AI copilot.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const pendingCount = findings.filter((f) => f.status === "NEEDS_REVIEW").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8 bg-transparent text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <Link
            href={`/projects/${projectId}`}
            className="text-xs font-mono text-foreground/50 hover:text-primary flex items-center gap-1.5 mb-2 uppercase tracking-wider"
          >
            <ArrowLeft className="size-3" /> Back to Project Overview
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display text-foreground">Findings Triage Inbox</h1>
            <span className="text-xs font-mono px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/30 uppercase tracking-wider font-semibold">
              {pendingCount} Pending
            </span>
          </div>
          <p className="text-xs font-mono text-foreground/60 mt-1">
            Application: <span className="text-foreground font-semibold">{project?.name || "Target App"}</span> ({project?.targetUrl})
          </p>
        </div>

        {/* View Bugs Link */}
        <Link
          href={`/projects/${projectId}/bugs`}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary hover:text-primary/80 bg-[#0d0d0d] px-4 py-2 border border-border hover:border-primary/40 transition-colors"
        >
          <Bug className="size-3.5" />
          View Verified Defects &rarr;
        </Link>
      </div>

      {/* Tabs */}
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
          className="px-5 py-3 border-t-2 border-primary bg-[#0d0d0d] text-primary font-bold flex items-center gap-2 shrink-0 border-x border-border"
        >
          <CheckSquare className="size-3.5 text-primary" />
          Findings Inbox
          <span className="px-1.5 py-0.2 bg-primary/10 text-primary border border-primary/20 text-[10px]">
            {pendingCount}
          </span>
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
          className="px-5 py-3 text-foreground/60 hover:text-foreground hover:bg-[#0d0d0d] transition-colors flex items-center gap-2 shrink-0"
        >
          <GitCompare className="size-3.5" />
          Release Deltas
        </Link>
      </div>

      {/* Two-Pane Workbench Container */}
      <div className="border border-border bg-[#0d0d0d] overflow-hidden shadow-2xl flex flex-col lg:flex-row h-[780px]">
        {/* LEFT PANE: Findings List */}
        <div
          className={cn(
            "w-full lg:w-[420px] shrink-0 border-r border-border/80 flex flex-col bg-[#0a0c10]/85 backdrop-blur-[2px]",
            showMobileDetail ? "hidden lg:flex" : "flex"
          )}
        >
          {/* Filter Bar */}
          <div className="p-4 border-b border-border/80 space-y-3 bg-[#0c0e14]/85 backdrop-blur-[2px]">
            {/* Search */}
            <div className="relative font-mono">
              <Search className="absolute left-3 top-2.5 size-3.5 text-foreground/40" />
              <input
                type="text"
                placeholder="Search findings or probes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-black border border-border text-foreground placeholder:text-foreground/30 font-mono focus:outline-none focus:border-primary/50"
              />
            </div>

            {/* Severity Filter Pills */}
            <div className="flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => {
                      setFilterSeverity(sev);
                      updateUrlParams(selectedFindingId, sev, filterStatus);
                    }}
                    className={cn(
                      "px-2 py-0.5 text-[10px] border transition-colors uppercase tracking-wider",
                      filterSeverity === sev
                        ? "bg-primary text-black border-primary font-bold"
                        : "bg-black text-foreground/60 border-border hover:text-foreground"
                    )}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter Toggle & Keyboard Hint */}
            <div className="flex items-center justify-between text-[11px] font-mono text-foreground/50 pt-2 border-t border-border">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const next = filterStatus === "NEEDS_REVIEW" ? "ALL" : "NEEDS_REVIEW";
                    setFilterStatus(next);
                    updateUrlParams(selectedFindingId, filterSeverity, next);
                  }}
                  className="hover:text-primary underline underline-offset-2 uppercase tracking-wider text-[10px]"
                >
                  {filterStatus === "NEEDS_REVIEW" ? "Pending only" : "All statuses"}
                </button>
                <span>({filteredFindings.length})</span>
              </div>

              {/* Keyboard Shortcuts Hint */}
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-foreground/40">
                <kbd className="px-1 py-0.2 bg-black border border-border font-mono text-[9px]">J</kbd>
                <kbd className="px-1 py-0.2 bg-black border border-border font-mono text-[9px]">K</kbd>
                <span>nav</span>
                <span className="mx-0.5">•</span>
                <kbd className="px-1 py-0.2 bg-black border border-border font-mono text-[9px]">C</kbd>
                <span>confirm</span>
                <span className="mx-0.5">•</span>
                <kbd className="px-1 py-0.2 bg-black border border-border font-mono text-[9px]">R</kbd>
                <span>reject</span>
              </div>
            </div>
          </div>

          {/* Scrollable Findings Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {isLoading ? (
              <div className="p-12 text-center text-xs font-mono text-muted-foreground">
                Loading findings queue...
              </div>
            ) : filteredFindings.length === 0 ? (
              <div className="p-10 text-center text-xs font-mono text-muted-foreground space-y-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto" />
                <p className="font-semibold text-foreground">No Findings in this View</p>
                <p className="text-[11px] text-muted-foreground">
                  Try adjusting filters or execute a fresh automated audit.
                </p>
              </div>
            ) : (
              filteredFindings.map((finding) => {
                const isSelected = selectedFinding?.id === finding.id;
                const sev = finding.suggestedSeverity || finding.recommendedSeverity || "MEDIUM";
                const sevStyle = getSeverityStyle(sev);

                return (
                  <div
                    key={finding.id}
                    onClick={() => handleSelectFinding(finding.id)}
                    className={cn(
                      "p-4 cursor-pointer transition-colors relative text-left border-b border-border/70",
                      isSelected
                        ? "bg-black border-l-2 border-l-primary"
                        : "hover:bg-[#141414] border-l-2 border-l-transparent bg-[#0a0a0a]"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span
                          className={cn(
                            "px-1.5 py-0.2 text-[9px] font-mono font-medium border uppercase tracking-wider",
                            sevStyle.bg,
                            sevStyle.text,
                            sevStyle.border
                          )}
                        >
                          {sev}
                        </span>
                        <span className="text-[9px] font-mono text-foreground/50 uppercase px-1 py-0.2 bg-black border border-border truncate max-w-[120px]">
                          {finding.sourceCheck || finding.testSource || "PROBE"}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-foreground/40 shrink-0">
                        {formatRelativeTime(finding.createdAt)}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-foreground line-clamp-1 mb-1 font-sans">
                      {finding.title}
                    </h4>

                    <p className="text-[11px] text-foreground/60 line-clamp-2 leading-relaxed font-sans">
                      {finding.description}
                    </p>

                    {finding.status !== "NEEDS_REVIEW" && (
                      <div className="mt-2 flex items-center gap-1">
                        <span className="text-[9px] font-mono px-1.5 py-0.2 bg-black border border-border text-foreground/50 uppercase">
                          Status: {finding.status}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Evidence Inspector & Triage Action Workbench */}
        <div
          className={cn(
            "flex-1 min-w-0 flex flex-col bg-[#0c0e14]/85 backdrop-blur-[2px] overflow-y-auto",
            showMobileDetail ? "flex" : "hidden lg:flex"
          )}
        >
          {selectedFinding ? (
            <div className="flex-1 flex flex-col justify-between">
              {/* Top Inspection Details */}
              <div className="p-6 space-y-6">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setShowMobileDetail(false)}
                  className="lg:hidden inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground mb-2"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to findings list
                </button>

                {/* Finding Header */}
                <div className="space-y-3 border-b border-border/60 pb-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-mono font-medium border",
                          getSeverityStyle(
                            overrideSeverity ||
                              selectedFinding.suggestedSeverity ||
                              selectedFinding.recommendedSeverity ||
                              "MEDIUM"
                          ).bg,
                          getSeverityStyle(
                            overrideSeverity ||
                              selectedFinding.suggestedSeverity ||
                              selectedFinding.recommendedSeverity ||
                              "MEDIUM"
                          ).text,
                          getSeverityStyle(
                            overrideSeverity ||
                              selectedFinding.suggestedSeverity ||
                              selectedFinding.recommendedSeverity ||
                              "MEDIUM"
                          ).border
                        )}
                      >
                        {overrideSeverity || selectedFinding.suggestedSeverity || "MEDIUM"}
                      </span>
                      <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-surface border border-border text-muted-foreground">
                        Source: {selectedFinding.sourceCheck || selectedFinding.testSource || "AUDIT_PROBE"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatDate(selectedFinding.createdAt)}</span>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-foreground leading-snug">
                      {selectedFinding.title}
                    </h2>
                    {selectedFinding.affectedUrl && (
                      <a
                        href={selectedFinding.affectedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-1 inline-flex"
                      >
                        <span>{selectedFinding.affectedUrl}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {selectedFinding.description}
                  </p>
                </div>

                {/* Inspector Tabs */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab("evidence")}
                        className={cn(
                          "px-3 py-1 text-xs font-mono rounded-lg border transition-colors flex items-center gap-1.5",
                          activeTab === "evidence"
                            ? "bg-foreground text-background border-foreground font-medium"
                            : "bg-surface text-muted-foreground border-border hover:text-foreground"
                        )}
                      >
                        <Code className="h-3.5 w-3.5" />
                        Captured Telemetry
                      </button>

                      <button
                        onClick={() => setActiveTab("steps")}
                        className={cn(
                          "px-3 py-1 text-xs font-mono rounded-lg border transition-colors flex items-center gap-1.5",
                          activeTab === "steps"
                            ? "bg-foreground text-background border-foreground font-medium"
                            : "bg-surface text-muted-foreground border-border hover:text-foreground"
                        )}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Reproduction &amp; Impact
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab("copilot");
                          if (!aiAnalysis && !isAiLoading) {
                            handleRunAiAnalysis();
                          }
                        }}
                        className={cn(
                          "px-3 py-1 text-xs font-mono rounded-lg border transition-colors flex items-center gap-1.5",
                          activeTab === "copilot"
                            ? "bg-foreground text-background border-foreground font-medium"
                            : "bg-surface text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                        )}
                      >
                        <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                        AI Copilot Diagnosis
                      </button>
                    </div>

                    {/* Quick Trigger for AI Copilot */}
                    {activeTab !== "copilot" && (
                      <button
                        onClick={handleRunAiAnalysis}
                        disabled={isAiLoading}
                        className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        <Sparkles className="h-3 w-3" />
                        {isAiLoading ? "Analyzing..." : "Enhance with AI"}
                      </button>
                    )}
                  </div>

                  {/* Tab 1: Evidence Payload */}
                  {activeTab === "evidence" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                        <span>Immutable Probe Snapshot:</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              JSON.stringify(selectedFinding.evidence, null, 2)
                            );
                            alert("Evidence copied to clipboard");
                          }}
                          className="hover:text-foreground flex items-center gap-1 text-[11px]"
                        >
                          <Copy className="h-3 w-3" />
                          Copy JSON
                        </button>
                      </div>
                      <pre className="p-4 rounded-xl bg-surface border border-border text-[11px] font-mono text-foreground/90 max-h-72 overflow-y-auto leading-relaxed">
                        {JSON.stringify(selectedFinding.evidence, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Tab 2: Reproduction Steps & Expected Behavior */}
                  {activeTab === "steps" && (
                    <div className="space-y-4 text-xs font-mono">
                      <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
                        <div className="text-[10px] uppercase text-muted-foreground tracking-wider font-semibold">
                          Observed Behavior
                        </div>
                        <p className="text-foreground text-xs leading-relaxed">
                          {selectedFinding.observedBehavior || selectedFinding.description}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
                        <div className="text-[10px] uppercase text-muted-foreground tracking-wider font-semibold">
                          Expected Behavior (Specification Standard)
                        </div>
                        <p className="text-foreground text-xs leading-relaxed">
                          {selectedFinding.expectedBehavior ||
                            "System component should fulfill standard HTTP/W3C and security specifications without errors."}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
                        <div className="text-[10px] uppercase text-muted-foreground tracking-wider font-semibold">
                          Suggested Defect Reproduction Procedure
                        </div>
                        <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground text-xs">
                          <li>Navigate to target origin: <code className="text-foreground">{selectedFinding.affectedUrl || project?.targetUrl}</code></li>
                          <li>Execute inspection probe: <code className="text-foreground">{selectedFinding.sourceCheck || "Browser Audit Probe"}</code></li>
                          <li>Verify whether anomalous response pattern reproduces consistently.</li>
                        </ol>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: AI Copilot Diagnosis */}
                  {activeTab === "copilot" && (
                    <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-emerald-400" />
                          <h4 className="text-xs font-semibold text-foreground font-mono">
                            Evidence Copilot Root-Cause Hypothesis
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          Gemini 2.5 Flash • Zero-Hallucination Gate
                        </span>
                      </div>

                      {isAiLoading ? (
                        <div className="py-8 text-center text-xs font-mono text-muted-foreground space-y-2">
                          <RotateCcw className="h-4 w-4 animate-spin mx-auto text-emerald-400" />
                          <p>Synthesizing telemetry &amp; generating deterministic reproduction steps...</p>
                        </div>
                      ) : aiError ? (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-mono text-red-400 space-y-1">
                          <div className="font-semibold">AI Assistant Unavailable</div>
                          <p className="text-[11px] opacity-90">{aiError}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Note: Live AI features use on-demand free tier quota. Ensure GEMINI_API_KEY is configured.
                          </p>
                        </div>
                      ) : aiAnalysis ? (
                        <div className="prose prose-invert prose-xs text-xs font-mono leading-relaxed text-muted-foreground whitespace-pre-wrap">
                          {aiAnalysis}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-xs font-mono text-muted-foreground">
                          Click &quot;Enhance with AI&quot; to formulate a root cause hypothesis.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Sticky Action Footer */}
              <div className="p-5 border-t border-border bg-surface space-y-3">
                {/* Severity Override and Triage Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">
                      Severity Calibration:
                    </label>
                    <select
                      value={overrideSeverity || selectedFinding.suggestedSeverity || "MEDIUM"}
                      onChange={(e) => setOverrideSeverity(e.target.value as Severity)}
                      className="w-full px-2.5 py-1.5 text-xs bg-surface-raised border border-border rounded-lg text-foreground font-mono focus:outline-none focus:border-foreground/40"
                    >
                      <option value="CRITICAL">CRITICAL (Gating Block)</option>
                      <option value="HIGH">HIGH (Degraded Feature)</option>
                      <option value="MEDIUM">MEDIUM (Standard Anomaly)</option>
                      <option value="LOW">LOW (Cosmetic Polish)</option>
                      <option value="INFO">INFO (Advisory Telemetry)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">
                      Reviewer Triage Note (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="Add reproduction context or handoff note..."
                      value={triageNotes}
                      onChange={(e) => setTriageNotes(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-surface-raised border border-border rounded-lg text-foreground placeholder:text-muted-foreground font-mono focus:outline-none focus:border-foreground/40"
                    />
                  </div>
                </div>

                {/* Triage Decision Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTriageAction("REJECTED")}
                      disabled={isTriageSubmitting}
                      className="text-xs font-mono flex items-center gap-1.5 hover:border-red-500/50 hover:text-red-400 bg-black"
                    >
                      <XCircle className="size-3.5 text-red-400" />
                      <span>Reject False Positive</span>
                      <kbd className="hidden sm:inline-block px-1 py-0.2 bg-[#171717] border border-border text-[9px]">R</kbd>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTriageAction("DUPLICATE")}
                      disabled={isTriageSubmitting}
                      className="text-xs font-mono flex items-center gap-1.5 bg-black"
                    >
                      <Copy className="size-3.5 text-foreground/50" />
                      <span>Duplicate</span>
                      <kbd className="hidden sm:inline-block px-1 py-0.2 bg-[#171717] border border-border text-[9px]">D</kbd>
                    </Button>
                  </div>

                  <Button
                    variant="chamfer"
                    size="sm"
                    onClick={() => handleTriageAction("CONFIRMED")}
                    isLoading={isTriageSubmitting}
                    className="text-xs font-mono flex items-center gap-2 h-10 px-5"
                  >
                    <CheckCircle2 className="size-3.5 text-black" />
                    <span>[CONFIRM AS VERIFIED DEFECT]</span>
                    <kbd className="hidden sm:inline-block px-1 py-0.2 bg-black/20 text-black border border-black/30 text-[9px]">C</kbd>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs font-mono text-muted-foreground space-y-3">
              <CheckSquare className="h-8 w-8 text-muted-foreground" />
              <div className="font-semibold text-foreground text-sm">Select a finding to inspect</div>
              <p className="max-w-xs text-muted-foreground text-[11px] leading-relaxed">
                Use your mouse or keyboard shortcuts (<kbd className="px-1 py-0.5 rounded bg-surface border border-border">J</kbd> / <kbd className="px-1 py-0.5 rounded bg-surface border border-border">K</kbd>) to cycle through findings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FindingsInboxPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-xs font-mono text-muted-foreground">
          Loading findings workbench...
        </div>
      }
    >
      <FindingsWorkbench projectId={projectId} />
    </Suspense>
  );
}
