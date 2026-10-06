import Redis from "ioredis";

// Reuse a single connection across hot reloads in dev, same rationale as lib/db.ts.
const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL as string);

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
