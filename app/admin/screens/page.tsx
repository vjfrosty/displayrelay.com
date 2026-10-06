import { getSession } from "@/lib/auth";
import { ScreensManager } from "./ScreensManager";

type PageProps = {
  searchParams: Promise<{ pairingCode?: string }>;
};

export default async function AdminScreensPage({ searchParams }: PageProps) {
  const session = await getSession();
  const { pairingCode } = await searchParams;

  if (!session?.user?.clientId) {
    return (
      <main className="shell">
        <section className="panel">
          <p className="eyebrow">Screens</p>
          <h1 className="title">No tenant selected</h1>
          <p className="lead">
            Screen management needs a tenant client. Super-admin accounts aren&apos;t tied to a
            single client yet — sign in as a tenant admin to manage screens.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="panel">
        <p className="eyebrow">Screens</p>
        <h1 className="title">Screens</h1>
        <p className="lead">
          Pair a new screen using the code shown on the TV at <code>/pair</code>, then manage it here.
        </p>
        <ScreensManager clientId={session.user.clientId} initialPairingCode={pairingCode ?? ""} />
      </section>
    </main>
  );
}
