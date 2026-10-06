import { prisma } from "./db";

// clientId is required (non-nullable) on these models — safe to auto-scope every operation.
// Template, ImageCache, and AiContentLibrary have a *nullable* clientId where null means
// globally shared (library templates, shared image-search cache, shared content library).
// Blanket-injecting clientId would hide legitimate shared rows from every tenant, so those
// three are excluded here and need bespoke "mine OR global" scoping in their own route
// handlers instead (Phase 3 for Template, Phase 5 for ImageCache/AiContentLibrary).
const SCOPED_MODELS = new Set([
  "UsageRecord",
  "GenerationLog",
  "TenantSetting",
  "TenantPromptOverride",
  "FeatureFlagOverride",
  "Screen",
  "MediaFolder",
  "MediaAsset",
  "Playlist",
  "PlaylistItem",
  "Schedule",
  "ScheduleSlot",
  "TemplateRating",
  "TemplateFavourite",
  "Deck",
  "Slide",
  "AppIntegration",
  "Availability",
  "ScheduleEntry",
  "ResourceCalendar",
  "WebhookEvent",
  "WorkflowRule",
  "ApiToken",
  "ClientBranding",
  "Subscription",
]);

const SCOPED_OPERATIONS = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "count",
  "aggregate",
  "groupBy",
]);

// Models with a *nullable* clientId (null = globally shared). scopedPrisma()
// refuses to touch these rather than silently returning every tenant's rows —
// use mineOrGlobalWhere() with the raw prisma client instead.
const MINE_OR_GLOBAL_MODELS = new Set(["Template", "ImageCache", "AiContentLibrary"]);

// Auto-injects `where: { clientId }` for reads and writes on every tenant-owned model.
export function scopedPrisma(clientId: string) {
  return prisma.$extends({
    name: "tenant-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (MINE_OR_GLOBAL_MODELS.has(model) && SCOPED_OPERATIONS.has(operation)) {
            throw new Error(
              `scopedPrisma() does not support "${model}" — it has a nullable clientId ` +
                `(null = globally shared). Use mineOrGlobalWhere(clientId) with the raw ` +
                `prisma client instead.`,
            );
          }
          if (SCOPED_MODELS.has(model) && SCOPED_OPERATIONS.has(operation)) {
            const scopedArgs = args as { where?: Record<string, unknown> };
            scopedArgs.where = { ...scopedArgs.where, clientId };
          }
          return query(args);
        },
      },
    },
  });
}

// For models with a nullable clientId where null means globally shared
// (Template, ImageCache, AiContentLibrary). Merge this into your own `where`
// object with the raw prisma client — these three are excluded from scopedPrisma().
export function mineOrGlobalWhere(clientId: string) {
  return { OR: [{ clientId }, { clientId: null }] };
}
