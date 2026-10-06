import { NextResponse, type NextRequest } from "next/server";
import { scopedPrisma } from "@/lib/tenant";
import { withClientAuth } from "@/lib/withClientAuth";
import { assignPlaylistToScreen } from "@/lib/playlists";
import { assignPlaylistSchema } from "@/lib/validation/playlists";

type Params = { clientId: string; id: string };

export const POST = withClientAuth<Params>(async (req: NextRequest, { clientId, id }) => {
  const body = await req.json().catch(() => null);
  const parsed = assignPlaylistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await assignPlaylistToScreen(clientId, id, parsed.data.screenId);
  if (!result.ok) {
    const message = result.reason === "playlist_not_found" ? "Playlist not found" : "Screen not found";
    return NextResponse.json({ error: message }, { status: 404 });
  }

  const screen = await scopedPrisma(clientId).screen.findFirst({ where: { id: parsed.data.screenId } });
  return NextResponse.json({ screen });
});
