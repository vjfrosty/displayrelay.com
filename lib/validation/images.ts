import { z } from "zod";

export const imageSearchQuerySchema = z.object({
  query: z.string().trim().min(1),
  orientation: z.enum(["landscape", "portrait", "square"]).optional(),
});
