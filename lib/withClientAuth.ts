import { NextResponse, type NextRequest } from "next/server";
import { getSession, isSuperAdmin } from "./auth";

type RouteContext<P> = { params: Promise<P> };
type Handler<P> = (req: NextRequest, ctx: P) => Promise<Response>;

// Wraps a tenant-scoped App Router route handler: 401s if unauthenticated,
// 403s if the session's clientId doesn't match the route's clientId param
// (unless the session is a super-admin). Passes the full resolved params
// object through to the handler, so routes nested under [clientId] (e.g.
// [clientId]/screens/[screenId]) get every param, not just clientId.
export function withClientAuth<P extends { clientId: string } = { clientId: string }>(handler: Handler<P>) {
  return async (req: NextRequest, routeCtx: RouteContext<P>): Promise<Response> => {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await routeCtx.params;
    if (session.user.clientId !== params.clientId && !isSuperAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return handler(req, params);
  };
}
