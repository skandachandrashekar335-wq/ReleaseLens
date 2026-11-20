import { describe, it, expect, afterEach, vi } from "vitest";
import { db } from "../src/lib/store/db-adapter";
import * as sessionModule from "../src/lib/auth/session";
import { POST as logoutPost } from "../src/app/api/auth/logout/route";

describe("Authentication & Session Lifecycle (Login/Logout)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("POST /api/auth/logout invalidates database session and clears auth cookies with maxAge 0", async () => {
    const deleteSpy = vi.spyOn(db, "deleteSession").mockResolvedValue(true);

    vi.spyOn(sessionModule, "getAuthSession").mockResolvedValue({
      user: {
        id: "usr_test_logout",
        email: "logout-test@releaselens.dev",
        name: "Logout QA User",
        role: "qa_engineer",
        createdAt: new Date().toISOString(),
      },
      sessionToken: "session_tok_to_delete",
      isAuthenticated: true,
    });

    const res = await logoutPost();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);

    // Verify deleteSession was called with the exact session token
    expect(deleteSpy).toHaveBeenCalledWith("session_tok_to_delete");

    // Verify cookie removal headers
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain("Max-Age=0");
  });
});
