import { NextResponse, type NextRequest } from "next/server";
import { scopedPrisma } from "@/lib/tenant";
import { withClientAuth } from "@/lib/withClientAuth";
import { recomputeTotalDuration } from "@/lib/playlists";
import { updatePlaylistItemSchema } from "@/lib/validation/playlists";

type Params = { clientId: string; id: string; itemId: string };

export const PATCH = withClientAuth<Params>(async (req: NextRequest, { clientId, id, itemId }) => {
  const body = await req.json().catch(() => null);
  const parsed = updatePlaylistItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await scopedPrisma(clientId).playlistItem.updateMany({
    where: { id: itemId, playlistId: id },
    data: parsed.data,
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Playlist item not found" }, { status: 404 });
  }

  if (parsed.data.displayDurationSecs !== undefined) {
    await recomputeTotalDuration(clientId, id);
  }

  const item = await scopedPrisma(clientId).playlistItem.findFirst({ where: { id: itemId } });
  return NextResponse.json({ item });
});

export const DELETE = withClientAuth<Params>(async (_req: NextRequest, { clientId, id, itemId }) => {
  const result = await scopedPrisma(clientId).playlistItem.deleteMany({ where: { id: itemId, playlistId: id } });
  if (result.count === 0) {
    return NextResponse.json({ error: "Playlist item not found" }, { status: 404 });
  }

  await recomputeTotalDuration(clientId, id);

  return new NextResponse(null, { status: 204 });
});
