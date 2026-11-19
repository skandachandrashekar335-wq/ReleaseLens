"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Project, EnvironmentType } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  Plus,
  ExternalLink,
  ArrowRight,
  Search,
} from "lucide-react";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Project Form state
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectUrl, setNewProjectUrl] = useState("");
  const [newProjectEnv, setNewProjectEnv] = useState<EnvironmentType>("PREVIEW");
  const [isCreating, setIsCreating] = useState(false);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : (data.projects || []));
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !newProjectUrl.trim()) return;

    try {
      setIsCreating(true);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName,
          targetUrl: newProjectUrl.startsWith("http") ? newProjectUrl : `https://${newProjectUrl}`,
          environment: newProjectEnv,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setNewProjectName("");
        setNewProjectUrl("");
        await fetchProjects();
      }
    } catch (err) {
      console.error("Create project error:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.targetUrl.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-10 bg-transparent text-foreground">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-border/80 pb-8">
        <div>
          <Badge variant="chamfer" glowDot className="mb-3">
            WORKSPACE OVERVIEW
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-display text-foreground mt-1">
            Registered Applications
          </h1>
          <p className="text-xs font-mono text-foreground/60 mt-1">
            Monitor target web applications, ephemeral preview deployments, and track release deltas.
          </p>
        </div>

        <Button
          variant="chamfer"
          size="md"
          onClick={() => setIsModalOpen(true)}
          className="h-11 px-5 text-xs"
        >
          <Plus className="size-3.5 mr-2" /> [REGISTER TARGET APP]
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-5 bg-[#0a0c10]/80 backdrop-blur-[2px] border border-border/80">
          <span className="text-[10px] text-foreground/50 uppercase tracking-wider">Registered Apps</span>
          <div className="text-3xl font-bold font-mono text-foreground mt-2">{projects.length}</div>
          <span className="text-[10px] text-primary mt-1 inline-block">All environments tracked</span>
        </div>

        <div className="p-5 bg-[#0a0c10]/80 backdrop-blur-[2px] border border-border/80">
          <span className="text-[10px] text-foreground/50 uppercase tracking-wider">Cloud Inspection</span>
          <div className="text-3xl font-bold font-mono text-foreground mt-2">Autonomous</div>
          <span className="text-[10px] text-foreground/50 mt-1 inline-block">TLS, CSP, Crawl &amp; CWV</span>
        </div>

        <div className="p-5 bg-[#0a0c10]/80 backdrop-blur-[2px] border border-border/80">
          <span className="text-[10px] text-foreground/50 uppercase tracking-wider">Triage Workflow</span>
          <div className="text-3xl font-bold font-mono text-foreground mt-2">2-Stage</div>
          <span className="text-[10px] text-primary mt-1 inline-block">Machine Audit &bull; Human Sign-off</span>
        </div>

        <div className="p-5 bg-[#0a0c10]/80 backdrop-blur-[2px] border border-border/80">
          <span className="text-[10px] text-foreground/50 uppercase tracking-wider">Monthly Overhead</span>
          <div className="text-3xl font-bold font-mono text-primary mt-2">₹0.00</div>
          <span className="text-[10px] text-primary/80 mt-1 inline-block">100% Free Cloud Tier Quota</span>
        </div>
      </div>

      {/* Projects Search and Table */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <div className="relative w-full sm:w-88">
            <Search className="absolute left-3.5 top-3 size-3.5 text-foreground/40" />
            <input
              type="text"
              placeholder="Search applications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#0a0c10]/80 backdrop-blur-[2px] border border-border/80 text-foreground font-mono placeholder:text-foreground/30 focus:outline-none focus:border-primary/60"
            />
          </div>

          <span className="text-xs text-foreground/50 self-start sm:self-auto uppercase tracking-wider">
            Displaying {filteredProjects.length} application{filteredProjects.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Project Cards Grid */}
        {isLoading ? (
          <div className="p-16 text-center text-xs font-mono text-foreground/40 border border-border/80 bg-[#0a0c10]/80 backdrop-blur-[2px]">
            Loading registered applications from persistence adapter...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-16 text-center text-xs font-mono text-foreground/50 bg-[#0a0c10]/80 backdrop-blur-[2px] border border-border/80">
            No registered applications found. Click &ldquo;[REGISTER TARGET APP]&rdquo; to begin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="p-6 border border-border/80 bg-[#0a0c10]/80 backdrop-blur-[2px] hover:border-primary/50 transition-all flex flex-col justify-between gap-5 group"
              >
                <div className="space-y-3 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-primary/10 text-primary border border-primary/20">
                      {project.environment}
                    </span>
                    <span className="text-[10px] text-foreground/40">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors tracking-tight font-sans">
                      {project.name}
                    </h3>
                    <a
                      href={project.targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-mono text-foreground/50 hover:text-foreground flex items-center gap-1.5 mt-1 truncate"
                    >
                      <span className="truncate">{project.targetUrl}</span>
                      <ExternalLink className="size-3 shrink-0 opacity-50" />
                    </a>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between font-mono">
                  <span className="text-[11px] text-foreground/50 flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-primary" />
                    Audits Active
                  </span>

                  <Link
                    href={`/projects/${project.id}`}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors uppercase tracking-wider font-semibold"
                  >
                    View Project <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Project Registration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Target Application"
        description="Add a web application or ephemeral preview deployment for automated audits and exploratory QA."
        size="md"
      >
        <form onSubmit={handleCreateProject} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-foreground/60 mb-1.5">
              Application Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Storefront Vercel Preview"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-[#0d0d0d] border border-border text-foreground font-mono focus:outline-none focus:border-primary/60"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-foreground/60 mb-1.5">
              Target URL *
            </label>
            <input
              type="text"
              required
              placeholder="https://storefront-pr-42.vercel.app"
              value={newProjectUrl}
              onChange={(e) => setNewProjectUrl(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-[#0d0d0d] border border-border text-foreground font-mono focus:outline-none focus:border-primary/60"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-foreground/60 mb-1.5">
              Deployment Environment
            </label>
            <select
              value={newProjectEnv}
              onChange={(e) => setNewProjectEnv(e.target.value as EnvironmentType)}
              className="w-full px-3 py-2.5 text-xs bg-[#0d0d0d] border border-border text-foreground font-mono focus:outline-none focus:border-primary/60"
            >
              <option value="PREVIEW">PREVIEW (Vercel / Netlify PR Deployment)</option>
              <option value="STAGING">STAGING (Pre-production Integration)</option>
              <option value="PRODUCTION">PRODUCTION (Live Public Target)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" variant="chamfer" size="sm" isLoading={isCreating} className="h-9 px-4">
              <Plus className="size-3.5 mr-1" />
              [REGISTER APPLICATION]
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}