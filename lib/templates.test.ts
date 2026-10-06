import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { getOwnedTemplate, saveTemplateVersion } from "./templates";
import { editorStateSchema } from "./validation/templates";
import type { EditorState } from "@/types/editor";

const clientIds: string[] = [];
const templateIds: string[] = [];

async function createClient(name: string): Promise<string> {
  const client = await prisma.client.create({ data: { name } });
  clientIds.push(client.id);
  return client.id;
}

function stateWithLabel(label: string): EditorState {
  return {
    version: 1,
    width: 1920,
    height: 1080,
    orientation: "landscape",
    background: { type: "color", value: "#000000" },
    blocks: [
      {
        id: "text-1",
        type: "text",
        x: 10,
        y: 10,
        width: 50,
        height: 20,
        zIndex: 1,
        locked: false,
        visible: true,
        props: {
          content: label,
          fontSize: 32,
          fontWeight: "600",
          fontFamily: "sans-serif",
          color: "#fff",
          align: "left",
          lineHeight: 1.2,
        },
      },
    ],
    meta: { duration: 8, transition: "fade" },
  };
}

afterAll(async () => {
  await prisma.templateVersion.deleteMany({ where: { templateId: { in: templateIds } } });
  await prisma.template.deleteMany({ where: { id: { in: templateIds } } });
  await prisma.client.deleteMany({ where: { id: { in: clientIds } } });
  await prisma.$disconnect();
});

describe("saveTemplateVersion", () => {
  it("creates a Template and TemplateVersion 1 for a new template", async () => {
    const clientId = await createClient("Templates Test - new");
    const result = await saveTemplateVersion({
      clientId,
      name: "My Slide",
      editorState: stateWithLabel("v1"),
      category: "custom",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    templateIds.push(result.template.id);

    expect(result.template.currentVersion).toBe(1);
    expect(result.version.version).toBe(1);

    const versions = await prisma.templateVersion.findMany({ where: { templateId: result.template.id } });
    expect(versions).toHaveLength(1);
  });

  it("increments to version 2 on a second save, leaving version 1 untouched", async () => {
    const clientId = await createClient("Templates Test - increment");
    const first = await saveTemplateVersion({ clientId, name: "My Slide", editorState: stateWithLabel("v1") });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    templateIds.push(first.template.id);

    const second = await saveTemplateVersion({
      clientId,
      templateId: first.template.id,
      name: "My Slide",
      editorState: stateWithLabel("v2"),
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;

    expect(second.template.currentVersion).toBe(2);
    expect(second.version.version).toBe(2);

    const v1 = await prisma.templateVersion.findUnique({
      where: { templateId_version: { templateId: first.template.id, version: 1 } },
    });
    expect((v1?.editorState as unknown as EditorState).blocks[0].props).toMatchObject({ content: "v1" });

    const allVersions = await prisma.templateVersion.findMany({ where: { templateId: first.template.id } });
    expect(allVersions).toHaveLength(2);
  });

  it("restoring an old version creates a new version on top, never rewinding currentVersion", async () => {
    const clientId = await createClient("Templates Test - restore");
    const v1 = await saveTemplateVersion({ clientId, name: "My Slide", editorState: stateWithLabel("original") });
    expect(v1.ok).toBe(true);
    if (!v1.ok) return;
    templateIds.push(v1.template.id);

    await saveTemplateVersion({
      clientId,
      templateId: v1.template.id,
      name: "My Slide",
      editorState: stateWithLabel("edited"),
    });

    const restored = await saveTemplateVersion({
      clientId,
      templateId: v1.template.id,
      name: "My Slide",
      editorState: stateWithLabel("original"),
      changeNote: "Restored from version 1",
    });
    expect(restored.ok).toBe(true);
    if (!restored.ok) return;

    expect(restored.template.currentVersion).toBe(3);
    expect(restored.version.version).toBe(3);
    expect((restored.version.editorState as unknown as EditorState).blocks[0].props).toMatchObject({
      content: "original",
    });
  });

  it("returns not_found for a templateId belonging to another tenant", async () => {
    const ownerId = await createClient("Templates Test - owner");
    const attackerId = await createClient("Templates Test - attacker");
    const created = await saveTemplateVersion({ clientId: ownerId, name: "Owner's Slide", editorState: stateWithLabel("mine") });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    templateIds.push(created.template.id);

    const attempt = await saveTemplateVersion({
      clientId: attackerId,
      templateId: created.template.id,
      name: "Hijacked",
      editorState: stateWithLabel("hijacked"),
    });
    expect(attempt).toEqual({ ok: false, reason: "not_found" });

    const owned = await getOwnedTemplate(attackerId, created.template.id);
    expect(owned).toBeNull();
  });
});

describe("editorStateSchema", () => {
  it("rejects a block with an unknown type before any DB write would happen", () => {
    const invalid = {
      ...stateWithLabel("bad"),
      blocks: [{ ...stateWithLabel("bad").blocks[0], type: "video" }],
    };
    const result = editorStateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects a text block whose props don't match TextBlockProps", () => {
    const invalid = {
      ...stateWithLabel("bad"),
      blocks: [{ ...stateWithLabel("bad").blocks[0], props: { content: "ok" } }],
    };
    const result = editorStateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("accepts a well-formed EditorState", () => {
    const result = editorStateSchema.safeParse(stateWithLabel("fine"));
    expect(result.success).toBe(true);
  });
});
