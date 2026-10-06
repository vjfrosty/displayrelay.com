import { getSession } from "@/lib/auth";
import { getClientBranding } from "@/lib/branding";
import { EditorHarness } from "./EditorHarness";

export default async function AdminEditorPage() {
  const session = await getSession();

  if (!session?.user?.clientId) {
    return (
      <main className="shell">
        <section className="panel">
          <p className="eyebrow">Editor</p>
          <h1 className="title">No tenant selected</h1>
          <p className="lead">
            The editor needs a tenant client (branding and image search are tenant-scoped).
            Super-admin accounts aren&apos;t tied to a single client yet — sign in as a tenant
            admin to use the editor.
          </p>
        </section>
      </main>
    );
  }

  const clientId = session.user.clientId;
  const branding = await getClientBranding(clientId);

  return (
    <main className="shell">
      <section className="panel">
        <p className="eyebrow">Editor</p>
        <h1 className="title">Slide Editor</h1>
        <p className="lead">
          Drag blocks to move them, use the corner and edge handles to resize, click a block to
          edit its properties, and press Ctrl+Z / Ctrl+Shift+Z to undo and redo. Click Save to
          create a new template &mdash; the blocks palette and shared-library publishing arrive in
          a later task.
        </p>
        <EditorHarness clientId={clientId} branding={branding} />
      </section>
    </main>
  );
}
