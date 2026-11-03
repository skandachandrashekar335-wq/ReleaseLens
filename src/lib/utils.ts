import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BugSeverity, BugStatus, CheckStatus, FindingStatus, ReleaseVerdict } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return "N/A";
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString: string | undefined): string {
  if (!dateString) return "N/A";
  try {
    const diff = (Date.now() - new Date(dateString).getTime()) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return dateString;
  }
}

export function getSeverityStyle(severity: BugSeverity): {
  bg: string;
  text: string;
  border: string;
} {
  switch (severity) {
    case "CRITICAL":
      return {
        bg: "bg-red-500/10",
        text: "text-red-400",
        border: "border-red-500/20",
      };
    case "HIGH":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/20",
      };
    case "MEDIUM":
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        border: "border-blue-500/20",
      };
    case "LOW":
      return {
        bg: "bg-zinc-500/10",
        text: "text-zinc-400",
        border: "border-zinc-500/20",
      };
    case "INFO":
    default:
      return {
        bg: "bg-cyan-500/10",
        text: "text-cyan-400",
        border: "border-cyan-500/20",
      };
  }
}

export function getStatusStyle(status: BugStatus | FindingStatus): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case "OPEN":
    case "DETECTED":
      return {
        bg: "bg-red-500/10",
        text: "text-red-400",
        border: "border-red-500/20",
      };
    case "NEEDS_REVIEW":
    case "ACKNOWLEDGED":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/20",
      };
    case "IN_PROGRESS":
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        border: "border-blue-500/20",
      };
    case "FIXED":
    case "CONFIRMED":
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/20",
      };
    case "RETEST_REQUIRED":
      return {
        bg: "bg-purple-500/10",
        text: "text-purple-400",
        border: "border-purple-500/20",
      };
    case "VERIFIED":
      return {
        bg: "bg-emerald-500/20",
        text: "text-emerald-300",
        border: "border-emerald-500/40",
      };
    case "REOPENED":
      return {
        bg: "bg-rose-500/20",
        text: "text-rose-400",
        border: "border-rose-500/30",
      };
    case "CLOSED":
    case "REJECTED":
    case "DUPLICATE":
    case "ACCEPTED_RISK":
    default:
      return {
        bg: "bg-zinc-500/10",
        text: "text-zinc-400",
        border: "border-zinc-500/20",
      };
  }
}

export function getCheckStatusStyle(status: CheckStatus): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case "PASS":
    case "PASSED":
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/20",
      };
    case "FAIL":
    case "FAILED":
      return {
        bg: "bg-red-500/10",
        text: "text-red-400",
        border: "border-red-500/20",
      };
    case "WARNING":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/20",
      };
    case "INCONCLUSIVE":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/20",
      };
    case "NOT_RUN":
    default:
      return {
        bg: "bg-zinc-500/10",
        text: "text-zinc-500",
        border: "border-zinc-500/20",
      };
  }
}

export function getVerdictStyle(verdict: ReleaseVerdict): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  switch (verdict) {
    case "VERIFIED_READY":
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/30",
        label: "Verified Ready",
      };
    case "PROVISIONAL_PASS":
      return {
        bg: "bg-sky-500/10",
        text: "text-sky-400",
        border: "border-sky-500/30",
        label: "Provisional Pass",
      };
    case "REVIEW_REQUIRED":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/30",
        label: "Review Required",
      };
    case "RELEASE_BLOCKED":
      return {
        bg: "bg-red-500/10",
        text: "text-red-400",
        border: "border-red-500/30",
        label: "Release Blocked",
      };
    default:
      return {
        bg: "bg-zinc-500/10",
        text: "text-zinc-400",
        border: "border-zinc-500/30",
        label: "Unknown",
      };
  }
}
