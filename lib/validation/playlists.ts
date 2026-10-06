import { z } from "zod";

export const PLAYLIST_ITEM_TYPES = ["media_asset", "template", "web_link", "stream_url", "google_reviews"] as const;

export const createPlaylistSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(1000).optional(),
});

export const updatePlaylistSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    description: z.string().max(1000).nullable(),
  })
  .partial();

export const playlistQuerySchema = z.object({
  status: z.enum(["draft", "published"]).optional(),
});

export const createPlaylistItemSchema = z
  .object({
    itemType: z.enum(PLAYLIST_ITEM_TYPES),
    resourceId: z.string().uuid().optional(),
    config: z.record(z.string(), z.unknown()).optional(),
    displayDurationSecs: z.number().int().positive().optional(),
  })
  .superRefine((data, ctx) => {
    if ((data.itemType === "media_asset" || data.itemType === "template") && !data.resourceId) {
      ctx.addIssue({ code: "custom", message: "resourceId is required for this itemType", path: ["resourceId"] });
    }
    if (data.itemType === "web_link" || data.itemType === "stream_url") {
      const url = data.config?.url;
      if (typeof url !== "string" || url.length === 0) {
        ctx.addIssue({ code: "custom", message: "config.url is required for this itemType", path: ["config", "url"] });
      }
    }
  });

export const updatePlaylistItemSchema = z
  .object({
    displayDurationSecs: z.number().int().positive(),
    order: z.number().int(),
    config: z.record(z.string(), z.unknown()),
  })
  .partial();

export const assignPlaylistSchema = z.object({
  screenId: z.string().uuid(),
});
