import { getSession } from "@/lib/auth";
import { PlaylistEditor } from "./PlaylistEditor";

export default async function AdminPlaylistEditorPage({
  params,
}: {
  params: Promise<{ playlistId: string }>;
}) {
  const { playlistId } = await params;
  const session = await getSession();

  if (!session?.user?.clientId) {
    return (
      <main className="shell">
        <section className="panel">
          <p className="eyebrow">Playlists</p>
          <h1 className="title">No tenant selected</h1>
          <p className="lead">Sign in as a tenant admin to edit playlists.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="panel">
        <p className="eyebrow">Playlists</p>
        <h1 className="title">Edit Playlist</h1>
        <PlaylistEditor clientId={session.user.clientId} playlistId={playlistId} />
      </section>
    </main>
  );
}
