import { describe, expect, it } from "vitest";
import { isAdmin, isSuperAdmin } from "./auth";
import type { Session } from "next-auth";

function fakeSession(overrides: Partial<Session["user"]> = {}): Session {
  return {
    user: { clientId: null, isSuperAdmin: false, ...overrides },
    expires: new Date(Date.now() + 60_000).toISOString(),
  };
}

describe("isAdmin", () => {
  it("is true for any authenticated session", () => {
    expect(isAdmin(fakeSession())).toBe(true);
  });

  it("is false when there is no session", () => {
    expect(isAdmin(null)).toBe(false);
  });
});

describe("isSuperAdmin", () => {
  it("is true only when the session is flagged as super-admin", () => {
    expect(isSuperAdmin(fakeSession({ isSuperAdmin: true }))).toBe(true);
  });

  it("is false for a regular tenant admin", () => {
    expect(isSuperAdmin(fakeSession({ clientId: "client-1", isSuperAdmin: false }))).toBe(false);
  });

  it("is false when there is no session", () => {
    expect(isSuperAdmin(null)).toBe(false);
  });
});
