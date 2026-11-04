import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    // If Supabase OAuth is configured, redirect to Supabase Google Auth
    if (!code && supabaseUrl && !supabaseUrl.includes("placeholder")) {
      const redirectUri = `${url.origin}/api/auth/google`;
      const authEndpoint = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUri)}`;
      return NextResponse.redirect(authEndpoint);
    }

    // In local / demo mode without Supabase OAuth credentials, provide one-click Google Sign-In verification
    const email = url.searchParams.get("email") || "qa.engineer@company.com";
    const name = url.searchParams.get("name") || "Google QA Tester";

    let user = await db.getUserByEmail(email);
    if (!user) {
      user = await db.createUser({
        id: `usr_g_${Date.now()}`,
        email,
        name,
        avatarUrl: "https://lh3.googleusercontent.com/a/default-user",
        role: "qa_engineer",
      });
    }

    const session = await db.createSession(user.id);
    const response = NextResponse.redirect(new URL("/dashboard", url.origin));
    response.cookies.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400 * 14,
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
