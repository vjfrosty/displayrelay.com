import crypto from "node:crypto";
import { redis } from "./redis";

const PAIRING_CODE_TTL_SECONDS = Number(process.env.PAIRING_CODE_TTL_SECONDS ?? 300);
const CLAIMED_PICKUP_TTL_SECONDS = 30;

type PendingEntry = { claimed: false };
type ClaimedEntry = { claimed: true; clientId: string; screenId: string; bearerToken: string };
export type PairingEntry = PendingEntry | ClaimedEntry;

function pairingKey(code: string): string {
  return `pairing:${code}`;
}

function randomSixDigitCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

// TV calls this (unauthenticated) to request a fresh code to display + a QR code.
export async function generateCode(): Promise<{ code: string; expiresAt: Date }> {
  let code: string;
  do {
    code = randomSixDigitCode();
  } while (await redis.exists(pairingKey(code)));

  const entry: PendingEntry = { claimed: false };
  await redis.setex(pairingKey(code), PAIRING_CODE_TTL_SECONDS, JSON.stringify(entry));
  return { code, expiresAt: new Date(Date.now() + PAIRING_CODE_TTL_SECONDS * 1000) };
}

// Non-destructive peek — used by the TV's poll loop to distinguish "still
// waiting" from "expired/invalid" without consuming the code.
export async function checkCode(code: string): Promise<PairingEntry | null> {
  const raw = await redis.get(pairingKey(code));
  if (raw === null) return null;
  return JSON.parse(raw) as PairingEntry;
}

// Admin calls this (authenticated) after entering the code shown on the TV.
// Returns false if the code doesn't exist, is expired, or was already claimed.
export async function claimCode(
  code: string,
  payload: { clientId: string; screenId: string; bearerToken: string },
): Promise<boolean> {
  const raw = await redis.get(pairingKey(code));
  if (raw === null) return false;

  const entry = JSON.parse(raw) as PairingEntry;
  if (entry.claimed) return false;

  const claimedEntry: ClaimedEntry = { claimed: true, ...payload };
  await redis.setex(pairingKey(code), CLAIMED_PICKUP_TTL_SECONDS, JSON.stringify(claimedEntry));
  return true;
}

// Final pickup by the TV once claimed: returns the payload and deletes the
// code — single use, can only be consumed once.
export async function consumeCode(code: string): Promise<ClaimedEntry | null> {
  const raw = await redis.get(pairingKey(code));
  if (raw === null) return null;

  const entry = JSON.parse(raw) as PairingEntry;
  if (!entry.claimed) return null;

  await redis.del(pairingKey(code));
  return entry;
}
