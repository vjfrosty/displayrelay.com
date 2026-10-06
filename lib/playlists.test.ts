import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { assignPlaylistToScreen, nextItemOrder, publishPlaylist, recomputeTotalDuration } from "./playlists";

const clientIds: string[] = [];
const playlistIds: string[] = [];
const screenIds: string[] = [];

async function createClient(name: string): Promise<string> {
  const client = await prisma.client.create({ data: { name } });
  clientIds.push(client.id);
  return client.id;
}

async function createPlaylist(clientId: string, name: string): Promise<string> {
  const playlist = await prisma.playlist.create({ data: { clientId, name } });
  playlistIds.push(playlist.id);
  return playlist.id;
}

async function createItem(clientId: string, playlistId: string, order: number, durationSecs: number) {
  await prisma.playlistItem.create({
    data: {
      clientId,
      playlistId,
      itemType: "web_link",
      config: { url: "https://example.com" },
      displayDurationSecs: durationSecs,
      order,
    },
  });
}

async function createScreen(clientId: string, name: string): Promise<string> {
  const screen = await prisma.screen.create({ data: { clientId, name } });
  screenIds.push(screen.id);
  return screen.id;
}

afterAll(async () => {
  await prisma.playlistItem.deleteMany({ where: { playlistId: { in: playlistIds } } });
  await prisma.screen.deleteMany({ where: { id: { in: screenIds } } });
  await prisma.playlist.deleteMany({ where: { id: { in: playlistIds } } });
  await prisma.client.deleteMany({ where: { id: { in: clientIds } } });
  await prisma.$disconnect();
});

describe("nextItemOrder", () => {
  it("returns 10 for an empty playlist, then 20, then 30 as items are added", async () => {
    const clientId = await createClient("Playlists Test - order");
    const playlistId = await createPlaylist(clientId, "Order Test");

    expect(await nextItemOrder(clientId, playlistId)).toBe(10);
    await createItem(clientId, playlistId, 10, 8);

    expect(await nextItemOrder(clientId, playlistId)).toBe(20);
    await createItem(clientId, playlistId, 20, 8);

    expect(await nextItemOrder(clientId, playlistId)).toBe(30);
  });
});

describe("recomputeTotalDuration", () => {
  it("sums displayDurationSecs across all items and persists it on the playlist", async () => {
    const clientId = await createClient("Playlists Test - duration");
    const playlistId = await createPlaylist(clientId, "Duration Test");
    await createItem(clientId, playlistId, 10, 8);
    await createItem(clientId, playlistId, 20, 12);

    const total = await recomputeTotalDuration(clientId, playlistId);
    expect(total).toBe(20);

    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    expect(playlist?.totalDurationSecs).toBe(20);
  });

  it("recomputes to 0 once all items are removed", async () => {
    const clientId = await createClient("Playlists Test - duration-empty");
    const playlistId = await createPlaylist(clientId, "Duration Empty Test");
    await createItem(clientId, playlistId, 10, 15);
    await recomputeTotalDuration(clientId, playlistId);

    await prisma.playlistItem.deleteMany({ where: { playlistId } });
    const total = await recomputeTotalDuration(clientId, playlistId);
    expect(total).toBe(0);
  });
});

describe("assignPlaylistToScreen", () => {
  it("assigns a playlist to a screen owned by the same tenant", async () => {
    const clientId = await createClient("Playlists Test - assign");
    const playlistId = await createPlaylist(clientId, "Assign Test");
    const screenId = await createScreen(clientId, "Test Screen");

    const result = await assignPlaylistToScreen(clientId, playlistId, screenId);
    expect(result).toEqual({ ok: true });

    const screen = await prisma.screen.findUnique({ where: { id: screenId } });
    expect(screen?.assignedPlaylistId).toBe(playlistId);
  });

  it("rejects assignment when the screen belongs to another tenant", async () => {
    const ownerId = await createClient("Playlists Test - assign owner");
    const attackerId = await createClient("Playlists Test - assign attacker");
    const playlistId = await createPlaylist(ownerId, "Owner's Playlist");
    const foreignScreenId = await createScreen(attackerId, "Attacker's Screen");

    const result = await assignPlaylistToScreen(ownerId, playlistId, foreignScreenId);
    expect(result).toEqual({ ok: false, reason: "screen_not_found" });

    const screen = await prisma.screen.findUnique({ where: { id: foreignScreenId } });
    expect(screen?.assignedPlaylistId).toBeNull();
  });

  it("returns playlist_not_found for a playlist belonging to another tenant", async () => {
    const ownerId = await createClient("Playlists Test - playlist owner");
    const attackerId = await createClient("Playlists Test - playlist attacker");
    const playlistId = await createPlaylist(ownerId, "Owner's Playlist 2");
    const screenId = await createScreen(attackerId, "Attacker's Own Screen");

    const result = await assignPlaylistToScreen(attackerId, playlistId, screenId);
    expect(result).toEqual({ ok: false, reason: "playlist_not_found" });
  });
});

describe("publishPlaylist", () => {
  it("sets status to published and publishedAt", async () => {
    const clientId = await createClient("Playlists Test - publish");
    const playlistId = await createPlaylist(clientId, "Publish Test");

    const before = await prisma.playlist.findUnique({ where: { id: playlistId } });
    expect(before?.status).toBe("draft");
    expect(before?.publishedAt).toBeNull();

    const result = await publishPlaylist(clientId, playlistId);
    expect(result).toEqual({ ok: true });

    const after = await prisma.playlist.findUnique({ where: { id: playlistId } });
    expect(after?.status).toBe("published");
    expect(after?.publishedAt).not.toBeNull();
  });

  it("returns not_found for a playlist that doesn't belong to the tenant", async () => {
    const ownerId = await createClient("Playlists Test - publish owner");
    const attackerId = await createClient("Playlists Test - publish attacker");
    const playlistId = await createPlaylist(ownerId, "Owner's Playlist 3");

    const result = await publishPlaylist(attackerId, playlistId);
    expect(result).toEqual({ ok: false, reason: "not_found" });
  });
});
