import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl bg-surface border border-border shadow-xl">
        <div className="inline-flex h-12 w-12 rounded-xl bg-surface-raised border border-border items-center justify-center text-foreground">
          <Shield className="h-6 w-6 text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">404</h1>
          <p className="text-sm text-muted-foreground">The requested page or audit resource was not found.</p>
        </div>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-all shadow-sm"
          >
            <span>Return to Workspace</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
