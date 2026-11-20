"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  Terminal,
  Activity,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Pill } from "@/components/pill";
import { Card } from "@/components/ui/Card";
import { RqiGauge } from "@/components/audit/RqiGauge";
import { HardGateBadges } from "@/components/audit/HardGateBadges";
import { RqiScore } from "@/lib/types";

export default function LandingPage() {
  const router = useRouter();
  const [targetUrl, setTargetUrl] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Representative telemetry RQI score
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
      "Minor Anomaly: 2 broken internal links detected.",
    ],
  };

  const handleLaunchInstantAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const trimmed = targetUrl.trim();
    if (!trimmed) return;

    try {
      setIsAuditing(true);
      const formattedUrl = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: new URL(formattedUrl).hostname,
          targetUrl: formattedUrl,
          environment: "PREVIEW",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to register audit target");
      }
      const project = await res.json();
      router.push(`/projects/${project.id}`);
    } catch (err: any) {
      console.warn("Instant audit registration notice:", err.message);
      // Navigate to login / dashboard
      router.push("/login");
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden bg-transparent text-foreground">
      {/* Subtle background technical grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-25 pointer-events-none z-0" />

      {/* Hero Section — 1:1 Matching v0 Reference Template */}
      <section className="relative w-full max-w-4xl mx-auto px-4 pt-24 sm:pt-32 pb-16 text-center z-10 flex flex-col items-center">
        <Pill className="mb-7">AUTONOMOUS QA PLATFORM</Pill>

        {/* Display Heading with Sentient Font + Italic Accent */}
        <h1 className="font-sentient text-5xl leading-[0.98] tracking-[-0.04em] sm:text-6xl md:text-8xl text-foreground">
          Autonomous web
          <br />
          <span className="italic text-[#EAB308]">quality</span>{" "}
          intelligence
        </h1>

        {/* Monospace Subtitle */}
        <p className="mt-8 max-w-2xl text-balance font-mono text-sm leading-relaxed text-foreground/70 sm:text-base">
          Deterministic release gating through bounded audits, evidence collection, and automated defect intelligence.
        </p>

        {/* Chamfered Instant Audit Launcher Bar */}
        <form
          onSubmit={handleLaunchInstantAudit}
          className="mt-10 flex w-full max-w-2xl flex-col gap-2 border border-border bg-black/70 p-2 backdrop-blur-sm sm:h-16 sm:flex-row sm:items-center sm:gap-0 sm:p-1"
        >
          <label className="sr-only" htmlFor="audit-url">
            URL to audit
          </label>
          <span className="px-3 font-mono text-sm text-foreground sm:shrink-0 sm:px-4 select-none">
            https://
          </span>
          <input
            id="audit-url"
            name="url"
            type="text"
            inputMode="url"
            placeholder="app-preview.vercel.app"
            value={targetUrl.replace(/^https?:\/\//, "")}
            onChange={(e) => setTargetUrl(e.target.value)}
            className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-sm text-foreground outline-none placeholder:text-foreground/35 sm:py-0 focus-visible:outline-none"
          />
          <Button
            type="submit"
            variant="chamfer"
            size="sm"
            isLoading={isAuditing}
            onMouseEnter={() => {
              setIsHovering(true);
              if (typeof window !== "undefined") {
                window.dispatchEvent(
                  new CustomEvent("releaselens:audit-hover", { detail: { hovering: true } })
                );
              }
            }}
            onMouseLeave={() => {
              setIsHovering(false);
              if (typeof window !== "undefined") {
                window.dispatchEvent(
                  new CustomEvent("releaselens:audit-hover", { detail: { hovering: false } })
                );
              }
            }}
            className="h-12 shrink-0 bg-[#EAB308] px-5 text-sm text-black shadow-[#EAB308] hover:bg-[#EAB308] hover:text-black sm:h-14 font-semibold"
          >
            [RUN AUDIT]
          </Button>
        </form>

        {errorMsg && (
          <p className="text-xs text-red-400 font-mono mt-3">{errorMsg}</p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {[
            "FREE-TIER CLOUD ENGINE",
            "SSRF GUARD PERIMETER",
            "EVIDENCE GROUNDED",
          ].map((feature) => (
            <div
              className="flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.12em] text-foreground/65 sm:text-xs"
              key={feature}
            >
              <span className="size-1.5 rounded-full bg-[#EAB308] shadow-[0_0_8px_2px_rgba(234,179,8,0.35)]" />
              {feature}
            </div>
          ))}
        </div>
      </section>

      {/* Explicit Three-Tier Execution Architecture */}
      <section className="w-full max-w-5xl mx-auto px-4 py-16 z-10 border-t border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-primary mb-1">
              Architecture Guarantee
            </div>
            <h2 className="text-2xl sm:text-3xl font-display text-foreground">
              Three-tier audit execution architecture
            </h2>
            <p className="text-xs font-mono text-foreground/60 mt-1 max-w-xl">
              Strict capability demarcation: every check explicitly records whether it executed or was not run.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono text-xs">
          <Card chamfer className="space-y-3">
            <div className="text-foreground/40 text-[10px] uppercase tracking-wider">Tier 01 // Lightweight</div>
            <h3 className="font-semibold text-foreground text-sm font-mono tracking-tight text-primary">
              LIGHTWEIGHT HTTP AUDIT
            </h3>
            <p className="text-foreground/60 text-xs leading-relaxed font-sans">
              TLS certificate validation, strict security headers, and Cheerio internal route crawler (up to 15 bounded links).
            </p>
            <div className="pt-2 text-[10px] text-primary flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-primary" />
              Cloud-Native Stateless
            </div>
          </Card>

          <Card chamfer className="space-y-3">
            <div className="text-foreground/40 text-[10px] uppercase tracking-wider">Tier 02 // Telemetry</div>
            <h3 className="font-semibold text-foreground text-sm font-mono tracking-tight text-primary">
              SYNTHETIC PERFORMANCE
            </h3>
            <p className="text-foreground/60 text-xs leading-relaxed font-sans">
              Core Web Vitals (LCP, CLS, INP) and Lighthouse measurements offloaded to Google PageSpeed Insights REST API.
            </p>
            <div className="pt-2 text-[10px] text-primary flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-primary" />
              PageSpeed REST Integration
            </div>
          </Card>

          <Card chamfer className="space-y-3">
            <div className="text-foreground/40 text-[10px] uppercase tracking-wider">Tier 03 // Exploration</div>
            <h3 className="font-semibold text-foreground text-sm font-mono tracking-tight text-primary">
              BROWSER INTERACTION
            </h3>
            <p className="text-foreground/60 text-xs leading-relaxed font-sans">
              Real headless browser execution for client JavaScript rendering, unhandled console exceptions, and screenshot capture.
            </p>
            <div className="pt-2 text-[10px] text-amber-400 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-amber-400" />
              Dedicated Browser Worker
            </div>
          </Card>
        </div>
      </section>

      {/* Interactive Telemetry Preview: RQI Gauge & Gates */}
      <section className="w-full max-w-5xl mx-auto px-4 py-16 z-10 border-t border-border space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-primary mb-1">
              Ungameable Governance
            </div>
            <h2 className="text-2xl sm:text-3xl font-display text-foreground">
              Tripartite Release Quality Index (RQI)
            </h2>
            <p className="text-xs font-mono text-foreground/60 mt-1">
              Governed by two independent Hard Gates: any critical security or confirmed defect failure blocks release.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:text-primary/80 uppercase tracking-wider"
          >
            Launch QA Workspace <ExternalLink className="size-3" />
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

      {/* Dual Reporting Engine Comparison */}
      <section className="w-full max-w-5xl mx-auto px-4 py-16 z-10 border-t border-border">
        <div className="text-left mb-8">
          <div className="text-[11px] font-mono uppercase tracking-wider text-primary mb-1">
            Zero False Positives
          </div>
          <h2 className="text-2xl sm:text-3xl font-display text-foreground">
            Dual reporting separation
          </h2>
          <p className="text-xs font-mono text-foreground/60 mt-1">
            Never conflate raw machine findings with human-confirmed bugs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="p-6 bg-[#0d0d0d] border border-border space-y-3">
            <div className="text-[10px] font-mono uppercase text-foreground/40">Report Stream 01</div>
            <h3 className="text-base font-mono font-bold text-foreground uppercase tracking-wide">
              Technical Audit Report
            </h3>
            <p className="text-foreground/60 text-xs leading-relaxed font-sans">
              Exhaustive machine telemetry for QA and SecOps. Records executed checks, check latencies, HTTP headers, TLS expiration, Core Web Vitals, and potential findings pending triage.
            </p>
            <div className="pt-2 text-[11px] font-mono text-foreground/50 uppercase tracking-wider">
              Audience: Test Engineers &amp; Security Compliance
            </div>
          </div>

          <div className="p-6 bg-[#0d0d0d] border border-primary/40 space-y-3 [box-shadow:inset_0_0_20px_rgba(235,184,0,0.06)]">
            <div className="text-[10px] font-mono uppercase text-primary">Report Stream 02</div>
            <h3 className="text-base font-mono font-bold text-primary uppercase tracking-wide">
              Human-Reviewed Defect Report
            </h3>
            <p className="text-foreground/80 text-xs leading-relaxed font-sans">
              Zero noise. Contains ONLY verified defects with assigned severity, reproduction steps, developer handoff links, and retest verification history.
            </p>
            <div className="pt-2 text-[11px] font-mono text-primary uppercase tracking-wider">
              Audience: Feature Developers &amp; Release Managers
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/dashboard">
            <Button variant="chamfer" size="lg" className="h-14 px-8 text-sm">
              [ENTER WORKSPACE DASHBOARD]
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}