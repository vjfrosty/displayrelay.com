import { prisma } from "@/lib/db";
import { checkAndIncrement, decrementUsage, type UsageCheckResult } from "@/lib/usage";
import { searchPexels, type ProviderImageResult } from "./pexels";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export type ImageSearchResult =
  | { allowed: true; results: ProviderImageResult[] }
  | { allowed: false; upgradeUrl: string };

function cacheKeyFor(query: string, orientation: string): string {
  return `pexels:${query.trim().toLowerCase()}:${orientation}`;
}

// Cache reads/writes are fully global (clientId: null) — Pexels results
// aren't tenant-specific, so sharing them across every tenant maximizes
// cache value and minimizes provider calls platform-wide.
export async function searchImages(
  clientId: string,
  query: string,
  orientation: "landscape" | "portrait" | "square" | "any" = "any",
): Promise<ImageSearchResult> {
  const cacheKey = cacheKeyFor(query, orientation);

  const cached = await prisma.imageCache.findUnique({ where: { cacheKey } });
  if (cached && cached.expiresAt > new Date()) {
    return { allowed: true, results: cached.results as unknown as ProviderImageResult[] };
  }

  const gate: UsageCheckResult = await checkAndIncrement(clientId, "image_searches");
  if (!gate.allowed) {
    return { allowed: false, upgradeUrl: gate.upgradeUrl };
  }

  const startedAt = Date.now();
  try {
    const results = await searchPexels(query, orientation === "any" ? undefined : orientation);

    await Promise.all([
      prisma.imageCache.upsert({
        where: { cacheKey },
        create: {
          cacheKey,
          clientId: null,
          provider: "pexels",
          query,
          orientation,
          results: results as unknown as object,
          expiresAt: new Date(Date.now() + CACHE_TTL_MS),
        },
        update: {
          results: results as unknown as object,
          expiresAt: new Date(Date.now() + CACHE_TTL_MS),
        },
      }),
      prisma.generationLog.create({
        data: {
          clientId,
          metric: "image_searches",
          durationMs: Date.now() - startedAt,
          success: true,
        },
      }),
    ]);

    return { allowed: true, results };
  } catch (error) {
    await Promise.all([
      decrementUsage(clientId, "image_searches"),
      prisma.generationLog.create({
        data: {
          clientId,
          metric: "image_searches",
          durationMs: Date.now() - startedAt,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        },
      }),
    ]);
    throw error;
  }
}
