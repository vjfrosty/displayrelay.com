import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "./db";
import { redis } from "./redis";
import { getSetting, setSetting } from "./settings";

afterAll(async () => {
  await prisma.$disconnect();
  await redis.quit();
});

describe("getSetting", () => {
  it("resolves a seeded global setting", async () => {
    expect(await getSetting("platform.name")).toBe("Display Platform");
  });

  it("returns the same value on a cached second call", async () => {
    const first = await getSetting("platform.name");
    const second = await getSetting("platform.name");
    expect(second).toBe(first);
  });

  it("reflects a new value immediately after setSetting invalidates the cache", async () => {
    const original = await getSetting("platform.name");
    try {
      await setSetting("platform.name", "Test Platform Name");
      expect(await getSetting("platform.name")).toBe("Test Platform Name");
    } finally {
      await setSetting("platform.name", original as string);
    }
  });
});
