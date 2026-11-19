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
        return <CheckCircle2 className="size-4 text-emerald-400" />;
      case "FAILED":
        return <XCircle className="size-4 text-red-400" />;
      case "WARNING":
        return <AlertTriangle className="size-4 text-primary" />;
      default:
        return <HelpCircle className="size-4 text-foreground/40" />;
    }
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 size-3.5 text-foreground/40" />
          <input
            type="text"
            placeholder="Search checks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-black border border-border text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/50 font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "PASSED", "FAILED", "WARNING", "INCONCLUSIVE"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors border cursor-pointer ${
                filter === status
                  ? "bg-primary text-black border-primary font-bold"
                  : "bg-black text-foreground/50 border-border hover:text-foreground"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Checks Table / List */}
      <div className="border border-border bg-[#0d0d0d] overflow-hidden divide-y divide-border">
        {filteredChecks.length === 0 ? (
          <div className="p-10 text-center text-xs text-foreground/40 font-mono">
            No automated checks match your filter criteria.
          </div>
        ) : (
          filteredChecks.map((check) => {
            const isExpanded = expandedId === check.id;
            const statusStyle = getCheckStatusStyle(check.status);

            return (
              <div key={check.id} className="transition-colors hover:bg-black/50">
                <div
                  onClick={() => setExpandedId(isExpanded ? null : check.id)}
                  className="p-4 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-foreground/40 hover:text-foreground">
                      {isExpanded ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </button>
                    {getStatusIcon(check.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground font-sans">
                          {check.name || check.checkName}
                        </span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 bg-black border border-border text-foreground/50">
                          {check.dimension || check.category}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/60 mt-0.5 font-sans">
                        {check.summary || check.errorMessage || "Check completed"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-foreground/40">
                      <Clock className="size-3" />
                      {check.durationMs || 0}ms
                    </div>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                    >
                      {check.status}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-6 py-5 bg-black border-t border-border text-xs font-mono space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-foreground/50">
                      <div>
                        <span className="text-[10px] uppercase text-foreground/40 block">Check ID:</span>
                        <span className="text-foreground">{check.id}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-foreground/40 block">Executed At:</span>
                        <span className="text-foreground">{check.executedAt || check.timestamp || "Recent"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-foreground/40 block">Dimension:</span>
                        <span className="text-foreground uppercase">{check.dimension || check.category}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-foreground/40 block mb-1">
                        Captured Technical Evidence:
                      </span>
                      <pre className="p-3 bg-[#0d0d0d] border border-border text-foreground/80 text-[11px] overflow-x-auto max-h-56">
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