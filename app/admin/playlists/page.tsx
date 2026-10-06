import { getSession } from "@/lib/auth";
import { PlaylistsManager } from "./PlaylistsManager";

export default async function AdminPlaylistsPage() {
  const session = await getSession();

  if (!session?.user?.clientId) {
    return (
      <main className="shell">
        <section className="panel">
          <p className="eyebrow">Playlists</p>
          <h1 className="title">No tenant selected</h1>
          <p className="lead">
            Playlist management needs a tenant client. Super-admin accounts aren&apos;t tied to a
            single client yet — sign in as a tenant admin to manage playlists.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="panel">
        <p className="eyebrow">Playlists</p>
        <h1 className="title">Playlists</h1>
        <p className="lead">Create a playlist, add content, then assign it to a screen and publish.</p>
        <PlaylistsManager clientId={session.user.clientId} />
      </section>
    </main>
  );
}
