import { z } from "zod";

const backgroundSchema = z.object({
  type: z.enum(["color", "gradient", "image"]),
  value: z.string(),
});

const commonBlockFields = {
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  zIndex: z.number(),
  locked: z.boolean(),
  visible: z.boolean(),
};

const textBlockSchema = z.object({
  ...commonBlockFields,
  type: z.literal("text"),
  props: z.object({
    content: z.string(),
    fontSize: z.number(),
    fontWeight: z.string(),
    fontFamily: z.string(),
    color: z.string(),
    align: z.enum(["left", "center", "right"]),
    lineHeight: z.number(),
  }),
});

const imageBlockSchema = z.object({
  ...commonBlockFields,
  type: z.literal("image"),
  props: z.object({
    src: z.string(),
    objectFit: z.enum(["cover", "contain", "fill"]),
    attribution: z.string().optional(),
    pexelsId: z.string().optional(),
    provider: z.enum(["pexels", "pixabay", "openverse", "upload"]).optional(),
  }),
});

const shapeBlockSchema = z.object({
  ...commonBlockFields,
  type: z.literal("shape"),
  props: z.object({
    shape: z.enum(["rectangle", "circle", "line"]),
    fill: z.string(),
    stroke: z.string().optional(),
    radius: z.number().optional(),
  }),
});

const logoBlockSchema = z.object({
  ...commonBlockFields,
  type: z.literal("logo"),
  props: z.object({
    scale: z.number().optional(),
    position: z.string().optional(),
  }),
});

const editorBlockSchema = z.discriminatedUnion("type", [textBlockSchema, imageBlockSchema, shapeBlockSchema, logoBlockSchema]);

export const editorStateSchema = z.object({
  version: z.number(),
  width: z.number(),
  height: z.number(),
  orientation: z.enum(["landscape", "portrait"]),
  background: backgroundSchema,
  blocks: z.array(editorBlockSchema),
  meta: z.object({
    duration: z.number(),
    transition: z.enum(["none", "fade", "slide"]),
  }),
});

export const editorSaveSchema = z.object({
  templateId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(200),
  editorState: editorStateSchema,
  changeNote: z.string().max(500).optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1),
  editorState: editorStateSchema,
});

export const updateTemplateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  category: z.string().trim().min(1).optional(),
  vertical: z.string().trim().nullable().optional(),
  orientation: z.enum(["horizontal", "vertical"]).optional(),
});

export const templateQuerySchema = z.object({
  library: z.coerce.boolean().optional(),
  category: z.string().optional(),
  orientation: z.enum(["horizontal", "vertical"]).optional(),
  vertical: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(["newest", "rating", "uses"]).default("newest"),
});
