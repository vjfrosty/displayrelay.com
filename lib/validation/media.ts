import { z } from "zod";

export const mediaQuerySchema = z.object({
  folder: z.string().uuid().optional(),
  search: z.string().optional(),
  sort: z.enum(["name", "createdAt", "sizeBytes"]).default("createdAt"),
  page: z.coerce.number().int().min(1).default(1),
});

export const createFolderSchema = z.object({
  name: z.string().trim().min(1).max(200),
  parentId: z.string().uuid().nullable().optional(),
});
