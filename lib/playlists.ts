import { scopedPrisma } from "@/lib/tenant";
import { publishEvent } from "@/lib/soketi";

const ORDER_GAP = 10;

// Keeps Playlist.totalDurationSecs (a denormalized sum) in sync — called
// after every item add/update/delete.
export async function recomputeTotalDuration(clientId: string, playlistId: string): Promise<number> {
  const result = await scopedPrisma(clientId).playlistItem.aggregate({
    where: { playlistId },
    _sum: { displayDurationSecs: true },
  });
  const total = result._sum.displayDurationSecs ?? 0;
  await scopedPrisma(clientId).playlist.updateMany({
    where: { id: playlistId },
    data: { totalDurationSecs: total },
  });
  return total;
}

// Gap strategy (10, 20, 30, ...) so inserting an item between two existing
// ones (via a reorder PATCH) never requires renumbering the rest.
export async function nextItemOrder(clientId: string, playlistId: string): Promise<number> {
  const result = await scopedPrisma(clientId).playlistItem.aggregate({
    where: { playlistId },
    _max: { order: true },
  });
  return (result._max.order ?? 0) + ORDER_GAP;
}

export type AssignResult =
  | { ok: true }
  | { ok: false; reason: "playlist_not_found" | "screen_not_found" };

// Both lookups are scoped to clientId, so a screenId belonging to another
// tenant naturally fails here rather than needing a separate cross-tenant check.
export async function assignPlaylistToScreen(clientId: string, playlistId: string, screenId: string): Promise<AssignResult> {
  const playlist = await scopedPrisma(clientId).playlist.findFirst({ where: { id: playlistId } });
  if (!playlist) {
    return { ok: false, reason: "playlist_not_found" };
  }

  const result = await scopedPrisma(clientId).screen.updateMany({
    where: { id: screenId },
    data: { assignedPlaylistId: playlistId },
  });
  if (result.count === 0) {
    return { ok: false, reason: "screen_not_found" };
  }

  return { ok: true };
}

export type PublishResult = { ok: true } | { ok: false; reason: "not_found" };

// Broadcasts only after the DB write commits, per
// .github/instructions/realtime-cache.instructions.md.
export async function publishPlaylist(clientId: string, playlistId: string): Promise<PublishResult> {
  const result = await scopedPrisma(clientId).playlist.updateMany({
    where: { id: playlistId },
    data: { status: "published", publishedAt: new Date() },
  });
  if (result.count === 0) {
    return { ok: false, reason: "not_found" };
  }

  await publishEvent(clientId, "playlist.updated", { playlistId });
  return { ok: true };
}
