"use client";

import React, { useState } from "react";
import { AutomatedCheck } from "@/lib/types";
import { getCheckStatusStyle } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, ChevronDown, ChevronRight, Clock, Search } from "lucide-react";

interface CheckListProps {
  checks: AutomatedCheck[];
}

export function CheckList({ checks }: CheckListProps) {
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredChecks = checks.filter((c) => {
    const matchesFilter = filter === "ALL" || c.status === filter;
    const nameStr = c.name || c.checkName || "";
    const dimStr = c.dimension || c.category || "";
    const sumStr = c.summary || c.errorMessage || "";
    const matchesSearch =
      nameStr.toLowerCase().includes(search.toLowerCase()) ||
      dimStr.toLowerCase().includes(search.toLowerCase()) ||
      sumStr.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PASSED":
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      default:
        return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search checks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-raised border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "PASSED", "FAILED", "WARNING", "INCONCLUSIVE"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition-colors border ${
                filter === status
                  ? "bg-foreground text-background border-foreground font-semibold"
                  : "bg-surface text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Checks Table / List */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden divide-y divide-border/60">
        {filteredChecks.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground font-mono">
            No automated checks match your filter criteria.
          </div>
        ) : (
          filteredChecks.map((check) => {
            const isExpanded = expandedId === check.id;
            const statusStyle = getCheckStatusStyle(check.status);

            return (
              <div key={check.id} className="transition-colors hover:bg-surface-raised/40">
                <div
                  onClick={() => setExpandedId(isExpanded ? null : check.id)}
                  className="p-4 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-muted-foreground hover:text-foreground">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {getStatusIcon(check.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{check.name || check.checkName}</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-raised border border-border text-muted-foreground">
                          {check.dimension || check.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{check.summary || check.errorMessage || "Check completed"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {check.durationMs || 0}ms
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                    >
                      {check.status}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-6 py-4 bg-background/50 border-t border-border/40 text-xs font-mono space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-muted-foreground">
                      <div>
                        <span className="text-[10px] uppercase text-muted-foreground block">Check ID:</span>
                        <span className="text-foreground">{check.id}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-muted-foreground block">Executed At:</span>
                        <span className="text-foreground">{check.executedAt || check.timestamp || "Recent"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-muted-foreground block">Dimension:</span>
                        <span className="text-foreground uppercase">{check.dimension || check.category}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground block mb-1">
                        Captured Technical Evidence:
                      </span>
                      <pre className="p-3 rounded-lg bg-surface border border-border text-foreground/90 text-[11px] overflow-x-auto max-h-56">
                        {JSON.stringify(check.rawEvidence || check.evidence || {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
