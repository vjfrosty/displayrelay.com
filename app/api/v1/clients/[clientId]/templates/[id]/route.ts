import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withClientAuth } from "@/lib/withClientAuth";
import { getOwnedTemplate } from "@/lib/templates";
import { updateTemplateSchema } from "@/lib/validation/templates";

type Params = { clientId: string; id: string };

export const GET = withClientAuth<Params>(async (_req: NextRequest, { clientId, id }) => {
  const template = await getOwnedTemplate(clientId, id);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
  return NextResponse.json({ template });
});

export const PATCH = withClientAuth<Params>(async (req: NextRequest, { clientId, id }) => {
  const body = await req.json().catch(() => null);
  const parsed = updateTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await getOwnedTemplate(clientId, id);
  if (!existing) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const template = await prisma.template.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ template });
});

export const DELETE = withClientAuth<Params>(async (_req: NextRequest, { clientId, id }) => {
  const existing = await getOwnedTemplate(clientId, id);
  if (!existing) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  await prisma.template.update({ where: { id }, data: { deletedAt: new Date() } });
  return new NextResponse(null, { status: 204 });
});
