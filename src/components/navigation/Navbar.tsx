"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutFirebase } from "@/lib/firebase/client";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/logo";

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => {
        if (!res.ok) return null;
        return res.json().catch(() => null);
      })
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const navLinks = [
    { href: "/dashboard", label: "Projects" },
    { href: "/projects/proj_hackathon_demo", label: "Audit" },
    { href: "/projects/proj_hackathon_demo/findings", label: "Findings" },
    { href: "/projects/proj_hackathon_demo/bugs", label: "Defects" },
    { href: "/projects/proj_hackathon_demo/deltas", label: "Deltas" },
  ];

  const handleSignOut = async () => {
    try {
      await signOutFirebase();
    } catch {}
    await fetch("/api/auth/session", { method: "DELETE" });
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-black/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand / Logo from v0 Template */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center group transition-opacity hover:opacity-90">
            <Logo className="w-[170px] md:w-[210px] h-auto" />
          </Link>
        </div>

        {/* Centered Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8 font-mono text-xs uppercase tracking-wider">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "transition-colors duration-150 py-1",
                  isActive
                    ? "text-primary border-b border-primary font-semibold"
                    : "text-foreground/60 hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3 sm:gap-4 font-mono">
          <div className="hidden md:flex items-center gap-2 px-3 h-7 bg-[#262626]/40 border border-border text-[11px] text-foreground/70 chamfer-badge" style={{ "--poly-roundness": "4px" } as React.CSSProperties}>
            <span className="inline-block size-1.5 rounded-full bg-primary shadow-glow shadow-primary/60" />
            <span className="uppercase tracking-wider">ENGINE READY</span>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#121212] border border-border text-xs text-foreground/80">
                <User className="size-3 text-primary" />
                <span className="hidden sm:inline truncate max-w-[100px]">{user.name}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 text-foreground/50 hover:text-red-400 hover:bg-[#121212] transition-colors border border-transparent hover:border-red-500/30"
                title="Sign out"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs uppercase tracking-wider text-primary hover:text-primary/80 transition-colors font-medium px-2 py-1"
            >
              Sign In
            </Link>
          )}

          <Link href="/dashboard" className="hidden sm:inline-flex">
            <Button variant="chamfer" size="sm" className="h-9 px-4 text-xs font-semibold">
              [WORKSPACE]
            </Button>
          </Link>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-foreground/80 hover:text-foreground hover:bg-[#171717] transition-colors border border-border"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border bg-black/95 px-6 py-5 flex flex-col gap-4 font-mono text-xs uppercase tracking-wider">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-foreground/70 hover:text-primary transition-colors border-b border-[#1f1f1f]"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 flex items-center justify-between">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full"
            >
              <Button variant="chamfer" size="sm" className="w-full h-10 text-xs">
                [OPEN WORKSPACE]
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}