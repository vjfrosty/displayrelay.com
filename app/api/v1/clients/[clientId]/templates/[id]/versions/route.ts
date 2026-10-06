import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withClientAuth } from "@/lib/withClientAuth";
import { getOwnedTemplate } from "@/lib/templates";

type Params = { clientId: string; id: string };

export const GET = withClientAuth<Params>(async (_req: NextRequest, { clientId, id }) => {
  const template = await getOwnedTemplate(clientId, id);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const versions = await prisma.templateVersion.findMany({
    where: { templateId: id },
    orderBy: { version: "desc" },
  });

  return NextResponse.json({ versions });
});
