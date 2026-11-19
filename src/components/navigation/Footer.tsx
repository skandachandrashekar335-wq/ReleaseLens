import React from "react";
import Link from "next/link";
import { ExternalLink, Terminal, GitBranch, Lock } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/80 bg-black/60 backdrop-blur-[2px] py-16 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Identity */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="size-7 rounded-none border border-primary/50 bg-black flex items-center justify-center text-primary [box-shadow:inset_0_0_10px_rgba(235,184,0,0.3)]">
                <span className="font-mono font-bold text-xs text-primary">RL</span>
              </div>
              <span className="font-mono font-bold text-sm tracking-wider text-foreground uppercase">
                ReleaseLens
              </span>
            </div>
            <p className="text-xs font-mono text-foreground/60 leading-relaxed">
              Cloud-hosted autonomous web application testing, bug discovery, evidence collection, and release-readiness gating.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono text-foreground/50">
              <Lock className="size-3 text-primary" />
              <span>₹0 Budget • Zero Machine-Local Dependencies</span>
            </div>
          </div>

          {/* Col 2: Engine Tiers */}
          <div className="space-y-3 font-mono">
            <h4 className="text-xs uppercase tracking-wider text-foreground font-semibold">Engine Execution Tiers</h4>
            <ul className="text-xs space-y-2 text-foreground/60">
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" />
                <span>Tier 1: TLS, Headers & Bounded Crawl</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" />
                <span>Tier 2: PageSpeed & CWV Lab Telemetry</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" />
                <span>Tier 3: Browser Interaction & DOM Replay</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" />
                <span>RQI Governance & Defect Hard Gates</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Workflow */}
          <div className="space-y-3 font-mono">
            <h4 className="text-xs uppercase tracking-wider text-foreground font-semibold">Deterministic Workflow</h4>
            <div className="text-[11px] space-y-1.5 text-foreground/60 bg-[#0d0d0d] p-3 border border-border">
              <div>01 // Enter Application URL</div>
              <div>02 // Bounded Autonomous Exploration</div>
              <div>03 // Evidence & Finding Ingestion</div>
              <div>04 // Human Tester Triage Workbench</div>
              <div>05 // Confirmed Bug Tracking & Retest</div>
              <div>06 // Release-Readiness Gate Index</div>
            </div>
          </div>

          {/* Col 4: Governance */}
          <div className="space-y-3 font-mono">
            <h4 className="text-xs uppercase tracking-wider text-foreground font-semibold">Governance & ADR</h4>
            <ul className="text-xs space-y-2 text-foreground/60">
              <li>
                <a
                  href="https://github.com/skandachandrashekar335-wq/ReleaseLens"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <GitBranch className="size-3" /> GitHub Repository
                  <ExternalLink className="size-2.5 ml-0.5 opacity-60" />
                </a>
              </li>
              <li className="flex items-center gap-1.5 text-foreground/70">
                <Terminal className="size-3 text-primary" />
                <span>ADR-020 &amp; ADR-023 Certified</span>
              </li>
              <li className="text-[11px] text-foreground/40">
                Strict Status State Machine Verified
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-foreground/50 gap-4">
          <div>© {new Date().getFullYear()} ReleaseLens. All rights reserved. Zero local runtime requirements.</div>
          <div className="flex items-center gap-6 uppercase tracking-wider">
            <span className="text-primary flex items-center gap-1.5">
              <span className="inline-block size-1.5 rounded-full bg-primary shadow-glow shadow-primary/60" />
              STATUS: OPERATIONAL
            </span>
            <span>RQI GOVERNANCE: ACTIVE</span>
          </div>
        </div>
      </div>
    </footer>
  );
}