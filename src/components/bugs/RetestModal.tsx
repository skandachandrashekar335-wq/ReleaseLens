"use client";

import React, { useState } from "react";
import { BugReport, RetestVerdict } from "@/lib/types";
import { Modal } from "@/lib/../components/ui/Modal";
import { Button } from "@/lib/../components/ui/Button";
import { RotateCcw, CheckCircle2, XCircle, HelpCircle } from "lucide-react";

interface RetestModalProps {
  bug: BugReport | null;
  isOpen: boolean;
  onClose: () => void;
  onRecordRetest: (bugId: string, verdict: RetestVerdict, comments: string, tester: string) => Promise<void>;
}

export function RetestModal({ bug, isOpen, onClose, onRecordRetest }: RetestModalProps) {
  if (!bug) return null;

  const [verdict, setVerdict] = useState<RetestVerdict>("PASS");
  const [comments, setComments] = useState<string>("");
  const [tester, setTester] = useState<string>("QA Tester");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onRecordRetest(bug.id, verdict, comments, tester);
      onClose();
    } catch (err) {
      console.error("Retest submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Retest Verification"
      description={`Executing verification cycle #${(bug.retestCount ?? 0) + 1} for bug "${bug.title}".`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Retest Verdict Choice */}
        <div>
          <label className="block text-xs font-mono uppercase text-muted-foreground mb-2">
            Verification Verdict
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setVerdict("PASS")}
              className={`p-3 rounded-lg border text-xs font-mono flex flex-col items-center gap-1.5 transition-all ${
                verdict === "PASS"
                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold"
                  : "bg-surface border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>PASS (Fixed)</span>
            </button>

            <button
              type="button"
              onClick={() => setVerdict("FAIL")}
              className={`p-3 rounded-lg border text-xs font-mono flex flex-col items-center gap-1.5 transition-all ${
                verdict === "FAIL"
                  ? "bg-red-500/10 border-red-500 text-red-400 font-semibold"
                  : "bg-surface border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <XCircle className="h-4 w-4" />
              <span>FAIL (Reopen)</span>
            </button>

            <button
              type="button"
              onClick={() => setVerdict("INCONCLUSIVE")}
              className={`p-3 rounded-lg border text-xs font-mono flex flex-col items-center gap-1.5 transition-all ${
                verdict === "INCONCLUSIVE"
                  ? "bg-amber-500/10 border-amber-500 text-amber-400 font-semibold"
                  : "bg-surface border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              <span>INCONCLUSIVE</span>
            </button>
          </div>
        </div>

        {/* Tester */}
        <div>
          <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">
            Tester Name
          </label>
          <input
            type="text"
            required
            value={tester}
            onChange={(e) => setTester(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-surface-raised border border-border rounded-lg text-foreground font-mono focus:outline-none focus:border-foreground/40"
          />
        </div>

        {/* Comments */}
        <div>
          <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">
            Retest Evidence & Verification Notes
          </label>
          <textarea
            rows={3}
            required
            placeholder="Verified on build abc123. Step 3 succeeded as expected; no console errors observed."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-surface-raised border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 font-mono"
          />
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-border flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Record Retest Verdict
          </Button>
        </div>
      </form>
    </Modal>
  );
}
