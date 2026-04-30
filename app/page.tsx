import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="panel">
        <p className="eyebrow">Phase 1 Bootstrap</p>
        <h1 className="title">Display Relay is now bootstrapped for infrastructure work.</h1>
        <p className="lead">
          This initial slice adds the minimal Next.js runtime, Docker build path, and
          infrastructure entry points required to begin Task 1.1 cleanly.
        </p>
        <div className="grid">
          <article className="card">
            <h2>Runtime</h2>
            <p>Next.js 16, React 19, TypeScript 6, and pnpm 10 are pinned for the project.</p>
          </article>
          <article className="card">
            <h2>Infrastructure</h2>
            <p>The Dockerfile, compose stack, and Nginx proxy now exist under the documented paths.</p>
          </article>
          <article className="card">
            <h2>Next Up</h2>
            <ul>
              <li>Install dependencies and generate the pnpm lockfile.</li>
              <li>Run the first compose validation once Docker Desktop is available.</li>
              <li>Move into Prisma schema work for Task 1.2.</li>
            </ul>
          </article>
        </div>
        <div className="action-row">
          <Link className="button" href="/admin">
            Open Admin Placeholder
          </Link>
          <a className="button secondary" href="/api/health">
            Check Health Endpoint
          </a>
        </div>
      </section>
    </main>
  );
}
