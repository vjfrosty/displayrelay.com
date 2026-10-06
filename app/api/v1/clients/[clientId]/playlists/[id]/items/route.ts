import { NextResponse, type NextRequest } from "next/server";
import { scopedPrisma } from "@/lib/tenant";
import { withClientAuth } from "@/lib/withClientAuth";
import { nextItemOrder, recomputeTotalDuration } from "@/lib/playlists";
import { createPlaylistItemSchema } from "@/lib/validation/playlists";

type Params = { clientId: string; id: string };

export const POST = withClientAuth<Params>(async (req: NextRequest, { clientId, id }) => {
  const body = await req.json().catch(() => null);
  const parsed = createPlaylistItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const playlist = await scopedPrisma(clientId).playlist.findFirst({ where: { id } });
  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  const order = await nextItemOrder(clientId, id);
  const item = await scopedPrisma(clientId).playlistItem.create({
    data: {
      clientId,
      playlistId: id,
      itemType: parsed.data.itemType,
      resourceId: parsed.data.resourceId,
      config: parsed.data.config,
      displayDurationSecs: parsed.data.displayDurationSecs ?? 8,
      order,
    },
  });

  await recomputeTotalDuration(clientId, id);

  return NextResponse.json({ item }, { status: 201 });
});
