"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Terminal,
  Activity,
  Layers,
  FileText,
  Lock,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RqiGauge } from "@/components/audit/RqiGauge";
import { HardGateBadges } from "@/components/audit/HardGateBadges";
import { RqiScore } from "@/lib/types";

export default function LandingPage() {
  const router = useRouter();
  const [targetUrl, setTargetUrl] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);

  // Demo interactive RQI score
  const demoRqi: RqiScore = {
    overallScore: 78,
    coveragePercentage: 92,
    verdict: "PROVISIONAL_PASS",
    gateSecurityPassed: true,
    gateFunctionalPassed: true,
    securityScore: 82,
    availabilityScore: 100,
    linksScore: 75,
    performanceScore: 68,
    reasons: [
      "Hard Gate 1 (Security): TLS certificate valid with 82 days remaining.",
      "Hard Gate 2 (Functional): Zero active CRITICAL defects.",
      "Minor Anomaly: 2 broken links detected on footer navigation.",
    ],
  };

  const handleLaunchInstantAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) return;

    try {
      setIsAuditing(true);
      // Create project or redirect to demo with this target
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: new URL(targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`).hostname,
          targetUrl: targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`,
          environment: "PREVIEW",
        }),
      });

      if (!res.ok) throw new Error("Failed to register project");
      const project = await res.json();
      router.push(`/projects/${project.id}`);
    } catch (err) {
      console.error(err);
      // Fallback to demo
      router.push("/projects/proj_demo_preview");
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden">
      {/* Background ambient lighting and pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <section className="relative w-full max-w-5xl mx-auto px-4 pt-20 pb-16 text-center space-y-8 z-10">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface-raised border border-border text-xs font-mono text-muted-foreground shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>ReleaseLens Architecture ADR-020 &amp; ADR-023 Compliant</span>
        </div>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground font-sans">
            Confidence Before You Ship. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-200 to-sky-400 bg-clip-text text-transparent">
              Evidence-Backed Quality.
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
            The cloud-hosted web application testing and bug discovery platform. Bounded automated quality
            audits, structured human triage, and strict release-readiness gating.
          </p>
        </div>

        {/* Instant Audit Input Bar */}
        <div className="max-w-xl mx-auto">
          <form
            onSubmit={handleLaunchInstantAudit}
            className="p-1.5 rounded-2xl bg-surface/90 border border-border shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="relative flex-1 w-full flex items-center">
              <span className="absolute left-3.5 text-xs font-mono text-muted-foreground">https://</span>
              <input
                type="text"
                placeholder="myapp-preview.vercel.app"
                value={targetUrl.replace(/^https?:\/\//, "")}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="w-full pl-20 pr-4 py-2.5 text-xs font-mono bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isAuditing}
              className="w-full sm:w-auto shrink-0 shadow-md"
            >
              Run Audit <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          <div className="mt-3 flex items-center justify-center gap-6 text-[11px] font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" /> ₹0 Cloud Architecture
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Zero Machine-Local Dependencies
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Read-Only Evidence Grounding
            </span>
          </div>
        </div>
      </section>

      {/* Definitive Workflow Diagram */}
      <section className="w-full max-w-6xl mx-auto px-4 py-12 z-10">
        <div className="text-center mb-8">
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Core Operational Workflow
          </h2>
          <p className="text-xl font-semibold text-foreground mt-1">
            Automate First, Human Review Second
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          <div className="p-5 rounded-xl bg-surface border border-border space-y-2 relative overflow-hidden">
            <div className="text-muted-foreground text-[10px] uppercase">Step 01</div>
            <h3 className="font-semibold text-foreground text-sm">Automated Inspection</h3>
            <p className="text-muted-foreground font-sans text-xs">
              Crawler probes TLS certificate, strict security headers, and crawls up to 15 internal routes.
            </p>
            <div className="pt-2 text-[10px] text-emerald-400">Autonomous Cloud Execution</div>
          </div>

          <div className="p-5 rounded-xl bg-surface border border-border space-y-2 relative overflow-hidden">
            <div className="text-muted-foreground text-[10px] uppercase">Step 02</div>
            <h3 className="font-semibold text-foreground text-sm">Potential Findings</h3>
            <p className="text-muted-foreground font-sans text-xs">
              Every failure or anomaly is generated into a triage inbox in <code>NEEDS_REVIEW</code> status.
            </p>
            <div className="pt-2 text-[10px] text-cyan-400">Zero False Assumptions</div>
          </div>

          <div className="p-5 rounded-xl bg-surface border border-border space-y-2 relative overflow-hidden">
            <div className="text-muted-foreground text-[10px] uppercase">Step 03</div>
            <h3 className="font-semibold text-foreground text-sm">Human QA Triage</h3>
            <p className="text-muted-foreground font-sans text-xs">
              Testers validate evidence, confirm legitimate bugs, reject false positives, and adjust severity.
            </p>
            <div className="pt-2 text-[10px] text-amber-400">Verified Defect Inventory</div>
          </div>

          <div className="p-5 rounded-xl bg-surface border border-border space-y-2 relative overflow-hidden">
            <div className="text-muted-foreground text-[10px] uppercase">Step 04</div>
            <h3 className="font-semibold text-foreground text-sm">Retest &amp; Release Verdict</h3>
            <p className="text-muted-foreground font-sans text-xs">
              Tripartite RQI engine computes release readiness and enforces strict Security and Functional hard gates.
            </p>
            <div className="pt-2 text-[10px] text-emerald-400">Non-Negotiable Gating</div>
          </div>
        </div>
      </section>

      {/* Interactive Telemetry Preview: RQI Gauge & Gates */}
      <section className="w-full max-w-5xl mx-auto px-4 py-12 z-10 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase text-muted-foreground">Interactive Demo</span>
            <h2 className="text-2xl font-bold text-foreground">Live Telemetry &amp; RQI Engine</h2>
          </div>
          <Link
            href="/projects/proj_demo_preview"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
          >
            Explore Full Demo Project <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="space-y-6">
          <RqiGauge rqi={demoRqi} />
          <HardGateBadges
            gateSecurityPassed={demoRqi.gateSecurityPassed}
            gateFunctionalPassed={demoRqi.gateFunctionalPassed}
            tlsValid={true}
            tlsDaysLeft={82}
            httpsRedirect={true}
            clickjackingProtected={true}
            criticalBugsCount={0}
          />
        </div>
      </section>

      {/* Comparison: ReleaseLens vs Scan-Only Tools */}
      <section className="w-full max-w-5xl mx-auto px-4 py-16 z-10 border-t border-border/60">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-foreground">Why ReleaseLens?</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            ReleaseLens is NOT merely a PageSpeed or synthetic scanner. It unifies automated discovery with
            exploratory QA testing and developer release governance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
            <div className="text-red-400 font-semibold text-sm uppercase">Ordinary Scanners</div>
            <ul className="space-y-2.5 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-red-400 font-bold">×</span> Swallows false positives without review
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400 font-bold">×</span> High performance score masks broken login buttons
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400 font-bold">×</span> No tester bug reproduction steps or handoff
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400 font-bold">×</span> Requires heavy local headless browser infrastructure
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-emerald-500/30 space-y-4">
            <div className="text-emerald-400 font-semibold text-sm uppercase">ReleaseLens Platform</div>
            <ul className="space-y-2.5 text-foreground/90">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                Human Triage Inbox for all automated findings
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                Hard Security &amp; Functional Gates block release if broken
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                Structured Bug Lifecycle (`OPEN` $\to$ `FIXED` $\to$ `VERIFIED`)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ₹0 Serverless Cloud Architecture, Zero Local Setup
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-semibold text-sm hover:bg-foreground/90 transition-all shadow-lg"
          >
            <Sparkles className="h-4 w-4" /> Enter ReleaseLens Workspace
          </Link>
        </div>
      </section>
    </div>
  );
}
