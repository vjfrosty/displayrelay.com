"use client";

import { useCallback, useEffect, useState } from "react";

type ItemType = "media_asset" | "template" | "web_link" | "stream_url" | "google_reviews";

type PlaylistItem = {
  id: string;
  itemType: ItemType;
  resourceId: string | null;
  config: Record<string, unknown> | null;
  displayDurationSecs: number;
  order: number;
};

type Playlist = {
  id: string;
  name: string;
  status: "draft" | "published";
  totalDurationSecs: number;
  items: PlaylistItem[];
};

type MediaAsset = { id: string; name: string; thumbnailUrl: string | null };
type TemplateOption = { id: string; name: string; thumbnailUrl: string | null };
type Screen = { id: string; name: string; assignedPlaylistId: string | null };

const ITEM_TYPE_LABEL: Record<ItemType, string> = {
  media_asset: "Media",
  template: "Template",
  web_link: "Web Link",
  stream_url: "Stream URL",
  google_reviews: "Google Reviews",
};

function resolveItem(item: PlaylistItem, mediaAssets: MediaAsset[], templates: TemplateOption[]) {
  if (item.itemType === "media_asset") {
    const asset = mediaAssets.find((m) => m.id === item.resourceId);
    return { label: asset?.name ?? "Media asset", thumbnailUrl: asset?.thumbnailUrl ?? null };
  }
  if (item.itemType === "template") {
    const template = templates.find((t) => t.id === item.resourceId);
    return { label: template?.name ?? "Template", thumbnailUrl: template?.thumbnailUrl ?? null };
  }
  if (item.itemType === "web_link" || item.itemType === "stream_url") {
    const url = typeof item.config?.url === "string" ? item.config.url : ITEM_TYPE_LABEL[item.itemType];
    return { label: url, thumbnailUrl: null };
  }
  return { label: "Google Reviews", thumbnailUrl: null };
}

export function PlaylistEditor({ clientId, playlistId }: { clientId: string; playlistId: string }) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [newItemType, setNewItemType] = useState<ItemType>("media_asset");
  const [newResourceId, setNewResourceId] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newDuration, setNewDuration] = useState(8);
  const [assignScreenId, setAssignScreenId] = useState("");

  const load = useCallback(async () => {
    const [playlistRes, mediaRes, templatesRes, screensRes] = await Promise.all([
      fetch(`/api/v1/clients/${clientId}/playlists/${playlistId}`),
      fetch(`/api/v1/clients/${clientId}/media`),
      fetch(`/api/v1/clients/${clientId}/templates`),
      fetch(`/api/v1/clients/${clientId}/screens`),
    ]);
    if (playlistRes.ok) {
      const body = (await playlistRes.json()) as { playlist: Playlist };
      setPlaylist(body.playlist);
    }
    if (mediaRes.ok) {
      const body = (await mediaRes.json()) as { items: MediaAsset[] };
      setMediaAssets(body.items);
    }
    if (templatesRes.ok) {
      const body = (await templatesRes.json()) as { templates: TemplateOption[] };
      setTemplates(body.templates);
    }
    if (screensRes.ok) {
      setScreens((await screensRes.json()) as Screen[]);
    }
  }, [clientId, playlistId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddItem(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const body: Record<string, unknown> = { itemType: newItemType, displayDurationSecs: newDuration };
    if (newItemType === "media_asset" || newItemType === "template") {
      body.resourceId = newResourceId;
    }
    if (newItemType === "web_link" || newItemType === "stream_url") {
      body.config = { url: newUrl };
    }

    const res = await fetch(`/api/v1/clients/${clientId}/playlists/${playlistId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Could not add that item.");
      return;
    }

    setNewResourceId("");
    setNewUrl("");
    await load();
  }

  async function handleDeleteItem(itemId: string) {
    await fetch(`/api/v1/clients/${clientId}/playlists/${playlistId}/items/${itemId}`, { method: "DELETE" });
    await load();
  }

  async function handleDurationChange(itemId: string, value: number) {
    await fetch(`/api/v1/clients/${clientId}/playlists/${playlistId}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayDurationSecs: value }),
    });
    await load();
  }

  async function patchItemOrder(itemId: string, order: number) {
    await fetch(`/api/v1/clients/${clientId}/playlists/${playlistId}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
  }

  async function handleMove(item: PlaylistItem, direction: "up" | "down") {
    if (!playlist) return;
    const sorted = [...playlist.items].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((i) => i.id === item.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;
    const neighbor = sorted[swapIndex];

    // Swapping two rows' `order` directly would momentarily collide on the
    // (playlistId, order) unique constraint if both PATCHes land concurrently
    // (or even sequentially in the wrong order) — stage through a temporary
    // value that can't collide with any real gap-strategy order first.
    // `order` is a Postgres int4 column, so this must stay in 32-bit range
    // (a plain `-Date.now()` millisecond timestamp overflows it).
    const tempOrder = -1;
    await patchItemOrder(item.id, tempOrder);
    await patchItemOrder(neighbor.id, item.order);
    await patchItemOrder(item.id, neighbor.order);
    await load();
  }

  async function handleAssign() {
    if (!assignScreenId) return;
    setError(null);
    const res = await fetch(`/api/v1/clients/${clientId}/playlists/${playlistId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ screenId: assignScreenId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Could not assign that screen.");
      return;
    }
    await load();
  }

  async function handlePublish() {
    await fetch(`/api/v1/clients/${clientId}/playlists/${playlistId}/publish`, { method: "POST" });
    await load();
  }

  if (!playlist) {
    return <p className="lead">Loading…</p>;
  }

  const sortedItems = [...playlist.items].sort((a, b) => a.order - b.order);

  return (
    <>
      <p className="lead">
        {playlist.name} &mdash; <span className={`status-badge status-${playlist.status === "published" ? "online" : "ready_to_play"}`}>
          {playlist.status === "published" ? "Published" : "Draft"}
        </span>{" "}
        &middot; {playlist.totalDurationSecs}s total
      </p>
      {error && <p className="error-text">{error}</p>}

      <div className="playlist-items">
        {sortedItems.length === 0 && <p className="lead">No items yet.</p>}
        {sortedItems.map((item, index) => {
          const resolved = resolveItem(item, mediaAssets, templates);
          return (
            <div className="playlist-item-row" key={item.id}>
              {resolved.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin list thumbnail
                <img className="playlist-item-thumb" src={resolved.thumbnailUrl} alt="" />
              ) : (
                <div className="playlist-item-thumb playlist-item-thumb-placeholder">{ITEM_TYPE_LABEL[item.itemType]}</div>
              )}
              <div className="playlist-item-info">
                <span>{resolved.label}</span>
                <span className="playlist-row-meta">{ITEM_TYPE_LABEL[item.itemType]}</span>
              </div>
              <label className="playlist-item-duration">
                Duration (s)
                <input
                  type="number"
                  min={1}
                  value={item.displayDurationSecs}
                  onChange={(event) => handleDurationChange(item.id, Number(event.target.value))}
                />
              </label>
              <div className="playlist-item-actions">
                <button className="button secondary" type="button" onClick={() => handleMove(item, "up")} disabled={index === 0}>
                  Up
                </button>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => handleMove(item, "down")}
                  disabled={index === sortedItems.length - 1}
                >
                  Down
                </button>
                <button className="button secondary" type="button" onClick={() => handleDeleteItem(item.id)}>
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <form className="screen-form" onSubmit={handleAddItem}>
        <label>
          Item type
          <select value={newItemType} onChange={(event) => setNewItemType(event.target.value as ItemType)}>
            {Object.entries(ITEM_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {newItemType === "media_asset" && (
          <label>
            Media asset
            <select value={newResourceId} onChange={(event) => setNewResourceId(event.target.value)} required>
              <option value="">Select…</option>
              {mediaAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {newItemType === "template" && (
          <label>
            Template
            <select value={newResourceId} onChange={(event) => setNewResourceId(event.target.value)} required>
              <option value="">Select…</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {(newItemType === "web_link" || newItemType === "stream_url") && (
          <label>
            URL
            <input type="url" value={newUrl} onChange={(event) => setNewUrl(event.target.value)} required />
          </label>
        )}
        <label>
          Duration (s)
          <input type="number" min={1} value={newDuration} onChange={(event) => setNewDuration(Number(event.target.value))} />
        </label>
        <button className="button" type="submit">
          Add Item
        </button>
      </form>

      <div className="playlist-actions">
        <label>
          Assign to screen
          <select value={assignScreenId} onChange={(event) => setAssignScreenId(event.target.value)}>
            <option value="">Select a screen…</option>
            {screens.map((screen) => (
              <option key={screen.id} value={screen.id}>
                {screen.name}
                {screen.assignedPlaylistId === playlist.id ? " (currently assigned)" : ""}
              </option>
            ))}
          </select>
        </label>
        <button className="button secondary" type="button" onClick={handleAssign}>
          Assign
        </button>
        <button className="button" type="button" onClick={handlePublish} disabled={playlist.status === "published"}>
          {playlist.status === "published" ? "Published" : "Publish"}
        </button>
      </div>
    </>
  );
}
