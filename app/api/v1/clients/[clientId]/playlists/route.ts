import { NextResponse, type NextRequest } from "next/server";
import { scopedPrisma } from "@/lib/tenant";
import { withClientAuth } from "@/lib/withClientAuth";
import { createPlaylistSchema, playlistQuerySchema } from "@/lib/validation/playlists";

export const GET = withClientAuth(async (req: NextRequest, { clientId }) => {
  const parsed = playlistQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const playlists = await scopedPrisma(clientId).playlist.findMany({
    where: parsed.data.status ? { status: parsed.data.status } : {},
    orderBy: { createdAt: "desc" },
    include: { items: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ playlists });
});

export const POST = withClientAuth(async (req: NextRequest, { clientId }) => {
  const body = await req.json().catch(() => null);
  const parsed = createPlaylistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const playlist = await scopedPrisma(clientId).playlist.create({
    data: { clientId, ...parsed.data },
  });

  return NextResponse.json({ playlist }, { status: 201 });
});
