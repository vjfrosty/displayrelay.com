import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { checkAndIncrement } from "@/lib/usage";
import { searchImages } from "./search";
import type { ProviderImageResult } from "./pexels";

// Pexels calls can't be exercised end-to-end in this environment
// (PEXELS_API_KEY is a placeholder, not a real key — see ORCHESTRATOR.md).
// These tests cover the parts of the gated/cached flow that don't require a
// real provider call: cache hits skip gating entirely, and a client whose
// quota is already exhausted is blocked before any provider call is attempted.

const clientIds: string[] = [];
const cacheKeys: string[] = [];

async function createSubscribedClient(planSlug: string): Promise<string> {
  const client = await prisma.client.create({ data: { name: `Image Search Test ${planSlug}` } });
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  await prisma.subscription.create({
    data: { clientId: client.id, planSlug, currentPeriodStart: now, currentPeriodEnd: nextMonth },
  });
  clientIds.push(client.id);
  return client.id;
}

afterAll(async () => {
  await prisma.generationLog.deleteMany({ where: { clientId: { in: clientIds } } });
  await prisma.usageRecord.deleteMany({ where: { clientId: { in: clientIds } } });
  await prisma.subscription.deleteMany({ where: { clientId: { in: clientIds } } });
  await prisma.client.deleteMany({ where: { id: { in: clientIds } } });
  await prisma.imageCache.deleteMany({ where: { cacheKey: { in: cacheKeys } } });
  if (clientIds.length > 0) {
    await redis.del(...clientIds.map((id) => `plan:${id}`));
  }
  await prisma.$disconnect();
  await redis.quit();
});

describe("searchImages", () => {
  it("returns cached results without checking or incrementing usage", async () => {
    const clientId = await createSubscribedClient("essential");
    const query = `cache-hit-test-${crypto.randomUUID()}`;
    // Must match lib/images/search.ts's private cacheKeyFor() exactly:
    // `pexels:${query.trim().toLowerCase()}:${orientation}`.
    const cacheKey = `pexels:${query.toLowerCase()}:any`;
    cacheKeys.push(cacheKey);
    const seededResults: ProviderImageResult[] = [
      {
        id: "1",
        provider: "pexels",
        src: "https://example.com/large.jpg",
        thumbnailSrc: "https://example.com/medium.jpg",
        width: 1920,
        height: 1080,
        attribution: "Photo by Test Photographer on Pexels",
      },
    ];
    await prisma.imageCache.create({
      data: {
        cacheKey,
        clientId: null,
        provider: "pexels",
        query,
        orientation: "any",
        results: seededResults as unknown as object,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    const result = await searchImages(clientId, query, "any");

    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.results).toEqual(seededResults);
    }

    const usageCount = await prisma.usageRecord.count({ where: { clientId } });
    expect(usageCount).toBe(0);
  });

  it("blocks a cache-miss search once the client's monthly quota is exhausted, without attempting a provider call", async () => {
    const clientId = await createSubscribedClient("essential");
    for (let i = 0; i < 20; i++) {
      const gate = await checkAndIncrement(clientId, "image_searches");
      expect(gate.allowed).toBe(true);
    }

    const result = await searchImages(clientId, `quota-exhausted-test-${crypto.randomUUID()}`, "any");

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.upgradeUrl).toBeTruthy();
    }

    const logCount = await prisma.generationLog.count({ where: { clientId, metric: "image_searches" } });
    expect(logCount).toBe(0);
  });
});
