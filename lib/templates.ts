import type { Template, TemplateVersion } from "@prisma/client";
import { prisma } from "@/lib/db";
import { renderEditorHtml } from "@/lib/editor";
import type { EditorState } from "@/types/editor";

const DEFAULT_CATEGORY = "custom";

export type SaveTemplateInput = {
  clientId: string;
  templateId?: string;
  name: string;
  editorState: EditorState;
  changeNote?: string;
  category?: string;
};

export type SaveTemplateResult =
  | { ok: true; template: Template; version: TemplateVersion }
  | { ok: false; reason: "not_found" };

// Shared ownership check used by every templates/[id]* route — a template
// belonging to another tenant (or a soft-deleted one) is indistinguishable
// from a missing one, matching the 404-not-403 convention already used for
// MediaAsset (see app/api/v1/clients/[clientId]/media/[assetId]/route.ts).
export async function getOwnedTemplate(clientId: string, id: string): Promise<Template | null> {
  return prisma.template.findFirst({ where: { id, clientId, deletedAt: null } });
}

// Atomic per the runbook's explicit pitfall ("do not save a partial template
// state"): renderEditorHtml() is pure/synchronous and runs before the
// transaction opens, and the caller validates editorState with
// lib/validation/templates.ts's editorStateSchema before this is ever
// called, so a malformed request never reaches the DB. The new version
// number always comes from the update's own returned `currentVersion`
// (never a separate read-then-write) to avoid a race between concurrent saves.
export async function saveTemplateVersion(input: SaveTemplateInput): Promise<SaveTemplateResult> {
  const { clientId, templateId, name, editorState, changeNote, category } = input;
  const htmlContent = renderEditorHtml(editorState);
  const editorStateJson = editorState as unknown as object;

  return prisma.$transaction(async (tx) => {
    if (templateId) {
      const existing = await tx.template.findFirst({ where: { id: templateId, clientId } });
      if (!existing) {
        return { ok: false, reason: "not_found" };
      }

      const updated = await tx.template.update({
        where: { id: templateId },
        data: {
          name,
          editorState: editorStateJson,
          htmlContent,
          currentVersion: { increment: 1 },
        },
      });

      const version = await tx.templateVersion.create({
        data: {
          templateId: updated.id,
          version: updated.currentVersion,
          editorState: editorStateJson,
          htmlContent,
          changeNote,
        },
      });

      return { ok: true, template: updated, version };
    }

    const created = await tx.template.create({
      data: {
        clientId,
        name,
        category: category ?? DEFAULT_CATEGORY,
        editorState: editorStateJson,
        htmlContent,
        currentVersion: 1,
        isLibrary: false,
      },
    });

    const version = await tx.templateVersion.create({
      data: {
        templateId: created.id,
        version: 1,
        editorState: editorStateJson,
        htmlContent,
        changeNote,
      },
    });

    return { ok: true, template: created, version };
  });
}
