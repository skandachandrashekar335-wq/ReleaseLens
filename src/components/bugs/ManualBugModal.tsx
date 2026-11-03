"use client";

import React, { useState } from "react";
import { Severity } from "@/lib/types";
import { Modal } from "@/lib/../components/ui/Modal";
import { Button } from "@/lib/../components/ui/Button";
import { Bug, Plus, Trash2 } from "lucide-react";

interface ManualBugModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreateBug: (bugData: {
    projectId: string;
    title: string;
    description: string;
    severity: Severity;
    stepsToReproduce: string[];
    expectedBehavior: string;
    actualBehavior: string;
    reportedBy: string;
    evidence?: any;
  }) => Promise<void>;
}

export function ManualBugModal({ projectId, isOpen, onClose, onCreateBug }: ManualBugModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("HIGH");
  const [steps, setSteps] = useState<string[]>([""]);
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [actualBehavior, setActualBehavior] = useState("");
  const [reportedBy, setReportedBy] = useState("QA Explorer");
  const [rawEvidence, setRawEvidence] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddStep = () => {
    setSteps([...steps, ""]);
  };

  const handleUpdateStep = (index: number, val: string) => {
    const updated = [...steps];
    updated[index] = val;
    setSteps(updated);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      let parsedEvidence = undefined;
      if (rawEvidence.trim()) {
        try {
          parsedEvidence = JSON.parse(rawEvidence);
        } catch {
          parsedEvidence = { notes: rawEvidence };
        }
      }

      await onCreateBug({
        projectId,
        title,
        description,
        severity,
        stepsToReproduce: steps.filter((s) => s.trim().length > 0),
        expectedBehavior,
        actualBehavior,
        reportedBy,
        evidence: parsedEvidence,
      });

      // Reset
      setTitle("");
      setDescription("");
      setSteps([""]);
      setExpectedBehavior("");
      setActualBehavior("");
      setRawEvidence("");
      onClose();
    } catch (err) {
      console.error("Bug creation failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Exploratory Defect"
      description="Record structured findings observed during manual testing sessions with developer reproduction steps."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
            Defect Summary / Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Checkout modal fails to submit when promo code is entered"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-surface-raised border border-border rounded-lg text-foreground font-mono focus:outline-none focus:border-foreground/50"
          />
        </div>

        {/* Severity & Reporter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
              Severity *
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
              className="w-full px-3 py-2 text-xs bg-surface-raised border border-border rounded-lg text-foreground font-mono focus:outline-none focus:border-foreground/50"
            >
              <option value="CRITICAL">CRITICAL (Blocks Release Gate)</option>
              <option value="HIGH">HIGH (Degrades Core User Journey)</option>
              <option value="MEDIUM">MEDIUM (Functional Defect)</option>
              <option value="LOW">LOW (Cosmetic / Minor Bug)</option>
              <option value="INFO">INFO (Advisory / Suggestion)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
              Tester / Reporter *
            </label>
            <input
              type="text"
              required
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface-raised border border-border rounded-lg text-foreground font-mono focus:outline-none focus:border-foreground/50"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
            Description & Context
          </label>
          <textarea
            rows={2}
            placeholder="Provide relevant user journey, branch, or browser context..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-surface-raised border border-border rounded-lg text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:border-foreground/50"
          />
        </div>

        {/* Steps to Reproduce */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-mono uppercase text-muted-foreground">
              Steps to Reproduce
            </label>
            <button
              type="button"
              onClick={handleAddStep}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Add Step
            </button>
          </div>

          <div className="space-y-2">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground w-5 text-right">
                  {idx + 1}.
                </span>
                <input
                  type="text"
                  placeholder={`Step ${idx + 1}...`}
                  value={step}
                  onChange={(e) => handleUpdateStep(idx, e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-surface-raised border border-border rounded-lg text-foreground font-mono focus:outline-none focus:border-foreground/50"
                />
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(idx)}
                    className="p-1 text-muted-foreground hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Expected vs Actual */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
              Expected Behavior
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Discount is applied and cart updates total immediately"
              value={expectedBehavior}
              onChange={(e) => setExpectedBehavior(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-surface-raised border border-border rounded-lg text-foreground font-mono focus:outline-none focus:border-foreground/50"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
              Actual Behavior
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Button enters infinite spinner; 500 error in Network tab"
              value={actualBehavior}
              onChange={(e) => setActualBehavior(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-surface-raised border border-border rounded-lg text-foreground font-mono focus:outline-none focus:border-foreground/50"
            />
          </div>
        </div>

        {/* Evidence / JSON / Logs */}
        <div>
          <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
            Technical Evidence / Error Stack (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Paste raw error message, JSON payload, or network response..."
            value={rawEvidence}
            onChange={(e) => setRawEvidence(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-surface-raised border border-border rounded-lg text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:border-foreground/50"
          />
        </div>

        {/* Submit */}
        <div className="pt-3 border-t border-border flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            <Bug className="h-3.5 w-3.5 mr-1" />
            Log Defect Report
          </Button>
        </div>
      </form>
    </Modal>
  );
}
