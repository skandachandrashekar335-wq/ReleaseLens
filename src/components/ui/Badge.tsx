import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "outline" | "chamfer" | "gold";
  glowDot?: boolean;
}

export function Badge({ className, variant = "default", glowDot = false, children, ...props }: BadgeProps) {
  if (variant === "chamfer") {
    return (
      <span
        style={{ "--poly-roundness": "6px" } as React.CSSProperties}
        className={cn(
          "relative bg-[#262626]/60 backdrop-blur-sm font-medium text-foreground/80 font-mono text-xs uppercase tracking-wider inline-flex items-center justify-center px-3.5 h-8 border border-border chamfer-badge select-none",
          className
        )}
        {...props}
      >
        <span
          style={{ "--h": "12px", "--hh": "1.5px" } as React.CSSProperties}
          className="absolute inline-block w-[var(--h)] top-[var(--hh)] left-[var(--hh)] h-[1.5px] -rotate-45 origin-top -translate-x-1/2 bg-border pointer-events-none"
        />
        <span
          style={{ "--h": "12px", "--hh": "1.5px" } as React.CSSProperties}
          className="absolute w-[var(--h)] top-[var(--hh)] right-[var(--hh)] h-[1.5px] bg-border rotate-45 translate-x-1/2 pointer-events-none"
        />
        <span
          style={{ "--h": "12px", "--hh": "1.5px" } as React.CSSProperties}
          className="absolute w-[var(--h)] bottom-[var(--hh)] left-[var(--hh)] h-[1.5px] bg-border rotate-45 -translate-x-1/2 pointer-events-none"
        />
        <span
          style={{ "--h": "12px", "--hh": "1.5px" } as React.CSSProperties}
          className="absolute w-[var(--h)] bottom-[var(--hh)] right-[var(--hh)] h-[1.5px] bg-border -rotate-45 translate-x-1/2 pointer-events-none"
        />
        {glowDot && (
          <span className="inline-block size-2 rounded-full bg-primary mr-2 shadow-glow shadow-primary/50" />
        )}
        {children}
      </span>
    );
  }

  const baseStyles = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-mono font-medium border";

  const variants = {
    default: "bg-surface-raised text-muted-foreground border-border",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    danger: "bg-red-500/10 text-red-400 border-red-500/30",
    outline: "bg-transparent text-muted-foreground border-border",
    gold: "bg-primary/10 text-primary border-primary/30",
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props}>
      {glowDot && (
        <span className="inline-block size-1.5 rounded-full bg-primary shadow-glow shadow-primary/50" />
      )}
      {children}
    </span>
  );
}
