import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";
import { getAuthSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";

async function handleLogout() {
  try {
    const auth = await getAuthSession();
    if (auth.sessionToken) {
      await db.deleteSession(auth.sessionToken);
    }

    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );

    // Delete session cookie across all environments
    response.cookies.delete(SESSION_COOKIE_NAME);
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to log out" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return handleLogout();
}

export async function GET() {
  return handleLogout();
}

export async function DELETE() {
  return handleLogout();
}
