import { NextResponse, type NextRequest } from "next/server";
import { scopedPrisma } from "@/lib/tenant";
import { withClientAuth } from "@/lib/withClientAuth";
import { publishPlaylist } from "@/lib/playlists";

type Params = { clientId: string; id: string };

export const POST = withClientAuth<Params>(async (_req: NextRequest, { clientId, id }) => {
  const result = await publishPlaylist(clientId, id);
  if (!result.ok) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  const playlist = await scopedPrisma(clientId).playlist.findFirst({ where: { id } });
  return NextResponse.json({ playlist });
});
