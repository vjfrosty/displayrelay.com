import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "./db";
import { redis } from "./redis";
import { checkAndIncrement, checkFeature, checkStorageQuota, decrementUsage, getUsageSummary } from "./usage";

const clientIds: string[] = [];

async function createMediaAsset(clientId: string, sizeBytes: number) {
  await prisma.mediaAsset.create({
    data: {
      clientId,
      name: "test-asset",
      fileName: "test-asset.bin",
      objectKey: `test/${clientId}/${crypto.randomUUID()}`,
      publicUrl: "http://localhost/assets/test",
      mimeType: "application/octet-stream",
      sizeBytes,
    },
  });
}

async function createSubscribedClient(planSlug: string): Promise<string> {
  const client = await prisma.client.create({ data: { name: `Usage Test ${planSlug}` } });
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  await prisma.subscription.create({
    data: {
      clientId: client.id,
      planSlug,
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
    },
  });
  clientIds.push(client.id);
  return client.id;
}

afterAll(async () => {
  await prisma.usageRecord.deleteMany({ where: { clientId: { in: clientIds } } });
  await prisma.mediaAsset.deleteMany({ where: { clientId: { in: clientIds } } });
  await prisma.subscription.deleteMany({ where: { clientId: { in: clientIds } } });
  await prisma.client.deleteMany({ where: { id: { in: clientIds } } });
  if (clientIds.length > 0) {
    await redis.del(...clientIds.map((id) => `plan:${id}`));
  }
  await prisma.$disconnect();
  await redis.quit();
});

describe("checkAndIncrement", () => {
  it("allows exactly 10 ai_slides calls on the essential plan and blocks the 11th", async () => {
    const clientId = await createSubscribedClient("essential");

    for (let i = 1; i <= 10; i++) {
      const result = await checkAndIncrement(clientId, "ai_slides");
      expect(result.allowed).toBe(true);
      expect(result.current).toBe(i);
      expect(result.limit).toBe(10);
    }

    const eleventh = await checkAndIncrement(clientId, "ai_slides");
    expect(eleventh.allowed).toBe(false);
    if (!eleventh.allowed) {
      expect(eleventh.current).toBe(10);
      expect(eleventh.limit).toBe(10);
      expect(eleventh.upgradeUrl).toBe("/admin/settings/billing");
    }
  });
});

describe("checkFeature", () => {
  it("is false for google_reviews on essential", async () => {
    const clientId = await createSubscribedClient("essential");
    expect(await checkFeature(clientId, "google_reviews")).toBe(false);
  });

  it("is true for google_reviews on professional", async () => {
    const clientId = await createSubscribedClient("professional");
    expect(await checkFeature(clientId, "google_reviews")).toBe(true);
  });
});

describe("decrementUsage", () => {
  it("rolls back an increment and never goes below 0", async () => {
    const clientId = await createSubscribedClient("essential");

    const afterIncrement = await checkAndIncrement(clientId, "ai_decks");
    expect(afterIncrement.current).toBe(1);

    await decrementUsage(clientId, "ai_decks");
    const summaryAfterDecrement = await getUsageSummary(clientId);
    const aiDecks = summaryAfterDecrement.find((e) => e.metric === "ai_decks");
    expect(aiDecks?.current).toBe(0);

    await decrementUsage(clientId, "ai_decks");
    const summaryAfterFloor = await getUsageSummary(clientId);
    expect(summaryAfterFloor.find((e) => e.metric === "ai_decks")?.current).toBe(0);
  });
});

describe("checkStorageQuota", () => {
  const MB = 1024 * 1024;

  it("allows an upload that stays under the essential plan's 500MB limit", async () => {
    const clientId = await createSubscribedClient("essential");
    await createMediaAsset(clientId, 400 * MB);

    const result = await checkStorageQuota(clientId, 50 * MB);
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(450);
    expect(result.limit).toBe(500);
  });

  it("blocks an upload that would exceed the plan limit", async () => {
    const clientId = await createSubscribedClient("essential");
    await createMediaAsset(clientId, 400 * MB);

    const result = await checkStorageQuota(clientId, 200 * MB);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.current).toBe(400);
      expect(result.limit).toBe(500);
      expect(result.upgradeUrl).toBe("/admin/settings/billing");
    }
  });

  it("always allows uploads on an unlimited (-1) plan", async () => {
    const clientId = await createSubscribedClient("enterprise");
    await createMediaAsset(clientId, 10_000 * MB);

    const result = await checkStorageQuota(clientId, 5_000 * MB);
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(-1);
  });
});

describe("getUsageSummary", () => {
  it("includes every metric defined in the client's plan", async () => {
    const clientId = await createSubscribedClient("essential");
    await checkAndIncrement(clientId, "image_searches");

    const summary = await getUsageSummary(clientId);
    const metrics = summary.map((e) => e.metric);

    expect(metrics).toContain("ai_slides");
    expect(metrics).toContain("image_searches");

    const imageSearches = summary.find((e) => e.metric === "image_searches");
    expect(imageSearches).toEqual({ metric: "image_searches", current: 1, limit: 20 });
  });
});
