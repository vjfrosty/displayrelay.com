import { NextResponse, type NextRequest } from "next/server";
import { withClientAuth } from "@/lib/withClientAuth";
import { searchImages } from "@/lib/images/search";
import { imageSearchQuerySchema } from "@/lib/validation/images";

export const GET = withClientAuth(async (req: NextRequest, { clientId }) => {
  const parsed = imageSearchQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { query, orientation } = parsed.data;

  try {
    const result = await searchImages(clientId, query, orientation ?? "any");
    if (!result.allowed) {
      return NextResponse.json({ error: "Image search quota exceeded", upgradeUrl: result.upgradeUrl }, { status: 403 });
    }
    return NextResponse.json({ results: result.results });
  } catch {
    return NextResponse.json({ error: "Image search failed" }, { status: 502 });
  }
});
