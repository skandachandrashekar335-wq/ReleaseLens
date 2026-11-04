"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Sparkles, AlertCircle, ArrowRight, Lock, Key } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { signInWithGoogle, isFirebaseClientConfigured } from "@/lib/firebase/client";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    // Check if client SDK credentials are configured
    setIsConfigured(isFirebaseClientConfigured());

    // Check if session already exists
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.isAuthenticated) {
          router.push("/dashboard");
        }
      })
      .catch(() => {});
  }, [router]);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (!isFirebaseClientConfigured()) {
        throw new Error(
          "Firebase Authentication is not configured. Missing NEXT_PUBLIC_FIREBASE_* environment variables."
        );
      }

      const { idToken } = await signInWithGoogle();

      // Exchange ID token for secure HTTP-only application session cookie
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to establish authenticated session");
      }

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Sign-in failed:", err);
      setErrorMessage(err.message || "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 p-8 rounded-2xl bg-surface border border-border shadow-xl">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-xl bg-surface-raised border border-border items-center justify-center text-foreground shadow-sm">
            <Shield className="h-6 w-6 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sign In to ReleaseLens</h1>
          <p className="text-xs text-muted-foreground">
            Evidence-backed quality intelligence &amp; autonomous testing
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium">Authentication Error</p>
              <p className="opacity-90">{errorMessage}</p>
            </div>
          </div>
        )}

        {!isConfigured && (
          <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Key className="h-4 w-4 shrink-0" />
              <span>Firebase Configuration Required</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Google Sign-In uses Firebase Authentication. To enable live sign-in, provide your Firebase configuration in{" "}
              <code className="text-foreground bg-surface-raised px-1 py-0.5 rounded">.env.local</code>.
            </p>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <Button
            onClick={handleGoogleSignIn}
            isLoading={isLoading}
            className="w-full justify-center gap-3 py-2.5 text-sm font-medium"
            variant="secondary"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign in with Google
          </Button>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 font-mono"
            >
              <span>Return to landing page</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="pt-4 border-t border-border/60 text-center">
          <p className="text-[11px] text-muted-foreground font-mono flex items-center justify-center gap-1.5">
            <Lock className="h-3 w-3 text-emerald-400" />
            Zero-trust identity verification via Firebase Admin SDK
          </p>
        </div>
      </div>
    </div>
  );
}
