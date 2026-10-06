import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { scopedPrisma } from "@/lib/tenant";
import { withClientAuth } from "@/lib/withClientAuth";
import { computeScreenStatus } from "@/lib/screens";
import { claimCode } from "@/lib/pairing";
import { createScreenSchema } from "@/lib/validation/screens";

export const GET = withClientAuth(async (_req: NextRequest, { clientId }) => {
  const screens = await scopedPrisma(clientId).screen.findMany({
    orderBy: { createdAt: "desc" },
    include: { assignedPlaylist: { select: { id: true, name: true } } },
  });
  const withStatus = screens.map((screen) => ({ ...screen, computedStatus: computeScreenStatus(screen) }));
  return NextResponse.json(withStatus);
});

export const POST = withClientAuth(async (req: NextRequest, { clientId }) => {
  const body = await req.json().catch(() => null);
  const parsed = createScreenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, pairingCode } = parsed.data;

  const screen = await prisma.screen.create({ data: { clientId, name } });

  const bearerToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(bearerToken).digest("hex");
  await prisma.apiToken.create({
    data: {
      clientId,
      screenId: screen.id,
      name: `${name} bearer token`,
      tokenHash,
      tokenType: "screen",
    },
  });

  const claimed = await claimCode(pairingCode, { clientId, screenId: screen.id, bearerToken });
  if (!claimed) {
    await prisma.apiToken.deleteMany({ where: { screenId: screen.id } });
    await prisma.screen.delete({ where: { id: screen.id } });
    return NextResponse.json({ error: "Pairing code expired or invalid" }, { status: 400 });
  }

  return NextResponse.json({ ...screen, computedStatus: computeScreenStatus(screen) }, { status: 201 });
});
