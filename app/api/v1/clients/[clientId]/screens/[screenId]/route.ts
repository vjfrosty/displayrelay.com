import { NextResponse, type NextRequest } from "next/server";
import { scopedPrisma } from "@/lib/tenant";
import { withClientAuth } from "@/lib/withClientAuth";
import { computeScreenStatus } from "@/lib/screens";
import { updateScreenSchema } from "@/lib/validation/screens";

type Params = { clientId: string; screenId: string };

export const PATCH = withClientAuth<Params>(async (req: NextRequest, { clientId, screenId }) => {
  const body = await req.json().catch(() => null);
  const parsed = updateScreenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await scopedPrisma(clientId).screen.updateMany({
    where: { id: screenId },
    data: parsed.data,
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Screen not found" }, { status: 404 });
  }

  const screen = await scopedPrisma(clientId).screen.findFirst({ where: { id: screenId } });
  if (!screen) {
    return NextResponse.json({ error: "Screen not found" }, { status: 404 });
  }
  return NextResponse.json({ ...screen, computedStatus: computeScreenStatus(screen) });
});

export const DELETE = withClientAuth<Params>(async (_req: NextRequest, { clientId, screenId }) => {
  const result = await scopedPrisma(clientId).screen.deleteMany({ where: { id: screenId } });
  if (result.count === 0) {
    return NextResponse.json({ error: "Screen not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
});
