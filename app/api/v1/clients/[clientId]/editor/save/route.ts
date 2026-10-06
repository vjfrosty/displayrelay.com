import { NextResponse, type NextRequest } from "next/server";
import { withClientAuth } from "@/lib/withClientAuth";
import { saveTemplateVersion } from "@/lib/templates";
import { editorSaveSchema } from "@/lib/validation/templates";

export const POST = withClientAuth(async (req: NextRequest, { clientId }) => {
  const body = await req.json().catch(() => null);
  const parsed = editorSaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await saveTemplateVersion({ clientId, ...parsed.data });
  if (!result.ok) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json({ template: result.template, version: result.version });
});
