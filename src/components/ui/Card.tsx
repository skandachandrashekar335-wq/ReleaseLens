import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  chamfer?: boolean;
}

export function Card({ className, chamfer = false, children, ...props }: CardProps) {
  if (chamfer) {
    return (
      <div
        style={{ "--poly-roundness": "10px" } as React.CSSProperties}
        className={cn(
          "relative bg-[#0d0d0d] border border-border p-6 transition-all duration-200 hover:border-primary/40 chamfer-card",
          className
        )}
        {...props}
      >
        <span
          style={{ "--h": "18px", "--hh": "3px" } as React.CSSProperties}
          className="absolute inline-block w-[var(--h)] top-[var(--hh)] left-[var(--hh)] h-[1.5px] -rotate-45 origin-top -translate-x-1/2 bg-border pointer-events-none"
        />
        <span
          style={{ "--h": "18px", "--hh": "3px" } as React.CSSProperties}
          className="absolute w-[var(--h)] bottom-[var(--hh)] right-[var(--hh)] h-[1.5px] bg-border -rotate-45 translate-x-1/2 pointer-events-none"
        />
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl bg-[#0d0d0d] border border-border p-6 shadow-sm transition-all duration-200 hover:border-[#383838]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-1.5 pb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-lg font-semibold tracking-tight text-foreground", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)} {...props}>
      {children}
    </p>
  );
}
