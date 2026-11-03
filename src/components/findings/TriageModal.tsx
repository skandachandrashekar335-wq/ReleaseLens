"use client";

import React, { useState } from "react";
import { PotentialFinding, Severity } from "@/lib/types";
import { Modal } from "@/lib/../components/ui/Modal";
import { Button } from "@/lib/../components/ui/Button";
import { getSeverityStyle } from "@/lib/utils";
import { AlertCircle, CheckCircle, XCircle, ShieldAlert, FileText } from "lucide-react";

interface TriageModalProps {
  finding: PotentialFinding | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmTriage: (
    findingId: string,
    action: "CONFIRMED" | "REJECTED" | "DUPLICATE" | "ACCEPTED_RISK",
    severity: Severity,
    notes: string,
    triagedBy: string
  ) => Promise<void>;
}

export function TriageModal({ finding, isOpen, onClose, onConfirmTriage }: TriageModalProps) {
  if (!finding) return null;

  const [severity, setSeverity] = useState<Severity>(
    finding.suggestedSeverity || finding.recommendedSeverity || "MEDIUM"
  );
  const [notes, setNotes] = useState<string>("");
  const [triagedBy, setTriagedBy] = useState<string>("Lead QA Engineer");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (action: "CONFIRMED" | "REJECTED" | "DUPLICATE" | "ACCEPTED_RISK") => {
    try {
      setIsLoading(true);
      await onConfirmTriage(finding.id, action, severity, notes, triagedBy);
      onClose();
    } catch (err) {
      console.error("Triage failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Triage Potential Finding"
      description="Inspect captured technical evidence, adjust severity, and promote to verified bug or dismiss."
      size="lg"
    >
      <div className="space-y-5">
        {/* Finding Info */}
        <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface border border-border text-muted-foreground">
              {finding.sourceCheck || finding.testSource || "AUDIT_PROBE"}
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              Detected: {new Date(finding.createdAt).toLocaleString()}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-foreground">{finding.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{finding.description}</p>
        </div>

        {/* Evidence Inspector */}
        <div>
          <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            Captured Technical Evidence (Immutable)
          </label>
          <pre className="p-3 rounded-lg bg-surface border border-border text-[11px] font-mono text-foreground/90 max-h-48 overflow-y-auto">
            {JSON.stringify(finding.evidence, null, 2)}
          </pre>
        </div>

        {/* Severity Override */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">
              Defect Severity
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
              className="w-full px-3 py-2 text-xs bg-surface-raised border border-border rounded-lg text-foreground font-mono focus:outline-none focus:border-foreground/50"
            >
              <option value="CRITICAL">CRITICAL (Blocks Release Gate)</option>
              <option value="HIGH">HIGH (Degrades Core Experience)</option>
              <option value="MEDIUM">MEDIUM (Functional Anomaly)</option>
              <option value="LOW">LOW (Cosmetic / Polish)</option>
              <option value="INFO">INFO (Advisory Telemetry)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">
              Reviewing Tester
            </label>
            <input
              type="text"
              value={triagedBy}
              onChange={(e) => setTriagedBy(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface-raised border border-border rounded-lg text-foreground font-mono focus:outline-none focus:border-foreground/50"
            />
          </div>
        </div>

        {/* Triage / Reproduction Notes */}
        <div>
          <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">
            Tester Triage Assessment & Developer Instructions
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe specific reproduction observations or developer fix instructions..."
            className="w-full px-3 py-2 text-xs bg-surface-raised border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/50 font-mono"
          />
        </div>

        {/* Triage Action Buttons */}
        <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => handleSubmit("REJECTED")}
            >
              <XCircle className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              Reject False Positive
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => handleSubmit("ACCEPTED_RISK")}
            >
              Accept Risk
            </Button>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            isLoading={isLoading}
            onClick={() => handleSubmit("CONFIRMED")}
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Confirm as Verified Bug
          </Button>
        </div>
      </div>
    </Modal>
  );
}
