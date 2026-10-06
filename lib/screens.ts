// 90s = 3x the 30s heartbeat cadence (architecture doc Section 19's Soketi
// events table) — tolerates a couple of missed beats before flipping offline.
const OFFLINE_THRESHOLD_SECONDS = 90;

export type ScreenStatus = "online" | "offline" | "ready_to_play" | "sleeping";

// Status is computed on read from lastHeartbeatAt, never stored. "sleeping"
// (operation-hours based) is P2 — nothing produces it yet, but the type/badge
// exists for completeness.
export function computeScreenStatus(screen: { lastHeartbeatAt: Date | null }): ScreenStatus {
  if (!screen.lastHeartbeatAt) return "ready_to_play";

  const secondsSinceHeartbeat = (Date.now() - screen.lastHeartbeatAt.getTime()) / 1000;
  return secondsSinceHeartbeat <= OFFLINE_THRESHOLD_SECONDS ? "online" : "offline";
}
