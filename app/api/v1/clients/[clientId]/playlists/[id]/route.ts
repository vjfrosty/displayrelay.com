import { NextResponse, type NextRequest } from "next/server";
import { scopedPrisma } from "@/lib/tenant";
import { withClientAuth } from "@/lib/withClientAuth";
import { updatePlaylistSchema } from "@/lib/validation/playlists";

type Params = { clientId: string; id: string };

export const GET = withClientAuth<Params>(async (_req: NextRequest, { clientId, id }) => {
  const playlist = await scopedPrisma(clientId).playlist.findFirst({
    where: { id },
    include: { items: { orderBy: { order: "asc" } }, assignedScreens: true },
  });
  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }
  return NextResponse.json({ playlist });
});

export const PATCH = withClientAuth<Params>(async (req: NextRequest, { clientId, id }) => {
  const body = await req.json().catch(() => null);
  const parsed = updatePlaylistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await scopedPrisma(clientId).playlist.updateMany({ where: { id }, data: parsed.data });
  if (result.count === 0) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  const playlist = await scopedPrisma(clientId).playlist.findFirst({ where: { id } });
  return NextResponse.json({ playlist });
});

export const DELETE = withClientAuth<Params>(async (_req: NextRequest, { clientId, id }) => {
  const result = await scopedPrisma(clientId).playlist.deleteMany({ where: { id } });
  if (result.count === 0) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
});
