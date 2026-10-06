"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type PairState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "waiting"; code: string; expiresAt: string }
  | { status: "paired"; clientId: string; screenId: string };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";
const POLL_INTERVAL_MS = 3000;

export default function PairPage() {
  const [state, setState] = useState<PairState>({ status: "loading" });
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  async function requestCode() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/v1/pair/request", { method: "POST" });
      if (!res.ok) throw new Error("Failed to request a pairing code");
      const data = (await res.json()) as { code: string; expiresAt: string };
      setState({ status: "waiting", code: data.code, expiresAt: data.expiresAt });
    } catch {
      setState({ status: "error", message: "Could not reach the server. Try again." });
    }
  }

  useEffect(() => {
    requestCode();
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  useEffect(() => {
    if (state.status !== "waiting") return;

    const code = state.code;
    pollTimer.current = setInterval(async () => {
      const res = await fetch(`/api/v1/pair/request?code=${code}`);
      if (res.status === 410) {
        if (pollTimer.current) clearInterval(pollTimer.current);
        setState({ status: "error", message: "This code expired. Get a new one below." });
        return;
      }
      const data = await res.json();
      if (data.claimed) {
        if (pollTimer.current) clearInterval(pollTimer.current);
        localStorage.setItem("displayrelay.bearerToken", data.bearerToken);
        setState({ status: "paired", clientId: data.clientId, screenId: data.screenId });
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [state]);

  return (
    <main className="shell">
      <section className="panel pair-panel">
        <p className="eyebrow">Pair This Screen</p>
        {state.status === "loading" && <h1 className="title">Getting a code…</h1>}

        {state.status === "error" && (
          <>
            <h1 className="title">Something went wrong</h1>
            <p className="lead">{state.message}</p>
            <div className="action-row">
              <button className="button" onClick={requestCode}>
                Get a new code
              </button>
            </div>
          </>
        )}

        {state.status === "waiting" && (
          <>
            <p className="pair-code">{state.code}</p>
            <p className="lead">
              In the admin dashboard, add a screen and enter this code. This page updates automatically.
            </p>
            <div className="pair-qr">
              <QRCodeSVG value={`${APP_URL}/admin/screens?pairingCode=${state.code}`} size={180} />
            </div>
          </>
        )}

        {state.status === "paired" && (
          <>
            <h1 className="title">Paired ✓</h1>
            <p className="lead">This screen is now connected. Content will appear here once it&apos;s assigned.</p>
          </>
        )}
      </section>
    </main>
  );
}
