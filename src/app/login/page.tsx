"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowRight, Lock, Key } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  signInWithGoogle,
  getGoogleRedirectResult,
  isFirebaseClientConfigured,
} from "@/lib/firebase/client";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    setIsConfigured(isFirebaseClientConfigured());

    // Check if user just completed redirect authentication
    getGoogleRedirectResult()
      .then(async (res) => {
        if (res?.idToken) {
          setIsLoading(true);
          const sessionRes = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: res.idToken }),
          });
          if (sessionRes.ok) {
            router.push("/dashboard");
            return;
          }
        }
      })
      .catch((err) => {
        console.error("Redirect auth error:", err);
      });

    fetch("/api/auth/session")
      .then((res) => {
        if (!res.ok) return { isAuthenticated: false };
        return res.json().catch(() => ({ isAuthenticated: false }));
      })
      .then((data) => {
        if (data?.isAuthenticated) {
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

      const authResult = await signInWithGoogle();
      if (!authResult) {
        // Returned null because redirect was initiated
        return;
      }

      const { idToken } = authResult;

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // Non-JSON response (e.g. server error page)
      }

      if (!res.ok) {
        throw new Error(
          data?.error || `Server returned error (${res.status}) while establishing session.`
        );
      }

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Sign-in failed:", err);
      let friendly = err.message || "Authentication failed. Please try again.";
      if (err.code === "auth/unauthorized-domain") {
        friendly =
          "This domain is not authorized in Firebase Console. Please add your current domain under Firebase Authentication > Settings > Authorized domains.";
      } else if (
        friendly.includes("<!DOCTYPE") ||
        friendly.includes("Unexpected token '<'") ||
        friendly.includes("is not valid JSON")
      ) {
        friendly =
          "Authentication service returned an unexpected HTML response. Please ensure popups and third-party cookies are enabled, and verify authorized domains in Firebase Console.";
      }
      setErrorMessage(friendly);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-transparent text-foreground">
      <div className="w-full max-w-md space-y-8 p-8 bg-[#0a0c10]/85 backdrop-blur-[2px] border border-border/80 shadow-2xl relative">
        <div className="text-center space-y-3">
          <Badge variant="chamfer" glowDot className="mb-2">
            ACCESS CONTROL
          </Badge>
          <h1 className="text-3xl font-display text-foreground">
            Sign In to <i className="font-light italic text-primary">ReleaseLens</i>
          </h1>
          <p className="text-xs font-mono text-foreground/60">
            Evidence-backed quality intelligence &amp; autonomous testing
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2.5 font-mono">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold uppercase tracking-wider text-[11px]">Authentication Error</p>
              <p className="opacity-90">{errorMessage}</p>
            </div>
          </div>
        )}

        {!isConfigured && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-2 font-mono">
            <div className="flex items-center gap-2 font-semibold uppercase tracking-wider text-[11px]">
              <Key className="size-3.5 shrink-0" />
              <span>Firebase Configuration Required</span>
            </div>
            <p className="text-[11px] text-foreground/60 leading-relaxed">
              Google Sign-In uses Firebase Authentication. To enable live sign-in, provide your Firebase configuration in{" "}
              <code className="text-primary bg-black px-1.5 py-0.5 border border-border">.env.local</code>.
            </p>
          </div>
        )}

        <div className="space-y-4 pt-2">
          <Button
            onClick={handleGoogleSignIn}
            isLoading={isLoading}
            variant="chamfer"
            className="w-full justify-center gap-3 h-12 text-xs"
          >
            <svg className="size-4" viewBox="0 0 24 24">
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
            [SIGN IN WITH GOOGLE]
          </Button>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs text-foreground/50 hover:text-primary transition-colors inline-flex items-center gap-1.5 font-mono uppercase tracking-wider"
            >
              <span>Return to landing page</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        <div className="pt-6 border-t border-border text-center">
          <p className="text-[11px] text-foreground/40 font-mono flex items-center justify-center gap-2">
            <Lock className="size-3 text-primary" />
            Zero-trust identity verification via Firebase Admin SDK
          </p>
        </div>
      </div>
    </div>
  );
}