import { describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const { getSessionMock } = vi.hoisted(() => ({ getSessionMock: vi.fn() }));

vi.mock("./auth", () => ({
  getSession: getSessionMock,
  isSuperAdmin: (session: { user?: { isSuperAdmin?: boolean } } | null) =>
    session?.user?.isSuperAdmin === true,
}));

const { withClientAuth } = await import("./withClientAuth");

function fakeRouteCtx(clientId: string) {
  return { params: Promise.resolve({ clientId }) };
}

const fakeRequest = {} as NextRequest;

describe("withClientAuth", () => {
  it("returns 401 when there is no session", async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const handler = withClientAuth(async () => new Response("ok"));

    const response = await handler(fakeRequest, fakeRouteCtx("client-a"));
    expect(response.status).toBe(401);
  });

  it("returns 403 when the session belongs to a different client", async () => {
    getSessionMock.mockResolvedValueOnce({ user: { clientId: "client-b", isSuperAdmin: false } });
    const handler = withClientAuth(async () => new Response("ok"));

    const response = await handler(fakeRequest, fakeRouteCtx("client-a"));
    expect(response.status).toBe(403);
  });

  it("calls the handler when the session matches the route's clientId", async () => {
    getSessionMock.mockResolvedValueOnce({ user: { clientId: "client-a", isSuperAdmin: false } });
    const handler = withClientAuth(async (_req, ctx) => new Response(ctx.clientId));

    const response = await handler(fakeRequest, fakeRouteCtx("client-a"));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("client-a");
  });

  it("calls the handler for a super-admin regardless of clientId mismatch", async () => {
    getSessionMock.mockResolvedValueOnce({ user: { clientId: null, isSuperAdmin: true } });
    const handler = withClientAuth(async (_req, ctx) => new Response(ctx.clientId));

    const response = await handler(fakeRequest, fakeRouteCtx("client-a"));
    expect(response.status).toBe(200);
  });

  it("passes through extra route params beyond clientId (e.g. a nested [screenId] segment)", async () => {
    getSessionMock.mockResolvedValueOnce({ user: { clientId: "client-a", isSuperAdmin: false } });
    const handler = withClientAuth<{ clientId: string; screenId: string }>(
      async (_req, ctx) => new Response(`${ctx.clientId}/${ctx.screenId}`),
    );

    const response = await handler(fakeRequest, {
      params: Promise.resolve({ clientId: "client-a", screenId: "screen-1" }),
    });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("client-a/screen-1");
  });
});
