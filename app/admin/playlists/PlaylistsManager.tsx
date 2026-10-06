"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Playlist = {
  id: string;
  name: string;
  status: "draft" | "published";
  totalDurationSecs: number;
  items: { id: string }[];
};

export function PlaylistsManager({ clientId }: { clientId: string }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadPlaylists() {
    const res = await fetch(`/api/v1/clients/${clientId}/playlists`);
    if (res.ok) {
      const body = (await res.json()) as { playlists: Playlist[] };
      setPlaylists(body.playlists);
    }
  }

  useEffect(() => {
    loadPlaylists();
  }, [clientId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/v1/clients/${clientId}/playlists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Could not create that playlist.");
      return;
    }

    setName("");
    await loadPlaylists();
  }

  return (
    <>
      <form className="screen-form" onSubmit={handleSubmit}>
        <label>
          Playlist name
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <button className="button" type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create Playlist"}
        </button>
      </form>
      {error && <p className="error-text">{error}</p>}

      <div className="screen-list">
        {playlists.length === 0 && <p className="lead">No playlists yet.</p>}
        {playlists.map((playlist) => (
          <Link className="screen-row playlist-row" key={playlist.id} href={`/admin/playlists/${playlist.id}`}>
            <span>{playlist.name}</span>
            <span className="playlist-row-meta">
              {playlist.items.length} item{playlist.items.length === 1 ? "" : "s"} &middot;{" "}
              {playlist.totalDurationSecs}s
            </span>
            <span className={`status-badge status-${playlist.status === "published" ? "online" : "ready_to_play"}`}>
              {playlist.status === "published" ? "Published" : "Draft"}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
