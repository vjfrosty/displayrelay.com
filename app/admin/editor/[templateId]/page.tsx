import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getClientBranding } from "@/lib/branding";
import { editorStateSchema } from "@/lib/validation/templates";
import { EditorHarness } from "../EditorHarness";

export default async function AdminEditTemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const session = await getSession();

  if (!session?.user?.clientId) {
    return (
      <main className="shell">
        <section className="panel">
          <p className="eyebrow">Editor</p>
          <h1 className="title">No tenant selected</h1>
          <p className="lead">
            The editor needs a tenant client. Sign in as a tenant admin to edit templates.
          </p>
        </section>
      </main>
    );
  }

  const clientId = session.user.clientId;
  const template = await prisma.template.findFirst({ where: { id: templateId, clientId, deletedAt: null } });
  if (!template) {
    notFound();
  }

  const parsedState = editorStateSchema.safeParse(template.editorState);
  if (!parsedState.success) {
    return (
      <main className="shell">
        <section className="panel">
          <p className="eyebrow">Editor</p>
          <h1 className="title">Template data is corrupted</h1>
          <p className="lead">This template&apos;s stored editorState doesn&apos;t match the expected shape.</p>
        </section>
      </main>
    );
  }

  const branding = await getClientBranding(clientId);

  return (
    <main className="shell">
      <section className="panel">
        <p className="eyebrow">Editor</p>
        <h1 className="title">Slide Editor</h1>
        <p className="lead">
          Editing &ldquo;{template.name}&rdquo; (version {template.currentVersion}). Drag blocks to
          move them, use the corner and edge handles to resize, click a block to edit its
          properties, and press Ctrl+Z / Ctrl+Shift+Z to undo and redo.
        </p>
        <EditorHarness
          clientId={clientId}
          branding={branding}
          initialTemplate={{ id: template.id, name: template.name, editorState: parsedState.data }}
        />
      </section>
    </main>
  );
}
