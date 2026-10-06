import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withClientAuth } from "@/lib/withClientAuth";
import { getOwnedTemplate, saveTemplateVersion } from "@/lib/templates";
import { editorStateSchema } from "@/lib/validation/templates";

type Params = { clientId: string; id: string; version: string };

export const POST = withClientAuth<Params>(async (_req: NextRequest, { clientId, id, version }) => {
  const versionNumber = Number(version);
  if (!Number.isInteger(versionNumber) || versionNumber < 1) {
    return NextResponse.json({ error: "Invalid version" }, { status: 400 });
  }

  const template = await getOwnedTemplate(clientId, id);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const targetVersion = await prisma.templateVersion.findUnique({
    where: { templateId_version: { templateId: id, version: versionNumber } },
  });
  if (!targetVersion) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const parsedState = editorStateSchema.safeParse(targetVersion.editorState);
  if (!parsedState.success) {
    return NextResponse.json({ error: "Stored version is corrupted" }, { status: 500 });
  }

  const result = await saveTemplateVersion({
    clientId,
    templateId: id,
    name: template.name,
    editorState: parsedState.data,
    changeNote: `Restored from version ${versionNumber}`,
  });
  if (!result.ok) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json({ template: result.template, version: result.version });
});
