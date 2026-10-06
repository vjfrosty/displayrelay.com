# Display Relay — Progress Snapshot

This is an analysis-only snapshot written by reviewing the repo as it stands
today. It does not replace [docs/phases/ORCHESTRATOR.md](docs/phases/ORCHESTRATOR.md),
which remains the live, agent-maintained source of truth for current
phase/task — this file exists so a human can see the same picture without
reading the whole runbook chain.

## Headline Status

**Phases 1, 2, and 3 are all complete, and Phase 4 (Playlists, Schedules &
Real-Time) is underway.** Phase 1 built the config/auth/billing-gate
foundation; Phase 2 delivered the first two real end-user features (screen
pairing, media library); Phase 3 delivered a fully working slide editor;
Phase 4 has now started with playlist CRUD, screen assignment, and the
first real Soketi broadcast in the project. 13 of 20 build tasks across 6
phases are complete and live-validated.

| | |
|---|---|
| Current phase | Phase 4 — Playlists, Schedules & Real-Time |
| Current task | Task 4.2 — SSE Gateway — TV Real-Time Connection |
| Blocked by | Nothing — Docker is available in this environment and the stack is running |
| Phases fully complete | 3 of 6 (Phase 1, Phase 2, Phase 3) |
| Phase result docs written | 3 of 6 — [phase-1-result.md](docs/phases/results/phase-1-result.md), [phase-2-result.md](docs/phases/results/phase-2-result.md), [phase-3-result.md](docs/phases/results/phase-3-result.md) |
| Test suite | 77 tests passing across 15 files (`pnpm test`) — unit + live-integration, no mocking of Postgres/Redis/MinIO |

## What Exists Today

| Area | State | Evidence |
|---|---|---|
| Next.js app shell | Boots, 3 routes, **now confirmed reachable end-to-end through nginx in Docker** | [app/page.tsx](app/page.tsx) (bootstrap landing), [app/admin/welcome/page.tsx](app/admin/welcome/page.tsx) (placeholder), [app/api/health/route.ts](app/api/health/route.ts) — `curl localhost/api/health` returns 200 through the full `nginx → app` path |
| Docker Compose stack | **Live-validated.** All 6 services running/healthy | [docker/docker-compose.yml](docker/docker-compose.yml) — postgres/redis/minio host ports remapped to 5433/6380/9010-9011 to avoid conflicting with other Docker projects on this host (nginx 80 and soketi 6001 unchanged); container-internal networking untouched |
| Prisma schema | 36 models (35 + `AdminUser`), **migrations applied to a live Postgres container** | [prisma/schema.prisma](prisma/schema.prisma) — `prisma/migrations/20260821130848_init/` + `.../20260821133959_add_admin_user/` |
| Prisma client access | **`lib/db.ts` singleton established** (Prisma 7 requires an explicit driver adapter — no schema-level `url`, no fallback client construction) | [lib/db.ts](lib/db.ts) — `@prisma/adapter-pg` + `PrismaPg`, dev-mode global caching. Every future `lib/*.ts`/API route must import `prisma` from here |
| Redis client access | **`lib/redis.ts` singleton established** | [lib/redis.ts](lib/redis.ts) — `ioredis`, same dev-mode global caching pattern as `lib/db.ts` |
| Seed data | **Seeded and verified idempotent** (4 plans, 14 app settings, 6 prompt templates, 7 layout-preset templates, 1 super-admin) | [prisma/seed.ts](prisma/seed.ts) — plans/settings/prompts via real `upsert`; layout presets via `deleteMany`+`createMany` (no natural unique key on `Template`) |
| `lib/settings.ts`, `lib/prompts.ts` | **Implemented and tested.** `getSetting`/`setSetting`, `resolvePrompt`/`renderPrompt`, Redis-cached (300s TTL), tenant-override merge with `??` | [lib/settings.ts](lib/settings.ts), [lib/prompts.ts](lib/prompts.ts) |
| Auth / tenant scoping | **Implemented and tested.** NextAuth v4 credentials login, JWT sessions carrying `clientId`/`isSuperAdmin`, `scopedPrisma(clientId)` via Prisma Client Extensions, `withClientAuth`, `/admin/*` route protection | [lib/auth.ts](lib/auth.ts), [lib/tenant.ts](lib/tenant.ts), [lib/withClientAuth.ts](lib/withClientAuth.ts), [middleware.ts](middleware.ts), [app/api/auth/\[...nextauth\]/route.ts](app/api/auth/%5B...nextauth%5D/route.ts) — full login round-trip verified manually via `pnpm dev` |
| `lib/usage.ts` (billing gates) | **Implemented and tested.** `checkAndIncrement`/`checkFeature`/`decrementUsage`/`getUsageSummary`, literal-union metric/feature keys | [lib/usage.ts](lib/usage.ts) — Essential-plan `ai_slides` limit (10 then blocked), `google_reviews` feature flag, rollback-with-floor, full summary all verified against real seeded plans |
| Screen pairing + list (Task 2.1) | **Implemented and tested — first real product feature.** TV displays a 6-digit code + QR at `/pair`; admin claims it at `/admin/screens`; status badges computed live from heartbeat recency | [lib/pairing.ts](lib/pairing.ts), [lib/screens.ts](lib/screens.ts), [app/pair/page.tsx](app/pair/page.tsx), [app/admin/screens/page.tsx](app/admin/screens/page.tsx) — full in-browser walkthrough verified: code generated → claimed → `/pair` auto-detected the claim within one poll cycle → reusing the code correctly rejected |
| Media library (Task 2.2) | **Implemented and tested — Phase 2 complete.** Upload/list/delete against MinIO, MIME/size/quota-gated, root-level only (no folder tree UI yet) | [lib/storage.ts](lib/storage.ts), [app/admin/media/page.tsx](app/admin/media/page.tsx) — verified live: uploaded PNG's thumbnail actually loads through the real nginx→MinIO proxy path, disallowed type → `415`, delete removes the object from MinIO too (checked via `mc ls`, not just the DB) |
| Editor data model + renderer (Task 3.1) | **Implemented and tested.** `EditorState`/`EditorBlock` types, `renderEditorHtml()` — pure function, no UI or infra dependency yet | [types/editor.ts](types/editor.ts), [lib/editor.ts](lib/editor.ts) — 9 tests: sanitization, `{{LOGO_URL}}` placeholder, zIndex ordering, purity, no-mutation |
| Editor canvas — drag/resize/undo (Task 3.2) | **Implemented and tested — interactive, full browser walkthrough verified.** Click-to-select, drag-to-move, 8-directional resize, `Ctrl+Z`/`Ctrl+Shift+Z` undo/redo, all percentage-based | [hooks/useEditorState.ts](hooks/useEditorState.ts), [components/editor/EditorCanvas.tsx](components/editor/EditorCanvas.tsx), [app/admin/editor/page.tsx](app/admin/editor/page.tsx) (temporary test harness, see Residual Risks) — 9 tests against the exported reducer; live drag/resize math verified to match expected percentage formulas exactly |
| Block components + Pexels image search (Task 3.3) | **Implemented and tested — verified live with the real Pexels API, not just the gated-failure path.** Real `TextBlock`/`ImageBlock`/`ShapeBlock`/`LogoBlock`, properties panel, cached + usage-gated image search with auto-attribution, client branding via CSS custom properties | [lib/images/pexels.ts](lib/images/pexels.ts), [lib/images/search.ts](lib/images/search.ts), [components/editor/blocks/](components/editor/blocks/), [components/editor/EditorProperties.tsx](components/editor/EditorProperties.tsx), [components/editor/BrandingContext.tsx](components/editor/BrandingContext.tsx) — 2 new tests (cache-hit skips gating, quota-exhausted blocks before any provider call); live: a real "mountain" search returned 20 Pexels results, selection updated the block and auto-added a locked attribution block, usage/`GenerationLog` rows confirmed directly in Postgres |
| Save flow + template API (Task 3.4) | **Implemented and tested — Phase 3 complete.** Atomic versioned save (`POST /editor/save`), full template CRUD, version list/restore, `editorStateSchema` validation at the HTTP boundary, `/admin/editor/:templateId` load flow | [lib/templates.ts](lib/templates.ts), [lib/validation/templates.ts](lib/validation/templates.ts), [app/api/v1/clients/\[clientId\]/templates/](app/api/v1/clients/%5BclientId%5D/templates/) — 7 new tests; live: save→v1, edit+save→v2 (v1 untouched), restore v1→v3 (matching v1 exactly, `currentVersion` never rewound), both tenant-protection layers confirmed. Thumbnails deliberately `null` (no puppeteer — see Residual Risks) |
| Playlists + Soketi publish (Task 4.1) | **Implemented and tested — first real Soketi usage in the project.** Full playlist CRUD, item management (gap-strategy ordering), screen assignment, publish (broadcasts `playlist.updated`), `/admin/playlists` UI | [lib/soketi.ts](lib/soketi.ts), [lib/playlists.ts](lib/playlists.ts), [app/api/v1/clients/\[clientId\]/playlists/](app/api/v1/clients/%5BclientId%5D/playlists/), [app/admin/playlists/](app/admin/playlists/) — 12 new tests; live (including through the real Docker container, not just the dev build): reorder, duration, assign (screen shows "Playing: {name}"), publish, cross-tenant rejection all verified. Two real bugs found and fixed live (Docker networking, order-swap race — see Residual Risks) |
| SSE gateway, TV renderer, schedules, AI pipeline, settings UI, billing | **Not started** (rest of Phase 4, Phases 5–6) | — |
| Governance docs | Complete and internally consistent | `AGENTS.md`, `.github/agents/*`, `.github/instructions/*`, `docs/phases/*` |

## Phase-by-Phase Checklist

Mirrors [docs/phases/ORCHESTRATOR.md](docs/phases/ORCHESTRATOR.md) Phase Tracking as of this snapshot.

### Phase 1 — Core Infrastructure & Config Layer
- [x] Task 1.1 — Docker Compose Full Stack (live-validated, all 6 services healthy, ports remapped for host conflicts)
- [x] Task 1.2 — Prisma Schema — Core Tables (migration applied live, 35 tables verified)
- [x] Task 1.3 — Prisma Seed File (4 plans, 14 settings, 6 prompts, 7 layout presets — idempotent across 3 runs)
- [x] Task 1.4 — `lib/settings.ts` + `lib/prompts.ts` (Redis-cached, tested)
- [x] Task 1.5 — Auth — NextAuth.js + API Bearer Tokens (`AdminUser` model, `scopedPrisma`, tested, manual login round-trip verified)
- [x] Task 1.6 — `lib/usage.ts` — Billing & Usage Gates (limit/feature/rollback/summary all tested)
- [x] Phase 1 wrap-up report — [phase-1-result.md](docs/phases/results/phase-1-result.md)

### Phase 2 — Screens, Media & Basic Admin UI
- [x] Task 2.1 — Screen Management (pairing + list — full browser walkthrough verified)
- [x] Task 2.2 — Media Library (MinIO upload — full browser walkthrough verified)
- [x] Phase 2 wrap-up report — [phase-2-result.md](docs/phases/results/phase-2-result.md)

### Phase 3 — Slide Editor
- [x] Task 3.1 — `EditorState` type + `lib/editor.ts` renderer (9 tests, no infra dependency)
- [x] Task 3.2 — Editor canvas (React component — drag/resize/undo, 9 tests, full browser walkthrough verified)
- [x] Task 3.3 — Block types (text, image, shape, logo — real Pexels search verified live, 2 tests, full browser walkthrough verified)
- [x] Task 3.4 — Editor save flow + template API (atomic versioning, 7 tests, full browser walkthrough verified)
- [x] Phase 3 wrap-up report — [phase-3-result.md](docs/phases/results/phase-3-result.md)

### Phase 4 — Playlists, Schedules & Real-Time
- [x] Task 4.1 — Playlists CRUD + assignment (Soketi publish, 12 tests, full browser walkthrough verified including through the real Docker container)
- [ ] Task 4.2 — SSE gateway
- [ ] Task 4.3 — TV screen renderer
- [ ] Phase 4 wrap-up report

### Phase 5 — AI Generation Pipeline
- [ ] Task 5.1 — `lib/ai.ts` (OpenRouter integration)
- [ ] Task 5.2 — Slide + announcement generation APIs
- [ ] Task 5.3 — Image search + Pexels provider
- [ ] Phase 5 wrap-up report

### Phase 6 — Settings UI, Billing & Polish
- [ ] Task 6.1 — Admin settings + prompts UI
- [ ] Task 6.2 — Billing (Stripe) + usage dashboard
- [ ] Phase 6 wrap-up report

`[~]` = started but not validated live, per the orchestrator's own status notes.

## Residual Risks (not blockers)

**Resolved (2026-08-21, same day as Phase 1):** three items below were
fixed in a follow-up pass. Kept for context; see
[docs/phases/results/phase-1-result.md](docs/phases/results/phase-1-result.md)
for the full account.

- ~~App-container env split~~ — **Fixed.** `docker/docker-compose.yml`'s
  `app` service now overrides `DATABASE_URL`/`REDIS_URL`/`MINIO_ENDPOINT` to
  the internal compose network names, verified via in-container TCP checks.
  **Also fixed in the same pass:** the `Dockerfile` never ran
  `prisma generate`, so the containerized build had been broken since Task
  1.3 — masked because all validation ran via `pnpm dev`/`pnpm test` on the
  host. Added the missing generate step.
- ~~`scopedPrisma` scoping exception~~ — **Partially fixed.** `Template`/
  `ImageCache`/`AiContentLibrary` still need their Phase 3/5 route-handler
  logic (unchanged scope), but `scopedPrisma()` now **throws** instead of
  silently returning unfiltered cross-tenant rows if called against them —
  closed a real footgun. New `mineOrGlobalWhere(clientId)` helper added for
  Phase 3/5 to use.
- ~~`middleware.ts` deprecation~~ — **Fixed.** Renamed to `proxy.ts`
  (straight rename, default export still supported); verified via the
  running production container that `/admin` still redirects correctly and
  no deprecation warning appears in logs.

**New follow-ups from this pass:**
- `.env.local` is copied into the Docker build context (needed for
  `prisma generate`), bundling a currently-placeholder-only secrets file
  into image layers — worth hardening before real deployment.
- `next` bumped `16.2.4` → `16.3.2`. Vercel has a security release
  scheduled for **2026-08-26** (`16.3.3`, critical CVE) — not out yet, bump
  again once it ships.

**Still open, unchanged:**
- Dev-only super-admin password (`dev-password-change-me`) — pre-deploy
  checklist item, not a code fix.
- Host-specific port remapping — inherent to this dev host, not a bug.
- Soketi's maintenance pace — Phase-4 evaluation item.

**New from Task 2.1 (deliberate scope boundaries, not bugs):**
- `"sleeping"` screen status (operation-hours based) isn't implemented — P2
  per the feature list, and `Screen.operationHours` has no defined shape yet
  anyway. The type/badge exist; nothing produces the state.
- Super-admin accounts (`clientId: null`) can't manage screens — `/admin/screens`
  needs a `clientId` and there's no client-switcher UI yet (Phase 6). Tenant
  admins are unaffected. (Same limitation applies to `/admin/media`, found in Task 2.2.)

**Fixed during Task 2.2:**
- ~~`scopedPrisma()`'s `count()`/`aggregate()`/`groupBy()` weren't scoped~~ —
  **Fixed.** Discovered while building the media list route
  (`scopedPrisma(clientId).mediaAsset.count()` would have silently counted
  every tenant's assets). Added to `SCOPED_OPERATIONS` in `lib/tenant.ts`,
  regression-tested.

**New from Task 2.2 (deliberate scope boundaries, not bugs):**
- No folder CRUD API or tree UI — `/admin/media` is root-level only.
  `MediaFolder` nesting exists at the schema level, unused for now.
- No real thumbnails — images reuse the full-size URL, video/PDF get none.
  Needs an image-resizing/`ffmpeg` dependency not added yet.
- No image dimension/duration capture (`width`/`height`/`durationSecs` stay `null`).

**New from Task 3.1 (deliberate scope boundaries, not bugs):**
- `EditorBlock.type` only supports `text`/`image`/`shape`/`logo` — `qr`/`video`
  are in the architecture doc's type union but have no specified props shape
  anywhere and aren't P1. Add them with a real spec when actually needed.
- ~~Documentation gap found, not yet propagated~~ — **Propagated.** The
  architecture doc's hardcoded `padding-top:56.25%` (16:9, wrong for portrait
  templates) was already fixed in `lib/editor.ts`; Task 3.2 carried the same
  `state.width`/`height`-derived computation into `EditorCanvas.tsx` instead
  of copying the runbook's hardcoded value.

**New from Task 3.2 (deliberate scope boundaries, not bugs):**
- ~~`app/admin/editor/page.tsx` + `EditorHarness.tsx` is a temporary test
  harness~~ — still temporary (Task 3.4 will wire real save/load), but Task
  3.3 filled in the properties panel and real block components it was
  missing. In-memory only, no save, no blocks palette.
- ~~`EditorCanvas`'s block rendering is a minimal read-only approximation~~ —
  **Fixed in Task 3.3.** Real editable `TextBlock`/`ImageBlock`/`ShapeBlock`/
  `LogoBlock` components now render in the canvas.
- No `@testing-library/react`/DOM-rendering test infrastructure exists in
  this project (`vitest.config.mts` is `environment: "node"`) — `useEditorState`'s
  reducer logic is unit-tested directly (exported for that purpose) rather than
  via a mounted-hook test; the actual interactive drag/resize/undo UX was
  verified live in-browser instead (synthetic mouse/pointer event dispatch,
  since precise pixel-delta math needed exact control).

**Fixed during Task 3.3:**
- ~~`vitest.config.mts` had no path-alias resolution configured~~ — **Fixed.**
  `@/`-aliased *value* imports in test files silently never worked (only ever
  masked because the one prior `@/` test import was `import type`-only and
  got erased before resolution mattered). Added `resolve: { tsconfigPaths: true }`.

**New from Task 3.3 (deliberate scope boundaries, not bugs):**
- ~~`app/admin/editor/page.tsx`'s guard tightened from `session?.user` to
  `session?.user?.clientId`~~ — still true (super-admin can't reach the
  editor, same as `/admin/media`/`/admin/screens`), carried forward unchanged
  into Task 3.4.
- Only Pexels is implemented — Pixabay/Openverse (also listed in
  `ImageBlockProps.provider`) are deferred, per the runbook and P1 scope.
- No blocks palette (drag-from-palette) — "Add Text/Shape/Image/Logo Block"
  buttons remain the block-creation UI until a later task builds one.
- **Surprise, not a gap:** `.env.local`'s `PEXELS_API_KEY` is still literally
  `"placeholder"`, but a real key is already in effect via the host
  environment (Next.js never overrides an already-set `process.env` value)
  — image search was verified end-to-end with real results, not documented
  as an unverified gap as originally planned before building it.

**New from Task 3.4 (deliberate scope boundaries, not bugs), Phase 3 complete:**
- No real thumbnail screenshots — `thumbnailUrl` stays `null` for every
  template. The runbook explicitly permits this ("acceptable initially") and
  warns puppeteer would bloat the image (`node:24-bookworm-slim` lacks the
  system libs headless Chromium needs). Same precedent as Task 2.2's media
  thumbnails. Real screenshot generation is a discrete future task.
- No `/admin/templates` browser UI (Section 15.2's two-tab library browser)
  — only the API + the editor's own save/load wiring exist.
- Fork/publish/unpublish/rate/favourite are unimplemented — Section 15.6
  documents them, Task 3.4's own output list doesn't include them. The
  three-tier shared-library model (`isLibrary`, `forkedFromId`,
  `TemplateRating`, `TemplateFavourite`) is schema-ready but has no
  route/UI support yet.

**Fixed during Task 4.1:**
- ~~`SOKETI_HOST` was never overridden for the `app` container~~ — **Fixed.**
  `docker/docker-compose.yml` already overrode `DATABASE_URL`/`REDIS_URL`/
  `MINIO_ENDPOINT` to internal compose hostnames but missed `SOKETI_HOST`;
  `.env.local`'s `localhost` value would have been unreachable from inside
  the container. Verified by an actual successful publish through the
  deployed container, not just a TCP reachability check.
- ~~Reordering playlist items via two parallel `PATCH` calls violated the
  `(playlistId, order)` unique constraint~~ — **Fixed**, caught live in the
  browser walkthrough (not by the automated tests, which only exercise
  `lib/playlists.ts` directly). A first fix attempt using `-Date.now()` as a
  temporary sentinel hit a second bug (`order` is a Postgres `int4` column;
  a millisecond timestamp overflows it). Final fix: a sequential 3-step swap
  through a small fixed sentinel (`-1`).

**New from Task 4.1 (deliberate scope boundaries, not bugs):**
- `/admin/playlists` reorders via up/down buttons, not drag-to-reorder —
  the runbook describes drag-to-reorder; up/down satisfies the actual "Done
  when" criterion (order field updates) without native HTML5 DnD risk.
- No unassign action — only setting a screen's `assignedPlaylistId`, not
  clearing it.
- No schedules (`Schedule`/`ScheduleSlot`) — out of Task 4.1's runbook
  section; that's real-time delivery, not scheduling.

See [PLANS.md](PLANS.md) for the full next-steps sequencing.
