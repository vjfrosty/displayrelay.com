import { prisma } from "./db";
import { redis } from "./redis";

const PLAN_CACHE_TTL_SECONDS = 300;
const BILLING_URL = "/admin/settings/billing";
const DEFAULT_PLAN_SLUG = "essential";

export type UsageMetric =
  | "screens"
  | "media_storage_mb"
  | "playlists"
  | "schedules"
  | "ai_slides"
  | "ai_decks"
  | "ai_announcements"
  | "ai_schedule_suggestions"
  | "image_searches"
  | "template_saves"
  | "shared_template_publishes"
  | "ai_content_library_items"
  | "webhooks"
  | "workflow_rules";

export type FeatureFlag = "google_reviews" | "weather_rules" | "google_calendar" | "video_wall" | "all_zone_layouts";

type PlanConfig = {
  slug: string;
  limits: Record<string, number>;
  features: Record<string, boolean>;
};

export type UsageCheckResult =
  | { allowed: true; current: number; limit: number }
  | { allowed: false; current: number; limit: number; upgradeUrl: string };

export type UsageSummaryEntry = { metric: string; current: number; limit: number };

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

// Plan limits are cached for 5 minutes — a plan upgrade can appear stale for
// up to that long. Documented tradeoff, not a bug.
async function getClientPlan(clientId: string): Promise<PlanConfig> {
  const cacheKey = `plan:${clientId}`;
  const cached = await redis.get(cacheKey);
  if (cached !== null) return JSON.parse(cached) as PlanConfig;

  const subscription = await prisma.subscription.findUnique({ where: { clientId } });
  const planSlug = subscription?.planSlug ?? DEFAULT_PLAN_SLUG;

  const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
  if (!plan) throw new Error(`Plan not found: ${planSlug}`);

  const config: PlanConfig = {
    slug: plan.slug,
    limits: plan.limits as Record<string, number>,
    features: plan.features as Record<string, boolean>,
  };

  await redis.setex(cacheKey, PLAN_CACHE_TTL_SECONDS, JSON.stringify(config));
  return config;
}

async function getCount(clientId: string, metric: UsageMetric, period: string): Promise<number> {
  const record = await prisma.usageRecord.findUnique({
    where: { clientId_metric_period: { clientId, metric, period } },
  });
  return record?.count ?? 0;
}

async function increment(clientId: string, metric: UsageMetric, period: string): Promise<void> {
  await prisma.usageRecord.upsert({
    where: { clientId_metric_period: { clientId, metric, period } },
    create: { clientId, metric, period, count: 1 },
    update: { count: { increment: 1 } },
  });
}

export async function checkAndIncrement(clientId: string, metric: UsageMetric): Promise<UsageCheckResult> {
  const period = currentPeriod();
  const plan = await getClientPlan(clientId);
  const limit = plan.limits[metric] ?? 0;

  if (limit === -1) {
    await increment(clientId, metric, period);
    const current = await getCount(clientId, metric, period);
    return { allowed: true, current, limit };
  }

  const current = await getCount(clientId, metric, period);
  if (current >= limit) {
    return { allowed: false, current, limit, upgradeUrl: BILLING_URL };
  }

  await increment(clientId, metric, period);
  return { allowed: true, current: current + 1, limit };
}

export async function checkFeature(clientId: string, feature: FeatureFlag): Promise<boolean> {
  const plan = await getClientPlan(clientId);
  return plan.features[feature] === true;
}

// Rolls back a usage count after a failed outbound call. Never goes below 0.
export async function decrementUsage(clientId: string, metric: UsageMetric): Promise<void> {
  const period = currentPeriod();
  await prisma.usageRecord.updateMany({
    where: { clientId, metric, period, count: { gt: 0 } },
    data: { count: { decrement: 1 } },
  });
}

// Storage is a cumulative total (bytes actually stored), not a monthly
// counter — checkAndIncrement()'s period-reset model doesn't fit. Sums
// existing MediaAsset.sizeBytes instead of tracking a separate UsageRecord.
export async function checkStorageQuota(clientId: string, additionalBytes: number): Promise<UsageCheckResult> {
  const plan = await getClientPlan(clientId);
  const limitMb = plan.limits.media_storage_mb ?? 0;

  const usage = await prisma.mediaAsset.aggregate({
    where: { clientId },
    _sum: { sizeBytes: true },
  });
  const currentMb = Number(usage._sum.sizeBytes ?? 0n) / (1024 * 1024);
  const projectedMb = currentMb + additionalBytes / (1024 * 1024);

  if (limitMb === -1) {
    return { allowed: true, current: Math.round(projectedMb), limit: -1 };
  }
  if (projectedMb > limitMb) {
    return { allowed: false, current: Math.round(currentMb), limit: limitMb, upgradeUrl: BILLING_URL };
  }
  return { allowed: true, current: Math.round(projectedMb), limit: limitMb };
}

export async function getUsageSummary(clientId: string): Promise<UsageSummaryEntry[]> {
  const period = currentPeriod();
  const plan = await getClientPlan(clientId);
  const records = await prisma.usageRecord.findMany({ where: { clientId, period } });
  const currentByMetric = new Map(records.map((r) => [r.metric, r.count]));

  return Object.entries(plan.limits).map(([metric, limit]) => ({
    metric,
    current: currentByMetric.get(metric) ?? 0,
    limit,
  }));
}
