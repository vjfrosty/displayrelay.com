import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { redis } from "./redis";

const SETTING_CACHE_TTL_SECONDS = 300;

function settingCacheKey(key: string, clientId?: string): string {
  return clientId ? `setting:${clientId}:${key}` : `setting:global:${key}`;
}

// Tenant override wins over the global default.
export async function getSetting(key: string, clientId?: string): Promise<Prisma.JsonValue> {
  const cacheKey = settingCacheKey(key, clientId);
  const cached = await redis.get(cacheKey);
  if (cached !== null) return JSON.parse(cached) as Prisma.JsonValue;

  if (clientId) {
    const override = await prisma.tenantSetting.findUnique({
      where: { clientId_key: { clientId, key } },
    });
    if (override) {
      await redis.setex(cacheKey, SETTING_CACHE_TTL_SECONDS, JSON.stringify(override.value));
      return override.value;
    }
  }

  const global = await prisma.appSetting.findUnique({ where: { key } });
  const value: Prisma.JsonValue = global?.value ?? null;
  await redis.setex(cacheKey, SETTING_CACHE_TTL_SECONDS, JSON.stringify(value));
  return value;
}

export async function setSetting(key: string, value: Prisma.InputJsonValue, clientId?: string): Promise<void> {
  if (clientId) {
    await prisma.tenantSetting.upsert({
      where: { clientId_key: { clientId, key } },
      create: { clientId, key, value },
      update: { value },
    });
  } else {
    await prisma.appSetting.update({ where: { key }, data: { value } });
  }
  await redis.del(settingCacheKey(key, clientId));
}
