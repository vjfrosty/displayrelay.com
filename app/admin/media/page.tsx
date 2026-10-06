import { getSession } from "@/lib/auth";
import { MediaManager } from "./MediaManager";

export default async function AdminMediaPage() {
  const session = await getSession();

  if (!session?.user?.clientId) {
    return (
      <main className="shell">
        <section className="panel">
          <p className="eyebrow">Media</p>
          <h1 className="title">No tenant selected</h1>
          <p className="lead">
            Media management needs a tenant client. Super-admin accounts aren&apos;t tied to a
            single client yet — sign in as a tenant admin to manage media.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="panel">
        <p className="eyebrow">Media</p>
        <h1 className="title">Media Library</h1>
        <p className="lead">Upload images, video, and PDFs for use in playlists and slides.</p>
        <MediaManager clientId={session.user.clientId} />
      </section>
    </main>
  );
}
