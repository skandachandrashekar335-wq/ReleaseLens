"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Project, EnvironmentType } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  Layers,
  Plus,
  ExternalLink,
  Shield,
  Activity,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
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
        setProjects(data);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase">
            <Layers className="h-3.5 w-3.5 text-emerald-400" />
            <span>Workspace Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">Registered Applications</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor target web applications, preview deployments, and track release deltas.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Register Target Application
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-4 rounded-xl bg-surface border border-border">
          <span className="text-[10px] text-muted-foreground uppercase">Registered Apps</span>
          <div className="text-2xl font-bold text-foreground mt-1">{projects.length}</div>
          <span className="text-[10px] text-emerald-400">All environments tracked</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border">
          <span className="text-[10px] text-muted-foreground uppercase">Cloud Inspection</span>
          <div className="text-2xl font-bold text-foreground mt-1">Autonomous</div>
          <span className="text-[10px] text-muted-foreground">TLS, CSP, Crawl &amp; CWV</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border">
          <span className="text-[10px] text-muted-foreground uppercase">Triage Workflow</span>
          <div className="text-2xl font-bold text-foreground mt-1">2-Stage</div>
          <span className="text-[10px] text-cyan-400">Automate First &bull; Review Second</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border">
          <span className="text-[10px] text-muted-foreground uppercase">Monthly Cost</span>
          <div className="text-2xl font-bold text-foreground mt-1">₹0.00</div>
          <span className="text-[10px] text-emerald-400">100% Free-First Cloud Quota</span>
        </div>
      </div>

      {/* Projects Search and Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search applications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-raised border border-border rounded-lg text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
            />
          </div>

          <span className="text-xs font-mono text-muted-foreground self-start sm:self-auto">
            Showing {filteredProjects.length} application{filteredProjects.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Project Cards Grid */}
        {isLoading ? (
          <div className="p-12 text-center text-xs font-mono text-muted-foreground">
            Loading applications from persistence adapter...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-muted-foreground bg-surface rounded-xl border border-border">
            No registered applications found. Click &ldquo;Register Target Application&rdquo; to begin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="p-5 rounded-xl border border-border bg-surface hover:border-border/90 transition-all flex flex-col justify-between gap-4 group shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-surface-raised border border-border text-foreground">
                      {project.environment}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Updated {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-emerald-400 transition-colors">
                      {project.name}
                    </h3>
                    <a
                      href={project.targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 mt-0.5 truncate"
                    >
                      <span>{project.targetUrl}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                    </a>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                    <Activity className="h-3 w-3 text-emerald-400" />
                    Audits Active
                  </span>

                  <Link
                    href={`/projects/${project.id}`}
                    className="inline-flex items-center gap-1 text-xs font-mono text-foreground hover:text-emerald-400 transition-colors"
                  >
                    View Project <ArrowRight className="h-3 w-3" />
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
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
              Application Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Storefront Vercel Preview"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface-raised border border-border rounded-lg text-foreground font-mono focus:outline-none focus:border-foreground/50"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
              Target URL *
            </label>
            <input
              type="text"
              required
              placeholder="https://storefront-pr-42.vercel.app"
              value={newProjectUrl}
              onChange={(e) => setNewProjectUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface-raised border border-border rounded-lg text-foreground font-mono focus:outline-none focus:border-foreground/50"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
              Deployment Environment
            </label>
            <select
              value={newProjectEnv}
              onChange={(e) => setNewProjectEnv(e.target.value as EnvironmentType)}
              className="w-full px-3 py-2 text-xs bg-surface-raised border border-border rounded-lg text-foreground font-mono focus:outline-none focus:border-foreground/50"
            >
              <option value="PREVIEW">PREVIEW (Vercel / Netlify PR Deployment)</option>
              <option value="STAGING">STAGING (Pre-production Integration)</option>
              <option value="PRODUCTION">PRODUCTION (Live Public Target)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isCreating}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Register Application
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
