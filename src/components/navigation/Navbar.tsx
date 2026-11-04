"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Sparkles,
  Activity,
  Layers,
  Bug,
  CheckSquare,
  User,
  LogOut,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Layers },
    { href: "/projects/proj_hackathon_demo", label: "Demo Audit", icon: Activity },
    { href: "/projects/proj_hackathon_demo/findings", label: "Findings Inbox", icon: CheckSquare },
    { href: "/projects/proj_hackathon_demo/bugs", label: "Bugs & Retest", icon: Bug },
  ];

  const handleSignOut = async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    setUser(null);
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-surface-raised border border-border flex items-center justify-center text-foreground group-hover:border-foreground/40 transition-colors shadow-sm">
              <Shield className="h-4 w-4 text-emerald-400 group-hover:scale-105 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-foreground flex items-center gap-1.5">
                ReleaseLens
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  v0.1
                </span>
              </span>
              <span className="text-[10px] text-muted-foreground tracking-wide font-mono">
                QUALITY &amp; RELEASE INTELLIGENCE
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    isActive
                      ? "text-foreground bg-surface-raised border border-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-raised border border-border text-[11px] font-mono text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Engine Online
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border text-xs font-mono">
                <User className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden md:inline truncate max-w-[120px] text-foreground">{user.name}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-full text-muted-foreground hover:text-red-400 hover:bg-surface transition-colors"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <a
              href="/api/auth/google"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full bg-surface-raised border border-border text-foreground hover:bg-surface transition-all shadow-sm font-mono"
            >
              <LogIn className="h-3.5 w-3.5 text-emerald-400" />
              Google Sign-In
            </a>
          )}

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-all shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Workspace
          </Link>
        </div>
      </div>
    </header>
  );
}
