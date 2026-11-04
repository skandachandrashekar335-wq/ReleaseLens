import { NextResponse } from "next/server";
import { db } from "@/lib/store/db-adapter";
import { getAuthSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function GET() {
  try {
    const auth = await getAuthSession();
    return NextResponse.json({
      user: auth.user,
      isAuthenticated: auth.isAuthenticated,
      sessionToken: auth.sessionToken,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, avatarUrl } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    let user = await db.getUserByEmail(email);
    if (!user) {
      const id = `usr_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
      user = await db.createUser({
        id,
        email,
        name: name || email.split("@")[0],
        avatarUrl,
        role: "tester",
      });
    }

    const session = await db.createSession(user.id);

    const response = NextResponse.json({
      user,
      sessionToken: session.token,
    }, { status: 200 });

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

export async function DELETE() {
  try {
    const auth = await getAuthSession();
    if (auth.sessionToken) {
      await db.deleteSession(auth.sessionToken);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
