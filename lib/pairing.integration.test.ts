import { afterAll, describe, expect, it } from "vitest";
import { redis } from "./redis";
import { checkCode, claimCode, consumeCode, generateCode } from "./pairing";

afterAll(async () => {
  await redis.quit();
});

describe("pairing code lifecycle", () => {
  it("generates a 6-digit code that starts unclaimed", async () => {
    const { code, expiresAt } = await generateCode();
    expect(code).toMatch(/^\d{6}$/);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

    const entry = await checkCode(code);
    expect(entry).toEqual({ claimed: false });
  });

  it("claim then consume returns the payload and deletes the code (single-use)", async () => {
    const { code } = await generateCode();
    const payload = { clientId: "client-a", screenId: "screen-1", bearerToken: "tok_abc" };

    const claimed = await claimCode(code, payload);
    expect(claimed).toBe(true);

    const peeked = await checkCode(code);
    expect(peeked).toEqual({ claimed: true, ...payload });

    const consumed = await consumeCode(code);
    expect(consumed).toEqual({ claimed: true, ...payload });

    // Single-use: gone after consumption.
    expect(await checkCode(code)).toBeNull();
    expect(await consumeCode(code)).toBeNull();
  });

  it("fails to claim an unknown or expired code", async () => {
    const claimed = await claimCode("000000", {
      clientId: "client-a",
      screenId: "screen-1",
      bearerToken: "tok_abc",
    });
    expect(claimed).toBe(false);
  });

  it("fails to claim a code that's already been claimed", async () => {
    const { code } = await generateCode();
    const firstClaim = await claimCode(code, {
      clientId: "client-a",
      screenId: "screen-1",
      bearerToken: "tok_abc",
    });
    expect(firstClaim).toBe(true);

    const secondClaim = await claimCode(code, {
      clientId: "client-b",
      screenId: "screen-2",
      bearerToken: "tok_xyz",
    });
    expect(secondClaim).toBe(false);
  });

  it("consumeCode returns null for a code that hasn't been claimed yet", async () => {
    const { code } = await generateCode();
    expect(await consumeCode(code)).toBeNull();
  });
});
