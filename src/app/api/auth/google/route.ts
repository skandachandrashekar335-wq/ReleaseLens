import { NextResponse } from "next/server";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { isFirebaseClientConfigured } from "@/lib/firebase/client";
import { getAuthSession } from "@/lib/auth/session";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Status query endpoint for external identity provider readiness
    if (action === "oauth_status") {
      const isConfigured = isFirebaseAdminConfigured() && isFirebaseClientConfigured();
      return NextResponse.json({
        provider: "firebase_google",
        status: isConfigured ? "CONFIGURED" : "BLOCKED",
        reason: isConfigured
          ? "Firebase Authentication and Admin SDK credentials verified."
          : "Firebase Authentication requires NEXT_PUBLIC_FIREBASE_* client credentials and FIREBASE_* Admin service account credentials.",
      });
    }

    // Check if user is already authenticated
    const auth = await getAuthSession();
    if (auth.isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", url.origin));
    }

    // Redirect to login page for client-side Firebase Google Sign-In
    return NextResponse.redirect(new URL("/login", url.origin));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
