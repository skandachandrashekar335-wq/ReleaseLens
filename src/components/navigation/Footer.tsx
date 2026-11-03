import React from "react";
import Link from "next/link";
import { Shield, ExternalLink, Terminal, GitBranch, Lock } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/80 bg-background/50 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Identity */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-surface-raised border border-border flex items-center justify-center">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <span className="font-semibold text-sm tracking-tight text-foreground">ReleaseLens</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Cloud-hosted Web Application Testing, Bug Discovery, Evidence Collection, and Release-Readiness Platform.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
              <Lock className="h-3 w-3 text-emerald-400" />
              <span>₹0 Budget • Zero Machine-Local Dependencies</span>
            </div>
          </div>

          {/* Col 2: Architecture & Engine */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-mono uppercase tracking-wider text-foreground font-semibold">Engine Pipeline</h4>
            <ul className="text-xs space-y-1.5 text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live TLS & Expiry Inspector
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Strict Security Headers & CSP Probe
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Bounded Link & Broken Route Crawler
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Google PageSpeed & CWV Lab Client
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Tripartite RQI Scoring Governance
              </li>
            </ul>
          </div>

          {/* Col 3: Workflow */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-mono uppercase tracking-wider text-foreground font-semibold">Definitive Workflow</h4>
            <div className="font-mono text-[11px] space-y-1 text-muted-foreground bg-surface-raised/40 p-2.5 rounded-lg border border-border">
              <div>1. Enter Target URL</div>
              <div>2. Run Automated Checks</div>
              <div>3. Surface Potential Findings</div>
              <div>4. Human Tester Triage</div>
              <div>5. Confirmed Bugs Handled</div>
              <div>6. Retest & Release Verdict</div>
            </div>
          </div>

          {/* Col 4: Governance & Spec */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-mono uppercase tracking-wider text-foreground font-semibold">Documentation & Repo</h4>
            <ul className="text-xs space-y-2 text-muted-foreground">
              <li>
                <a
                  href="https://github.com/skandachandrashekar335-wq/ReleaseLens"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <GitBranch className="h-3 w-3" /> GitHub Repository
                  <ExternalLink className="h-2.5 w-2.5 ml-0.5 opacity-60" />
                </a>
              </li>
              <li>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Terminal className="h-3 w-3 text-cyan-400" /> ADR-020 & ADR-023 Certified
                </span>
              </li>
              <li className="text-[11px] font-mono text-muted-foreground/80">
                Governance: Strict Status State Machine
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-muted-foreground gap-3">
          <div>© {new Date().getFullYear()} ReleaseLens. All rights reserved. Zero local runtime requirements.</div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-400">STATUS: OPERATIONAL</span>
            <span>RQI GOVERNANCE: ACTIVE</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
