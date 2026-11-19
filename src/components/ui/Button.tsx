import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "chamfer" | "chamfer-outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, style, ...props }, ref) => {
    const isChamfer = variant === "chamfer" || variant === "chamfer-outline";

    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer";

    const variants = {
      primary: "bg-primary text-black font-semibold hover:bg-primary/90 shadow-sm focus:ring-primary",
      secondary: "bg-surface-raised text-foreground hover:bg-surface border border-border focus:ring-border",
      outline: "bg-transparent text-foreground hover:bg-surface border border-border focus:ring-border",
      danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 focus:ring-red-500",
      ghost: "bg-transparent text-muted-foreground hover:text-foreground hover:bg-surface focus:ring-border",
      chamfer:
        "relative uppercase font-mono tracking-wider bg-background border border-primary text-primary-foreground font-semibold rounded-none chamfer-button [box-shadow:inset_0_0_54px_0px_#EBB800] shadow-[#EBB800] hover:shadow-[#EBB800]/80 transition-all",
      "chamfer-outline":
        "relative uppercase font-mono tracking-wider bg-surface-raised/50 border border-border text-foreground hover:text-primary hover:border-primary/50 rounded-none chamfer-button transition-all",
    };

    const sizes = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2 gap-2",
      lg: "text-base px-6 py-3.5 gap-2.5",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], isChamfer && "overflow-visible", className)}
        disabled={disabled || isLoading}
        style={{
          ...(isChamfer ? { "--poly-roundness": size === "sm" ? "10px" : "16px" } : {}),
          ...style,
        } as React.CSSProperties}
        {...props}
      >
        {isChamfer && (
          <>
            <span
              data-border="top-left"
              style={{ "--h": size === "sm" ? "20px" : "32px", "--hh": size === "sm" ? "3px" : "6.5px" } as React.CSSProperties}
              className={cn(
                "absolute inline-block w-[var(--h)] top-[var(--hh)] left-[var(--hh)] h-[2px] -rotate-45 origin-top -translate-x-1/2",
                variant === "chamfer" ? "bg-primary" : "bg-border"
              )}
            />
            <span
              data-border="bottom-right"
              style={{ "--h": size === "sm" ? "20px" : "32px", "--hh": size === "sm" ? "3px" : "6.5px" } as React.CSSProperties}
              className={cn(
                "absolute w-[var(--h)] bottom-[var(--hh)] right-[var(--hh)] h-[2px] -rotate-45 translate-x-1/2",
                variant === "chamfer" ? "bg-primary" : "bg-border"
              )}
            />
          </>
        )}
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
