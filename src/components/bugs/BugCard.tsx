"use client";

import React, { useState } from "react";
import { BugReport, BugStatus, Severity } from "@/lib/types";
import { getSeverityStyle, getStatusStyle } from "@/lib/utils";
import { CheckCircle2, RotateCcw, AlertCircle, ChevronDown, ChevronRight, User, Clock, Terminal } from "lucide-react";

interface BugCardProps {
  bug: BugReport;
  onStatusChange: (bugId: string, status: BugStatus) => Promise<void>;
  onTriggerRetest: (bug: BugReport) => void;
}

export function BugCard({ bug, onStatusChange, onTriggerRetest }: BugCardProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const sevStyle = getSeverityStyle(bug.severity);
  const statusStyle = getStatusStyle(bug.status);

  const handleSelectStatus = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as BugStatus;
    try {
      setIsUpdating(true);
      await onStatusChange(bug.id, newStatus);
    } catch (err) {
      console.error("Status update failed:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface hover:border-border/90 transition-all overflow-hidden shadow-sm">
      <div className="p-5 flex flex-col gap-3">
        {/* Top Badges & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-medium border ${sevStyle.bg} ${sevStyle.text} ${sevStyle.border}`}
            >
              {bug.severity}
            </span>

            <span
              className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
            >
              {bug.status.replace("_", " ")}
            </span>

            {(bug.retestCount ?? 0) > 0 && (
              <span className="text-[10px] font-mono text-muted-foreground bg-surface-raised px-2 py-0.5 rounded border border-border">
                Retests: {bug.retestCount}
              </span>
            )}
          </div>

          {/* Quick Retest and Status Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTriggerRetest(bug)}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-surface-raised hover:bg-surface text-foreground border border-border transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="h-3 w-3 text-cyan-400" />
              Retest Verification
            </button>

            <select
              value={bug.status}
              disabled={isUpdating}
              onChange={handleSelectStatus}
              className="text-xs font-mono bg-surface-raised border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none focus:border-foreground/40 cursor-pointer"
            >
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
        </div>

        {/* Title and summary */}
        <div>
          <h3
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm font-semibold text-foreground cursor-pointer hover:text-foreground/80 flex items-center justify-between"
          >
            <span>{bug.title}</span>
            <button className="text-muted-foreground p-1">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {bug.description}
          </p>
        </div>

        {/* Quick meta: Reporter, Environment, Date */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-muted-foreground pt-2 border-t border-border/50">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{bug.reportedBy || "QA Engineer"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{new Date(bug.createdAt).toLocaleDateString()}</span>
          </div>
          {bug.environment && (
            <div className="text-muted-foreground">
              Env: <span className="text-foreground">{bug.environment}</span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details: Steps to Reproduce, Expected vs Actual, Evidence */}
      {isExpanded && (
        <div className="px-5 py-4 bg-background/50 border-t border-border space-y-4 text-xs font-mono">
          {/* Reproduction Steps */}
          {bug.stepsToReproduce && bug.stepsToReproduce.length > 0 && (
            <div>
              <span className="text-[10px] uppercase text-muted-foreground block mb-1">
                Steps to Reproduce:
              </span>
              <ol className="list-decimal list-inside space-y-1 text-foreground/90 bg-surface p-3 rounded-lg border border-border">
                {bug.stepsToReproduce.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Expected vs Actual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-surface border border-border">
              <span className="text-[10px] uppercase text-emerald-400 block mb-1">
                Expected Behavior:
              </span>
              <p className="text-foreground/90">{bug.expectedBehavior || "None specified"}</p>
            </div>
            <div className="p-3 rounded-lg bg-surface border border-border">
              <span className="text-[10px] uppercase text-red-400 block mb-1">
                Actual Behavior:
              </span>
              <p className="text-foreground/90">{bug.actualBehavior || "None specified"}</p>
            </div>
          </div>

          {/* Technical Evidence */}
          {bug.evidence && (
            <div>
              <span className="text-[10px] uppercase text-muted-foreground block mb-1">
                Technical Evidence:
              </span>
              <pre className="p-3 rounded-lg bg-surface border border-border text-[11px] overflow-x-auto max-h-48 text-foreground/90">
                {typeof bug.evidence === "object" ? JSON.stringify(bug.evidence, null, 2) : String(bug.evidence)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
