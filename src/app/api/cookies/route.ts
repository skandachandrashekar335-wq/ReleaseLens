import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TARGET_HOSTS = [
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "googleapis.com",
];

function isAllowedTarget(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    return (
      url.protocol === "https:" &&
      ALLOWED_TARGET_HOSTS.some(
        (allowed) => url.hostname === allowed || url.hostname.endsWith(`.${allowed}`)
      )
    );
  } catch {
    return false;
  }
}

async function handleProxy(req: NextRequest) {
  try {
    const finalTarget = req.nextUrl.searchParams.get("finalTarget");

    if (!finalTarget) {
      return NextResponse.json({ success: true, message: "Cookie handler active" }, { status: 200 });
    }

    if (!isAllowedTarget(finalTarget)) {
      return NextResponse.json(
        { error: "Target host not permitted by security policy" },
        { status: 403 }
      );
    }

    const headers = new Headers();
    req.headers.forEach((val, key) => {
      // Do not forward host or connection headers
      const lower = key.toLowerCase();
      if (!["host", "connection", "content-length"].includes(lower)) {
        headers.set(key, val);
      }
    });

    const body =
      ["GET", "HEAD"].includes(req.method) ? undefined : await req.text();

    const upstreamRes = await fetch(finalTarget, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
    });

    const responseHeaders = new Headers();
    upstreamRes.headers.forEach((val, key) => {
      const lower = key.toLowerCase();
      if (!["content-encoding", "transfer-encoding"].includes(lower)) {
        responseHeaders.set(key, val);
      }
    });

    const data = await upstreamRes.text();
    return new NextResponse(data, {
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to proxy cookie request" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleProxy(req);
}

export async function POST(req: NextRequest) {
  return handleProxy(req);
}

export async function PUT(req: NextRequest) {
  return handleProxy(req);
}

export async function DELETE(req: NextRequest) {
  return NextResponse.json({ success: true }, { status: 200 });
}
