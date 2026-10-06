# Display Relay — Plans & Recommendations

What needs to happen next, in order, plus a few research-backed
recommendations. This file is advisory — nothing here has been applied to the
code. For the authoritative task sequence and acceptance gates, always defer
to [docs/phases/ORCHESTRATOR.md](docs/phases/ORCHESTRATOR.md).

## Immediate Next Steps (unblock Phase 1)

1. **Get a working Docker environment.** This is the single blocker for
   everything else. Run:
   ```
   docker compose -f docker/docker-compose.yml up -d
   docker compose -f docker/docker-compose.yml ps   # expect 6 services healthy
   curl localhost:9001   # MinIO console
   curl localhost:6001   # Soketi
   ```
2. **Populate `.env.local`** from [.env.example](.env.example) (see [SETTINGS.md](SETTINGS.md) for the full variable reference) — secrets like `NEXTAUTH_SECRET`, `OPENROUTER_API_KEY`, Stripe keys need real values before Task 1.5/1.6/5.x/6.2 can work end-to-end, but placeholders are fine to unblock 1.2–1.4.
3. **Run the initial migration:**
   ```
   corepack pnpm@10.33.2 prisma migrate dev --name init --config=./prisma.config.ts
   ```
4. Close out Task 1.2, then proceed straight through 1.3 → 1.6 per the `Infrastructure` and `Auth` agent personas — these six tasks are the foundation everything else depends on (tenant scoping, settings/prompt resolution, usage gates).
5. Write `docs/phases/results/phase-1-result.md` once the Phase 1 gate passes (tenant isolation, prompt-from-DB, cache invalidation, usage-gate behavior all verified — checklist in [docs/phases/results/README.md](docs/phases/results/README.md)).

## Sequencing After Phase 1

Follow the dependency chain already encoded in the orchestrator — it's sound
and shouldn't be reordered:

- **Phase 2** (screens + media) unlocks the pairing flow and MinIO uploads that Phase 3's editor and Phase 4's TV renderer both need.
- **Phase 3** (slide editor) must land before Phase 4, since playlists reference templates/decks built in the editor.
- **Phase 4** (playlists + real-time) is the first phase where the TV-facing side of the product becomes testable end-to-end.
- **Phase 5** (AI pipeline) and **Phase 6** (settings UI + billing) are the two phases that make the DB-driven config philosophy (Section 5 of the architecture doc) actually visible/editable to users — until then it's schema-only.

No phase should start before the prior phase's completion gate passes — the gates are listed per-phase in the orchestrator and are strict for good reason (e.g., Phase 3 requires XSS sanitization verified before Phase 4 exposes rendered slides on real TVs).

## Research-Backed Recommendations

Checked against current (August 2026) public information before writing this:

### 1. Soketi's maintenance is a real risk — worth a decision point before Phase 4

Soketi (the self-hosted Pusher-protocol server this stack pins for real-time)
has maintainers who openly describe their available time for releases and
support as limited, and the community has produced **Sockudo**, a Rust
rewrite aimed at being a more actively maintained, higher-performance
replacement with the same Pusher wire protocol. **Laravel Reverb** is another
actively maintained alternative but is Laravel-first, less natural fit here.

Recommendation: don't block Phase 1 on this, but before starting **Task 4.2
(SSE gateway)** — the task most coupled to the real-time backend — spend an
hour evaluating whether to stay on Soketi or swap to Sockudo. Because both
speak the Pusher protocol, the client-side integration code should be
unaffected either way, so this is a low-cost decision to defer, not one to
make blind now.

### 2. Next.js pin — resolved, one follow-up remains

**Update (2026-08-21):** bumped from `16.2.4` to `16.3.2` (latest stable at
the time) as part of a Phase 1 follow-up fix pass. Verified via
`pnpm typecheck`, `pnpm build`, `pnpm test`, and a full Docker rebuild — all
clean. Also renamed `middleware.ts` → `proxy.ts` in the same pass (Next.js
16.1 convention).

**New follow-up:** Vercel has a security release scheduled for
**2026-08-26** (`16.3.3`, one critical-severity CVE, details not yet
published). Bump again once it ships — can't install a version that doesn't
exist yet.

### 3. Re-run the stack security assessment once real dependencies exist

[docs/tech-stack-assessment.md](docs/tech-stack-assessment.md) is explicitly
a **design-time** assessment — it was written before `package.json` or a
lockfile existed, so it could only reason from declared versions, not actual
resolved dependency trees. Once Phase 1 produces a real `pnpm-lock.yaml` with
the full dependency graph (NextAuth, Prisma, and their transitive deps), an
`npm audit`/`osv-scanner`-style pass against the *actual* lockfile will be far
more precise than the keyword-based NVD/OSV check that doc relies on today.
Good candidate for a Phase 1 wrap-up follow-up item, not a blocker.

### 4. NextAuth version note

The pinned `next-auth@4.24.14` is the v4 line. NextAuth v5 (Auth.js) is the
actively developed line with a different API surface (`auth()` helper vs.
`getServerSession`). Since Task 1.5 hasn't started, this is worth a deliberate
choice now rather than migrating later — v4 is stable and well-documented for
the bearer-token + tenant-scoping pattern this project needs, but confirm the
team isn't defaulting to v4 purely out of the doc being written in early 2026
before checking whether v5's stability has improved enough to prefer it.

## Longer-Term / Post-Phase-6 Watchlist

Not urgent, but worth keeping in view once the core product ships:

- **Video wall builder** (P4, Section 3.1) — explicitly deferred in the architecture doc, no schema support yet.
- **n8n workflow automation** and **AI content library (200+ items)** — both P2, both depend on the AI pipeline (Phase 5) being solid first.
- **Enterprise tier custom limits** — `Plan.limits`/`Plan.features` are JSON, so this should be config, not code, but worth a manual QA pass once billing (Task 6.2) lands.

---

Sources consulted for the recommendations above:
- [Soketi alternatives issue — Sockudo announcement](https://github.com/soketi/soketi/issues/1302)
- [Laravel Reverb vs Pusher vs Soketi comparison](https://hafiz.dev/blog/laravel-reverb-vs-pusher-vs-soketi-websocket-comparison)
- [Next.js 16 blog post](https://nextjs.org/blog/next-16)
- [Next.js Version 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
