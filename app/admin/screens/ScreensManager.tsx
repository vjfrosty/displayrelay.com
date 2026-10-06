"use client";

import { useEffect, useState } from "react";
import type { ScreenStatus } from "@/lib/screens";

type Screen = {
  id: string;
  name: string;
  computedStatus: ScreenStatus;
  assignedPlaylist: { id: string; name: string } | null;
};

const STATUS_LABEL: Record<ScreenStatus, string> = {
  online: "Online",
  offline: "Offline",
  ready_to_play: "Ready to Play",
  sleeping: "Sleeping",
};

export function ScreensManager({
  clientId,
  initialPairingCode,
}: {
  clientId: string;
  initialPairingCode: string;
}) {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [name, setName] = useState("");
  const [pairingCode, setPairingCode] = useState(initialPairingCode);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadScreens() {
    const res = await fetch(`/api/v1/clients/${clientId}/screens`);
    if (res.ok) {
      setScreens(await res.json());
    }
  }

  useEffect(() => {
    loadScreens();
  }, [clientId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/v1/clients/${clientId}/screens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, pairingCode }),
    });

    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Could not add that screen.");
      return;
    }

    setName("");
    setPairingCode("");
    await loadScreens();
  }

  return (
    <>
      <form className="screen-form" onSubmit={handleSubmit}>
        <label>
          Screen name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Pairing code
          <input
            value={pairingCode}
            onChange={(e) => setPairingCode(e.target.value)}
            pattern="\d{6}"
            maxLength={6}
            required
          />
        </label>
        <button className="button" type="submit" disabled={submitting}>
          {submitting ? "Adding…" : "Add Screen"}
        </button>
      </form>
      {error && <p className="error-text">{error}</p>}

      <div className="screen-list">
        {screens.length === 0 && <p className="lead">No screens yet.</p>}
        {screens.map((screen) => (
          <div className="screen-row" key={screen.id}>
            <span>{screen.name}</span>
            <span className="playlist-row-meta">
              {screen.assignedPlaylist ? `Playing: ${screen.assignedPlaylist.name}` : "No playlist assigned"}
            </span>
            <span className={`status-badge status-${screen.computedStatus}`}>
              {STATUS_LABEL[screen.computedStatus]}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
