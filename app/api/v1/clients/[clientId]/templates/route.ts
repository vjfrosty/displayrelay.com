import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withClientAuth } from "@/lib/withClientAuth";
import { saveTemplateVersion } from "@/lib/templates";
import { createTemplateSchema, templateQuerySchema } from "@/lib/validation/templates";

const SORT_TO_ORDER_BY = {
  newest: { createdAt: "desc" as const },
  rating: { rating: "desc" as const },
  uses: { useCount: "desc" as const },
};

export const GET = withClientAuth(async (req: NextRequest, { clientId }) => {
  const parsed = templateQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { library, category, orientation, vertical, search, sort } = parsed.data;

  const where = {
    deletedAt: null,
    ...(library ? { clientId: null, isLibrary: true } : { clientId }),
    ...(category ? { category } : {}),
    ...(orientation ? { orientation } : {}),
    ...(vertical ? { vertical } : {}),
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
  };

  const templates = await prisma.template.findMany({
    where,
    orderBy: SORT_TO_ORDER_BY[sort],
  });

  return NextResponse.json({ templates });
});

export const POST = withClientAuth(async (req: NextRequest, { clientId }) => {
  const body = await req.json().catch(() => null);
  const parsed = createTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await saveTemplateVersion({ clientId, ...parsed.data });
  if (!result.ok) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json({ template: result.template, version: result.version }, { status: 201 });
});
