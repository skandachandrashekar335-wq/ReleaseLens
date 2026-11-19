"use client";

import React, { useState } from "react";
import { BugReport, RetestVerdict } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";

interface RetestModalProps {
  bug: BugReport | null;
  isOpen: boolean;
  onClose: () => void;
  onRecordRetest: (bugId: string, verdict: RetestVerdict, comments: string, tester: string) => Promise<void>;
}

export function RetestModal({ bug, isOpen, onClose, onRecordRetest }: RetestModalProps) {
  const [verdict, setVerdict] = useState<RetestVerdict>("PASS");
  const [comments, setComments] = useState<string>("");
  const [tester, setTester] = useState<string>("QA Tester");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!bug) return null;

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
      description={`Executing verification cycle #${(bug.retestCount ?? 0) + 1} for defect "${bug.title}".`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
        {/* Retest Verdict Choice */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-foreground/60 mb-2">
            Verification Verdict
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setVerdict("PASS")}
              className={`p-3 border text-xs font-mono flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                verdict === "PASS"
                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold"
                  : "bg-black border-border text-foreground/50 hover:text-foreground"
              }`}
            >
              <CheckCircle2 className="size-4" />
              <span>PASS (Fixed)</span>
            </button>

            <button
              type="button"
              onClick={() => setVerdict("FAIL")}
              className={`p-3 border text-xs font-mono flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                verdict === "FAIL"
                  ? "bg-red-500/10 border-red-500 text-red-400 font-bold"
                  : "bg-black border-border text-foreground/50 hover:text-foreground"
              }`}
            >
              <XCircle className="size-4" />
              <span>FAIL (Reopen)</span>
            </button>

            <button
              type="button"
              onClick={() => setVerdict("INCONCLUSIVE")}
              className={`p-3 border text-xs font-mono flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                verdict === "INCONCLUSIVE"
                  ? "bg-amber-500/10 border-amber-500 text-amber-400 font-bold"
                  : "bg-black border-border text-foreground/50 hover:text-foreground"
              }`}
            >
              <HelpCircle className="size-4" />
              <span>INCONCLUSIVE</span>
            </button>
          </div>
        </div>

        {/* Tester */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-foreground/60 mb-1.5">
            Tester Name
          </label>
          <input
            type="text"
            required
            value={tester}
            onChange={(e) => setTester(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-black border border-border text-foreground font-mono focus:outline-none focus:border-primary/50"
          />
        </div>

        {/* Comments */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-foreground/60 mb-1.5">
            Retest Evidence &amp; Verification Notes
          </label>
          <textarea
            rows={3}
            required
            placeholder="Verified on preview deployment. Reproduction steps no longer trigger error; clean console logs."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-black border border-border text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/50 font-mono"
          />
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-border flex justify-end gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="chamfer" size="sm" isLoading={isSubmitting} className="h-9 px-4">
            [RECORD RETEST VERDICT]
          </Button>
        </div>
      </form>
    </Modal>
  );
}