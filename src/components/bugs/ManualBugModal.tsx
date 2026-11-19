"use client";

import React, { useState } from "react";
import { Severity } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
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
      <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
        {/* Title */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-foreground/60 mb-1.5">
            Defect Summary / Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Checkout modal fails to submit when promo code is entered"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-black border border-border text-foreground font-mono focus:outline-none focus:border-primary/50"
          />
        </div>

        {/* Severity & Reporter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-foreground/60 mb-1.5">
              Severity *
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
              className="w-full px-3 py-2 text-xs bg-black border border-border text-foreground font-mono focus:outline-none focus:border-primary/50"
            >
              <option value="CRITICAL">CRITICAL (Blocks Release Gate)</option>
              <option value="HIGH">HIGH (Degrades Core User Journey)</option>
              <option value="MEDIUM">MEDIUM (Functional Defect)</option>
              <option value="LOW">LOW (Cosmetic / Minor Bug)</option>
              <option value="INFO">INFO (Advisory / Suggestion)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-foreground/60 mb-1.5">
              Tester / Reporter *
            </label>
            <input
              type="text"
              required
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-black border border-border text-foreground font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-foreground/60 mb-1.5">
            Description &amp; Context
          </label>
          <textarea
            rows={2}
            placeholder="Provide relevant user journey, branch, or browser context..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-black border border-border text-foreground font-mono placeholder:text-foreground/30 focus:outline-none focus:border-primary/50"
          />
        </div>

        {/* Steps to Reproduce */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] uppercase tracking-wider text-foreground/60">
              Steps to Reproduce
            </label>
            <button
              type="button"
              onClick={handleAddStep}
              className="text-[11px] font-mono text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="size-3" /> Add Step
            </button>
          </div>

          <div className="space-y-2">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs font-mono text-foreground/40 w-5 text-right">
                  {idx + 1}.
                </span>
                <input
                  type="text"
                  placeholder={`Step ${idx + 1}...`}
                  value={step}
                  onChange={(e) => handleUpdateStep(idx, e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-black border border-border text-foreground font-mono focus:outline-none focus:border-primary/50"
                />
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(idx)}
                    className="p-1 text-foreground/40 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Expected vs Actual */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-foreground/60 mb-1.5">
              Expected Behavior
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Discount is applied and cart updates total immediately"
              value={expectedBehavior}
              onChange={(e) => setExpectedBehavior(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-black border border-border text-foreground font-mono focus:outline-none focus:border-primary/50"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-foreground/60 mb-1.5">
              Actual Behavior
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Button enters infinite spinner; 500 error in Network tab"
              value={actualBehavior}
              onChange={(e) => setActualBehavior(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-black border border-border text-foreground font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {/* Evidence / JSON / Logs */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-foreground/60 mb-1.5">
            Technical Evidence / Error Stack (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Paste raw error message, JSON payload, or network response..."
            value={rawEvidence}
            onChange={(e) => setRawEvidence(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-black border border-border text-foreground font-mono placeholder:text-foreground/30 focus:outline-none focus:border-primary/50"
          />
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-border flex justify-end gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="chamfer" size="sm" isLoading={isSubmitting} className="h-9 px-4">
            <Bug className="size-3.5 mr-1" />
            [LOG DEFECT REPORT]
          </Button>
        </div>
      </form>
    </Modal>
  );
}