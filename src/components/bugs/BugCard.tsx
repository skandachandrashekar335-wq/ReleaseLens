"use client";

import React, { useState } from "react";
import { BugReport, BugStatus, Severity } from "@/lib/types";
import { getSeverityStyle, getStatusStyle } from "@/lib/utils";
import { ChevronDown, ChevronRight, User, Clock, RotateCcw } from "lucide-react";

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
    <div className="border border-border bg-[#0d0d0d] hover:border-primary/40 transition-all overflow-hidden shadow-md">
      <div className="p-5 flex flex-col gap-3.5">
        {/* Top Badges & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono">
            <span
              className={`px-2 py-0.5 text-[10px] font-mono uppercase font-semibold border ${sevStyle.bg} ${sevStyle.text} ${sevStyle.border}`}
            >
              {bug.severity}
            </span>

            <span
              className={`px-2 py-0.5 text-[10px] font-mono uppercase font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
            >
              {bug.status.replace("_", " ")}
            </span>

            {(bug.retestCount ?? 0) > 0 && (
              <span className="text-[10px] font-mono text-foreground/50 bg-black px-2 py-0.5 border border-border">
                Retests: {bug.retestCount}
              </span>
            )}
          </div>

          {/* Quick Retest and Status Selector */}
          <div className="flex items-center gap-2 font-mono">
            <button
              onClick={() => onTriggerRetest(bug)}
              className="px-3 py-1.5 text-xs uppercase tracking-wider font-semibold bg-black hover:bg-[#171717] text-primary border border-primary/40 hover:border-primary transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="size-3 text-primary" />
              Retest Verification
            </button>

            <select
              value={bug.status}
              disabled={isUpdating}
              onChange={handleSelectStatus}
              className="text-xs font-mono bg-black border border-border px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary/50 cursor-pointer"
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
            className="text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors flex items-center justify-between"
          >
            <span>{bug.title}</span>
            <button className="text-foreground/40 p-1">
              {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </button>
          </h3>
          <p className="text-xs text-foreground/60 mt-1 line-clamp-2 leading-relaxed font-sans">
            {bug.description}
          </p>
        </div>

        {/* Quick meta: Reporter, Environment, Date */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-foreground/40 pt-2 border-t border-border">
          <div className="flex items-center gap-1.5">
            <User className="size-3" />
            <span>{bug.reportedBy || "QA Engineer"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="size-3" />
            <span>{new Date(bug.createdAt).toLocaleDateString()}</span>
          </div>
          {bug.environment && (
            <div className="text-foreground/40">
              Env: <span className="text-foreground font-mono">{bug.environment}</span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details: Steps to Reproduce, Expected vs Actual, Evidence */}
      {isExpanded && (
        <div className="px-5 py-5 bg-black border-t border-border space-y-4 text-xs font-mono">
          {/* Reproduction Steps */}
          {bug.stepsToReproduce && bug.stepsToReproduce.length > 0 && (
            <div>
              <span className="text-[10px] uppercase text-foreground/50 block mb-1.5 tracking-wider">
                Steps to Reproduce:
              </span>
              <ol className="list-decimal list-inside space-y-1 text-foreground/80 bg-[#0d0d0d] p-3 border border-border">
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
            <div className="p-3 bg-[#0d0d0d] border border-border">
              <span className="text-[10px] uppercase text-primary block mb-1 tracking-wider">
                Expected Behavior:
              </span>
              <p className="text-foreground/80 font-sans text-xs">{bug.expectedBehavior || "None specified"}</p>
            </div>
            <div className="p-3 bg-[#0d0d0d] border border-border">
              <span className="text-[10px] uppercase text-red-400 block mb-1 tracking-wider">
                Actual Behavior:
              </span>
              <p className="text-foreground/80 font-sans text-xs">{bug.actualBehavior || "None specified"}</p>
            </div>
          </div>

          {/* Technical Evidence */}
          {bug.evidence && (
            <div>
              <span className="text-[10px] uppercase text-foreground/50 block mb-1.5 tracking-wider">
                Technical Evidence:
              </span>
              <pre className="p-3 bg-[#0d0d0d] border border-border text-[11px] overflow-x-auto max-h-48 text-foreground/80">
                {typeof bug.evidence === "object" ? JSON.stringify(bug.evidence, null, 2) : String(bug.evidence)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}