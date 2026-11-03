"use client";

import React from "react";
import { PotentialFinding } from "@/lib/types";
import { getSeverityStyle } from "@/lib/utils";
import { AlertCircle, CheckCircle, XCircle, Copy, Shield, ChevronRight } from "lucide-react";

interface FindingCardProps {
  finding: PotentialFinding;
  onTriage: (finding: PotentialFinding, action: "CONFIRMED" | "REJECTED" | "DUPLICATE" | "ACCEPTED_RISK") => void;
  onOpenDetails: (finding: PotentialFinding) => void;
}

export function FindingCard({ finding, onTriage, onOpenDetails }: FindingCardProps) {
  const severity = finding.suggestedSeverity || finding.recommendedSeverity || "MEDIUM";
  const sevStyle = getSeverityStyle(severity);
  const sourceLabel = finding.sourceCheck || finding.testSource || "AUDIT_PROBE";

  return (
    <div className="p-5 rounded-xl border border-border bg-surface hover:border-border/90 transition-all flex flex-col justify-between gap-4 shadow-sm">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${sevStyle.bg} ${sevStyle.text} ${sevStyle.border}`}
            >
              {severity}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase px-1.5 py-0.5 rounded bg-surface-raised border border-border">
              {sourceLabel}
            </span>
          </div>

          <span className="text-[10px] font-mono text-muted-foreground">
            {new Date(finding.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div>
          <h4
            onClick={() => onOpenDetails(finding)}
            className="text-sm font-semibold text-foreground hover:text-foreground/80 cursor-pointer flex items-center justify-between group"
          >
            <span>{finding.title}</span>
            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h4>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {finding.description}
          </p>
        </div>
      </div>

      {/* Evidence snippet */}
      {finding.evidence && (
        <div className="p-2.5 rounded-lg bg-surface-raised border border-border text-[11px] font-mono text-muted-foreground max-h-24 overflow-hidden">
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">Evidence Snapshot:</div>
          <div className="truncate">
            {typeof finding.evidence === "object" ? JSON.stringify(finding.evidence) : String(finding.evidence)}
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="pt-3 border-t border-border/60 flex items-center justify-between">
        <button
          onClick={() => onOpenDetails(finding)}
          className="text-xs font-mono text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          View Full Evidence
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onTriage(finding, "REJECTED")}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-surface-raised hover:bg-surface text-muted-foreground hover:text-foreground border border-border transition-colors flex items-center gap-1"
            title="Reject as false positive"
          >
            <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
            Reject
          </button>
          <button
            onClick={() => onTriage(finding, "CONFIRMED")}
            className="px-3 py-1 text-xs font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors flex items-center gap-1 font-mono"
            title="Confirm into verified bug tracker"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Confirm Bug
          </button>
        </div>
      </div>
    </div>
  );
}
