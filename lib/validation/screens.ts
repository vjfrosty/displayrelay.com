import { z } from "zod";

export const createScreenSchema = z.object({
  name: z.string().trim().min(1).max(200),
  pairingCode: z.string().regex(/^\d{6}$/, "Pairing code must be 6 digits"),
});

export const updateScreenSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    tags: z.array(z.string()),
    location: z.string().trim().max(200).nullable(),
    space: z.string().trim().max(200).nullable(),
    screenType: z.string().trim().max(100).nullable(),
    orientation: z.enum(["landscape", "portrait"]),
  })
  .partial();
