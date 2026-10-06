# Display Platform Master Orchestrator

This file is the planning hub for Phases 1-6. Use it to determine what is active, what is blocked, which persona to use, and which phase runbook to open next. Use the phase files for detailed execution instructions.

## Current State

**Current Phase:** Phase 4 - Playlists, Schedules & Real-Time  
**Current Task:** TASK 4.2 - SSE Gateway — TV Real-Time Connection  
**Status:** Task 4.1 complete (playlist CRUD, item management, screen assignment, publish broadcasting a real Soketi event — verified end-to-end including through the actual Docker container — see "Recently Completed" below).  
**Primary Runbook:** `docs/phases/phase-4-playlists-realtime.md`  
**Blocked By:** Nothing. Docker is available in this environment; full stack running.

## Standing Conventions (established in Phase 1, apply to every later task)

- **`lib/db.ts`** — the only place a `PrismaClient` is constructed (Prisma 7 requires an explicit driver `adapter`, no schema-level `url`, no env-var fallback). Always `import { prisma } from "lib/db"`.
- **`lib/redis.ts`** — the only place an `ioredis` client is constructed. Always `import { redis } from "lib/redis"`.
- **`lib/tenant.ts`**'s `scopedPrisma(clientId)` auto-scopes every model with a *required* `clientId`, across `findMany`/`findFirst`/`findFirstOrThrow`/`update`/`updateMany`/`delete`/`deleteMany`/`count`/`aggregate`/`groupBy` (the last three added in Task 2.2 after discovering `count()` wasn't scoped — always check `SCOPED_OPERATIONS` covers whatever Prisma method you're about to call through `scopedPrisma`, don't assume). `Template`, `ImageCache`, and `AiContentLibrary` have a *nullable* `clientId` (null = globally shared) — `scopedPrisma()` **throws** if called against them (a deliberate guardrail, not a bug) — use the exported `mineOrGlobalWhere(clientId)` with the raw `prisma` client for those three instead.
- **Test runner:** `vitest` (`pnpm test`), config at `vitest.config.mts`. Integration tests run against the live seeded Postgres/Redis containers — no mocking infrastructure exists or is planned; follow that pattern for new tests too.
- **Docker port remap:** this host runs other Docker projects on the default ports, so postgres/redis/minio are remapped to `5433`/`6380`/`9010`-`9011` (nginx `80` and soketi `6001` are unchanged). `.env.local` already reflects this. Port `3000` is also occupied — use an alternate port (e.g. `3100`) for any manual `pnpm dev` checks. Note: Turbopack's dev server can hit this shared host's `inotify` instance limit (128, other users' dev servers already consuming it) — if `pnpm dev` fails with "Too many open files," that's host resource contention, not a code bug; verify against the already-running Docker `app` container (`curl localhost/...` through nginx) instead.
- **`proxy.ts`** (renamed from `middleware.ts` — Next.js 16.1 convention) protects `/admin/*`. Default export still works exactly as `middleware.ts` did; `proxy.ts` always runs on the Node.js runtime (never Edge).
- **The `app` Docker image requires `prisma generate` in its build** — the `Dockerfile`'s `builder` stage runs `pnpm exec prisma generate --config=./prisma.config.ts` before `pnpm build`. This was a real, previously-undiscovered gap (the Docker build was broken from Task 1.3 onward, masked because all validation ran via `pnpm dev`/`pnpm test` on the host) — if you add a new Prisma-dependent build step, make sure `prisma generate` still runs before it in the Dockerfile.
- **App-container env split: resolved.** `docker/docker-compose.yml`'s `app` service has an `environment:` block overriding `DATABASE_URL`/`REDIS_URL`/`MINIO_ENDPOINT` to the internal compose network names (`postgres`/`redis`/`minio`), since `.env.local`'s host-mapped values (via `env_file`) aren't reachable from inside the container. Verified via TCP-level reachability checks from inside the running container.
- **Note:** `.env.local` is copied into the Docker build context (`COPY . .` in the `builder` stage; not excluded by `.dockerignore`) so `prisma generate` can load it. This bundles a (currently dev-placeholder-only) secrets file into image layers — worth hardening later (e.g. build-arg-only `DATABASE_URL` for generate, excluding `.env.local` from the image) before any real deployment, but not fixed now — flagged as a new minor follow-up.
- **Pending security patch:** Next.js `16.3.3` (critical-severity CVE fix) is scheduled for **2026-08-26**, not released yet. `next` is currently pinned to `16.3.2` (bumped from `16.2.4`). Bump again once `16.3.3` ships.

Full detail on all of the above, plus per-task validation evidence, lives in `docs/phases/results/phase-1-result.md`.

## Standing Conventions (established in Phase 2 Task 2.1)

- **`lib/withClientAuth.ts` is now generic**, `withClientAuth<P extends { clientId: string }>(...)` — passes the *full* resolved route `params` object through to the handler, not just `clientId`. Needed the moment a nested dynamic segment showed up (`[clientId]/screens/[screenId]`); use `withClientAuth<{ clientId: string; screenId: string }>(...)` (etc.) for any further nested routes.
- **Pairing flow (TV displays code, admin enters it)** — `lib/pairing.ts` (`generateCode`/`checkCode`/`claimCode`/`consumeCode`) implements a two-phase Redis-backed handshake: TV requests a code (`pairing:{code}` → `{claimed:false}`, TTL 300s), admin claims it (rewrites to `{claimed:true,...}`, 30s pickup TTL), TV's poll consumes it (deletes — single-use). Full round trip verified live in-browser, including rejecting a reused code.
- **Screen status is computed on read, never stored** — `lib/screens.ts`'s `computeScreenStatus()`. Online/offline threshold is 90s (3× the 30s heartbeat cadence from architecture doc Section 19). `"sleeping"` (operation-hours based) is explicitly P2 and not implemented — don't be surprised it's unreachable.
- **Zod is now a dependency** (`zod@4.4.3`) — request-body validation lives in `lib/validation/*.ts`, one file per resource, per `.github/instructions/multi-tenancy.instructions.md`'s explicit requirement.
- **Deeply-nested `app/api/...` route files use the `@/` path alias** (`@/lib/db`, not `../../../../../../lib/db`) — tsconfig already supports it (`baseUrl: "."`, `paths: {"@/*": ["./*"]}`), and hand-counting `../` in dynamic-segment folders is exactly the kind of thing that silently breaks. Shallower existing files (e.g. the NextAuth route) still use relative imports and weren't touched — not worth a blanket refactor, but prefer `@/` for anything under 2+ dynamic segments going forward.
- **Manual verification needs a real tenant, not the seeded super-admin** — the super-admin's `clientId` is `null`, and most tenant-scoped flows (like claiming a screen) need a real `clientId`. Create a throwaway `Client`/`AdminUser` for manual browser checks, log in via a direct `fetch` to `/api/auth/callback/credentials` (no `/admin/login` UI page exists yet), and delete the throwaway rows afterward — same pattern used here, don't leave test tenants behind.

## Standing Conventions (established in Phase 2 Task 2.2)

- **`lib/storage.ts`** is the only place an S3 client is constructed (`@aws-sdk/client-s3`, `forcePathStyle: true` for MinIO compatibility). It lazily creates the MinIO bucket and a public-read policy on first use — there's no separate bucket-bootstrap compose service, so don't add one; if the bucket is ever missing, the next `upload`/`deleteFile`/`listFiles` call recreates it.
- **Storage quota is NOT `checkAndIncrement`** — `lib/usage.ts`'s `checkStorageQuota(clientId, additionalBytes)` sums live `MediaAsset.sizeBytes` instead, because storage is a cumulative total (goes up on upload, down on delete), not a monthly-reset counter like every other `UsageMetric`. Don't route storage checks through `checkAndIncrement("media_storage_mb")` — it would incorrectly reset the "usage" every month even though the files are still sitting in MinIO.
- **Object key scheme:** `clients/{clientId}/{folderId or "root"}/{uuid}.{ext}` — always include `clientId` in the key path, per the runbook's explicit pitfall (tenants can otherwise overwrite each other's files even with DB-level isolation).
- **Thumbnails are a placeholder strategy for now** — images reuse `publicUrl` as `thumbnailUrl` (no resizing dependency added); video/PDF get `thumbnailUrl: null` and the UI shows a type label instead. Real thumbnail generation (video needs `ffmpeg`) is explicitly deferred, per the runbook.
- **Folder tree UI was simplified to root-only for this task** — `MediaFolder` supports full nesting at the schema level, but no folder CRUD API was built (only asset upload/list/delete). `/admin/media` doesn't yet let you create or navigate folders. Revisit if a later phase needs it; the schema is ready.

## Standing Conventions (established in Phase 3 Task 3.1)

- **`EditorBlock.type` is scoped to `"text" | "image" | "shape" | "logo"`** in `types/editor.ts`, not the full `"text"|"image"|"shape"|"logo"|"qr"|"video"` union architecture doc Section 9.3 lists — QR and Video have no specified props shape anywhere in the source docs and aren't in the P1 feature list. If Task 3.3 (block types) or a later task needs them, define real props types from an actual spec, don't guess.
- **Canvas aspect ratio is computed from `state.width`/`state.height`** (`(height/width)*100` for `padding-top`), not hardcoded `56.25%` — the architecture doc's Section 14.7 *and* Section 14.2 reference snippets both hardcode 16:9, which is wrong for `orientation: "portrait"` templates (already a supported value). **Task 3.2's own runbook prompt repeats the same hardcoded `56.25%`** for the canvas component — carry the same width/height-derived computation forward there instead of copying the runbook literally.
- **`sanitizeHtml()` (`lib/validation/sanitizeHtml.ts`) only wraps text block `content`**, using `isomorphic-dompurify`'s default config — no custom tag allowlist. Other block prop values go into typed CSS/attribute contexts, not raw HTML, so they're outside sanitizeHtml's actual threat model (a malicious shared-library `Template` rendering on another tenant's screen).
- **`renderEditorHtml()` (`lib/editor.ts`) is fully covered by unit tests, no live DB/Redis/browser needed** — first task in the project with zero infrastructure dependency. Keep it that way: don't let this file grow a `prisma`/`redis` import; if the editor needs persistence, that belongs in the save-flow code (Task 3.4), not the renderer.

## Standing Conventions (established in Phase 3 Task 3.2)

- **`react-draggable`'s `<DraggableCore>` is used, never `<Draggable>`.** `<Draggable>` applies its own pixel-based CSS transform, which fights with `EditorBlock`'s percentage-based `left`/`top` styling. `<DraggableCore>` is headless — it only reports pixel deltas via `onDrag`, which `components/editor/EditorCanvas.tsx` converts to percentages using the canvas wrapper's `getBoundingClientRect()`. Every usage passes `nodeRef` (never relies on `findDOMNode`) — confirmed via search that unpatched `react-draggable` throws under React 19 without it. Bumped to current `4.7.1` (runbook pinned stale `4.5.0`).
- **8-directional resize handles are hand-rolled with raw `pointerdown`/`pointermove`/`pointerup` listeners**, not `react-draggable` (which has no resize primitive). Each handle's direction string (`n`/`ne`/`e`/`se`/`s`/`sw`/`w`/`nw`) is checked with `.includes("n"|"e"|"s"|"w")` to decide which of `x`/`y`/`width`/`height` it affects — e.g. `w` changes both `x` and `width`, `n` changes both `y` and `height`. Clamped to a 2%-minimum size and 0–100% bounds.
- **History commits only on gesture end, via a snapshot-then-commit pattern**, per the runbook's explicit pitfall ("do not push every drag-move into history"). `hooks/useEditorState.ts` exposes `updateBlockLive(id, patch)` (mutates `present` only, no history push — used for every intermediate drag/resize frame) and `commitBlock(before)` (pushes the pre-gesture snapshot, captured in a ref at gesture start, onto `past`, clears `future`). The reducer itself is exported (`export function reducer`) specifically so this logic is unit-testable without mounting the hook — this project has no DOM-rendering test infrastructure (no `@testing-library/react`, no `jsdom`/`happy-dom` environment; `vitest.config.mts` is `environment: "node"`), and adding one for a single hook wasn't judged worth it given the interactive behavior is verified live in-browser anyway.
- **`EditorCanvas` renders blocks at native `state.width`×`state.height` inside a `transform: scale(displayWidth / state.width)` "stage" div**, measured via a `ResizeObserver` on the outer wrapper — not by trying to keep each block's raw pixel props (font size, border radius) separately in sync with the display size. This is the standard editor-canvas scaling trick (Figma/Canva-style): percentage-based block positions inside the stage stay correct at any display size since the whole stage scales uniformly, and it keeps `getBoundingClientRect()`-based pixel-delta math in the drag/resize handlers correct too, since that always reads the *outer* (already-scaled) wrapper.
- **Block rendering inside `EditorCanvas` is intentionally minimal/read-only** (a `switch` on `block.type` producing a visual approximation matching `renderBlock()` in `lib/editor.ts`) — the real editable components (`TextBlock`, `ImageBlock`, `ShapeBlock`, `LogoBlock` with `contenteditable`, Pexels search, branding-aware logo) are Task 3.3's explicit output. Don't mistake `EditorCanvas`'s inline `BlockContent` for the final block components.
- **`app/admin/editor/page.tsx` + `EditorHarness.tsx` is a deliberate temporary test harness, not a finished editor page.** No task in `phase-3-editor.md` explicitly lists an editor page as an output, but Task 3.2's "done when" criteria (drag/undo/resize working) are unverifiable without one. It seeds an in-memory `EditorState` (no persistence, resets on reload), and only has Undo/Redo/"Add Text Block"/"Add Shape Block" buttons — no blocks palette, no properties panel, no save. Requires only `session?.user` (not `session.user.clientId`) since it does no tenant-scoped data access yet. Task 3.3 will add the palette/properties panel; Task 3.4 will wire real save/load — this page should be extended in place, not treated as done.

## Standing Conventions (established in Phase 3 Task 3.3)

- **`PEXELS_API_KEY` is real in this environment, not the `.env.local` placeholder** — `.env.local` still literally has `PEXELS_API_KEY="placeholder"`, but the host shell/process this app runs under has a real key already exported, which takes precedence (Next.js's env loading never overrides an already-set `process.env` value). Live search against `GET /api/v1/clients/:clientId/image/search?query=mountain` returned 20 real Pexels results end-to-end — the image search feature is **fully verified**, not a documented gap as originally anticipated before building it. Don't assume `.env.local`'s value reflects what's actually in effect; check `process.env.PEXELS_API_KEY` (or just try a live call) if this matters for a future task.
- **`lib/images/pexels.ts` + `lib/images/search.ts`** — the provider-adapter/orchestration split from `.github/instructions/ai-generation.instructions.md`. `searchPexels()` is the only place that calls the Pexels API and the only place that knows Pexels' response shape; `searchImages()` owns the cache-check → `checkAndIncrement` → provider call → cache-write + `GenerationLog` → rollback-on-failure sequence. Add Pixabay/Openverse later as sibling adapters in `lib/images/`, called from the same orchestration function, never by routes directly.
- **`ImageCache` rows are written fully global (`clientId: null`), never per-tenant** — Pexels results for a given query/orientation are identical regardless of which tenant searched for them, so caching them globally (24h TTL) maximizes cache value and minimizes provider calls platform-wide. A cache hit skips `checkAndIncrement` and writes no `GenerationLog` row entirely (no provider call happened, nothing to gate or log).
- **Found and fixed a real vitest gap while writing `lib/images/search.test.ts`**: `vitest.config.mts` had no path-alias resolution configured at all. It appeared to work before only because the one prior `@/`-aliased import in a test file (`lib/editor.test.ts`'s `import type { EditorBlock, EditorState } from "@/types/editor"`) was `import type`-only and got erased entirely at transpile time, so it never actually needed runtime resolution. The moment a test needed a *value* import through `@/` (`@/lib/db`), it failed with "Cannot find package". Fixed by adding `resolve: { tsconfigPaths: true }` to `vitest.config.mts` (Vite's native tsconfig-paths resolution — no extra dependency needed). `@/`-aliased value imports in test files now work correctly; use them freely going forward.
- **Text block editing uses the same live-update-then-commit-on-blur pattern as drag/resize** (`hooks/useEditorState.ts`'s `updateBlockLive`/`commitBlock`, reused as-is) — every keystroke updates `EditorState` live (no history push, so React's contenteditable-diffing doesn't fight the cursor position), and the whole edit session commits as a single undoable entry on blur. `TextBlock.tsx` stops `pointerdown` propagation while `editable` so clicking to place a cursor doesn't also start a `DraggableCore` move gesture.
- **`components/editor/BrandingContext.tsx`** is a plain React Context, provided once in `EditorHarness.tsx` from a server-side `prisma.clientBranding.findUnique()` fetch in `page.tsx` (falls back to `DEFAULT_BRANDING` if no row exists — no `/admin/settings/branding` page exists yet to create one). `EditorCanvas.tsx` reads it via `useBranding()` and sets `--color-primary`/`--color-secondary`/`--color-accent`/`--font-family` as inline custom properties on the canvas wrapper, per Section 23. `LogoBlock.tsx` reads `branding.logoUrl` directly (not via a CSS var, since it needs an actual `<img src>`).
- **`app/admin/editor/page.tsx`'s guard tightened from `session?.user` to `session?.user?.clientId`** — branding and image search are both tenant-scoped, unlike Task 3.2's harness. Super-admin accounts (`clientId: null`) can no longer reach `/admin/editor` — same known limitation already flagged for `/admin/media` and `/admin/screens`.

## Standing Conventions (established in Phase 3 Task 3.4 — Phase 3 complete)

- **`lib/templates.ts`'s `saveTemplateVersion()` is the only place a `Template`/`TemplateVersion` pair gets written** — used by both `POST /editor/save` and `POST /templates` (which differ only in request shape, per architecture Section 15.6). New-version numbers always come from the `update`'s own returned `currentVersion` (via `{ increment: 1 }`) inside a single `$transaction`, never a separate read-then-write — avoids a race between concurrent saves. Restoring an old version calls this same function with that version's `editorState`, creating a new version on top; it never rewinds `currentVersion`.
- **`Template` mutations use the raw `prisma` client with explicit `{ id, clientId }` checks (`lib/templates.ts`'s `getOwnedTemplate()`), never `scopedPrisma()` or `mineOrGlobalWhere()`.** `Template` is one of `scopedPrisma()`'s throw-list models (nullable `clientId`); `mineOrGlobalWhere()` is a *read* helper for "mine-or-shared" and is the wrong shape for writes, since every create/update/delete in this task always targets the tenant's own row. `GET /templates` (list) is the one place a custom two-mode `where` is built directly (`library=true` → `{ clientId: null, isLibrary: true }`, else → `{ clientId }`) to match Section 15.2's two distinct browser tabs — don't reach for `mineOrGlobalWhere()` there either, it would blend both tabs into one list.
- **`editorStateSchema` (`lib/validation/templates.ts`) is the first zod validation of `EditorState` at an HTTP boundary** — a discriminated union on `block.type`, validating each block's `props` against its real shape. Every route that accepts or re-parses stored `editorState` JSON (save, restore) validates through this schema before it's trusted — malformed input is rejected before any DB write, satisfying the runbook's "don't save a partial state" pitfall without needing rollback logic.
- **Thumbnails stay `thumbnailUrl: null` — no puppeteer.** The runbook explicitly permits a placeholder ("acceptable initially") and warns puppeteer bloats the image; the Docker base (`node:24-bookworm-slim`) lacks the system libs headless Chromium needs, so wiring it in is real `Dockerfile` surgery, not a quick add. Identical decision already made for media thumbnails in Task 2.2 — treat as a discrete future task, not folded into whichever feature next touches templates.
- **Only what Task 3.4 explicitly lists as outputs was built** — no fork/publish/unpublish/rate/favourite endpoints and no `TemplateTag` filtering, even though architecture Section 15.6 documents them as part of the broader Template API. The three-tier shared-library model (Section 15.1) is schema-ready but has zero route/UI support. Don't assume `Template.isLibrary`/`forkedFromId` are wired up anywhere yet.
- **`app/admin/editor/[templateId]/page.tsx`** loads an existing template (ownership-checked, `editorStateSchema`-validated before rendering) and seeds `EditorHarness` via its new `initialTemplate` prop; `app/admin/editor/page.tsx` (no id) still means "new template." After a first save from the no-id page, `EditorHarness` calls `router.replace()` to move the URL to `/admin/editor/:id` — a full server round-trip that remounts the harness, so don't rely on component state (like a "saved!" banner) surviving that specific transition; it needs to come from the freshly-loaded server props instead.

## Standing Conventions (established in Phase 4 Task 4.1)

- **`lib/soketi.ts`'s `publishEvent(clientId, event, payload)` is the only place a Soketi event gets triggered**, via the server-side `pusher` package (never `pusher-js`, which is client-side-only), targeting channel `client-{clientId}`. Always call it *after* the triggering DB write commits, per `.github/instructions/realtime-cache.instructions.md` — never before or inside the same transaction.
- **Found and fixed a real Docker-networking gap**: `docker/docker-compose.yml`'s `app` service already overrode `DATABASE_URL`/`REDIS_URL`/`MINIO_ENDPOINT` to internal compose hostnames (the Task 1.1 pattern) but never added `SOKETI_HOST` — `.env.local`'s `SOKETI_HOST=localhost` is unreachable from inside the container. Added `SOKETI_HOST: soketi` to the same environment block. Verified by actually publishing through the deployed container (not just a TCP reachability check) — confirms the fix, not just the symptom.
- **`scopedPrisma()` works normally for `Playlist`/`PlaylistItem`** (both have required, non-nullable `clientId`) — unlike `Template`, no raw-`prisma`-with-manual-`where` workaround is needed here. `create()` calls still need `clientId` passed explicitly in `data`, though — the extension only auto-injects `where`, never `create`'s data (same as every other model).
- **`PlaylistItem.order` uses a gap strategy (10, 20, 30, ...)** — `lib/playlists.ts`'s `nextItemOrder()`. Reordering is a single `PATCH .../items/:itemId { order }`, not a bulk endpoint.
- **Found and fixed a real reorder race/overflow bug while building the `/admin/playlists` UI**: swapping two items' `order` values via two parallel (or even naively sequential) `PATCH` calls violates the `@@unique([playlistId, order])` constraint, since both rows can momentarily hold the same value. Fixed with a 3-step staged swap through a temporary sentinel value (`item → temp`, `neighbor → item's old order`, `item → neighbor's old order|`), all sequential, never parallel. The first attempt used `-Date.now()` as the sentinel and hit a *second* bug — `order` is a Postgres `int4` column, and a millisecond timestamp overflows 32-bit range; fixed by using a small fixed sentinel (`-1`) instead, since gap-strategy orders are always positive. Both were caught live in the browser walkthrough, not by the automated tests (which only exercise `lib/playlists.ts` functions directly, not this two-step UI-orchestrated sequence) — a reminder that UI-level interaction sequencing bugs can hide behind fully-passing unit/integration tests.
- **`lib/playlists.ts` holds the testable core of every route's business logic** (`recomputeTotalDuration`, `nextItemOrder`, `assignPlaylistToScreen`, `publishPlaylist`), matching the `lib/templates.ts` pattern from Task 3.4 — routes stay thin (validate → call lib function → shape the response).
- **`GET /api/v1/clients/:clientId/screens` now includes `assignedPlaylist: { id, name }`** (added this task, not originally part of Task 2.1) — needed for `/admin/screens` to show "Playing: {name}", which Task 4.1's own "Done when" criteria explicitly requires. `ScreensManager.tsx` renders it as `assignedPlaylist ? "Playing: {name}" : "No playlist assigned"`.
- **The `/admin/playlists` reorder UI uses up/down buttons, not drag-to-reorder** — a deliberate simplification from the runbook's described "drag-to-reorder" step; satisfies the actual "Done when" criterion (order field updates) without native HTML5 DnD or a second `DraggableCore` instance.

---

## Rule Sources

- Global architectural rules live in `AGENTS.md`.
- Targeted coding rules live in `.github/instructions/README.md` and the related `*.instructions.md` files.
- Phase files stay in `docs/phases/` because they are execution runbooks and validation gates, not reusable coding-rule files.
- Do not create one instruction file per phase unless a phase introduces a stable rule cluster that is truly reusable outside that runbook.

## Agent Quick Map

- `Infrastructure` — Docker, Prisma schema, seed data, settings/prompt utilities, usage gating.
- `Auth` — NextAuth, tenant scoping, middleware, bearer tokens, permission checks.
- `UI` — Admin pages, forms, upload flows, list/detail pages, settings UI, dashboards.
- `Canvas` — Editor state, HTML renderer, canvas interactions, block components, save/versioning.
- `Real-Time` — Playlists, Soketi broadcasting, SSE gateway, TV renderer, screen heartbeat.
- `AI` — AI generation, prompt resolution flow, image provider integration, caching, attribution.

## Build Order And Dependencies

Follow this dependency chain exactly:

1. Task 1.1 — Docker Compose + Nginx
2. Task 1.2 — Prisma Schema + Migrations
3. Task 1.3 — Seed File
4. Task 1.4 — `lib/settings.ts` + `lib/prompts.ts`
5. Task 1.5 — Auth + middleware + tenant scoping
6. Task 1.6 — `lib/usage.ts`
7. Task 2.1 — Screen pairing + screen management
8. Task 2.2 — Media library + MinIO integration
9. Task 3.1 — EditorState type + `renderEditorHtml`
10. Task 3.2 — Editor canvas + drag/resize
11. Task 3.3 — Block types + properties panel
12. Task 3.4 — Save flow + template API
13. Task 4.1 — Playlists CRUD + assignment
14. Task 4.2 — SSE gateway
15. Task 4.3 — TV screen renderer
16. Task 5.1 — `lib/ai.ts`
17. Task 5.2 — Slide + announcement generation APIs
18. Task 5.3 — Image search + Pexels provider
19. Task 6.1 — Admin settings + prompts
20. Task 6.2 — Billing + usage dashboard

Do not start Phase 2 until the Phase 1 gate passes. Do not start Tasks 3.2-3.4 until the earlier Phase 3 dependency chain and the required Phase 2 outputs exist. Do not start later phases until the prior phase completion gate is satisfied.

## Next Up: TASK 4.2

- **Task Description:** SSE Gateway — TV Real-Time Connection. Build `GET /api/v1/clients/:clientId/events` as a streaming route (`ReadableStream`, `text/event-stream`), subscribing server-side to Soketi channel `client-{clientId}` via the `pusher` library and forwarding events to the SSE stream, with a 25s keep-alive and clean unsubscribe on disconnect.
- **Agent To Use:** `Real-Time`
- **Prerequisites:** Task 4.1 complete (done — `lib/soketi.ts`'s `publishEvent()` exists and is proven working, including through the deployed Docker container). Soketi working (done, since Task 1.1, now actually exercised). `SOKETI_HOST` is now correctly set for the `app` container (fixed in Task 4.1 — see Standing Conventions).
- **Architecture Context:** `Display Relay_Project Setup & Architecture.md` Section 19 (Soketi SSE gateway, events table), Section 24 (screen polling strategy).
- **Primary Runbook:** `docs/phases/phase-4-playlists-realtime.md` (TASK 4.2 section — "the most technically tricky task in the phase," per the runbook's own framing).
- **Repo State:** `lib/soketi.ts` currently only has a publish-side `publishEvent()`; this task adds the subscribe side. Note `.github/instructions/realtime-cache.instructions.md`'s explicit SSE requirements (`Cache-Control: no-cache`, `Connection: keep-alive`, `proxy_buffering off` in Nginx for SSE paths — check whether `docker/nginx.conf` (or wherever Nginx config lives) already has this for `/api/v1/.../events`, since the SSE path doesn't exist yet and Nginx wasn't configured for it in Task 1.1).
- **Acceptance Target:** Opening the URL shows a persistent connection in the Network tab; a `playlist.updated` publish (from Task 4.1's endpoint) is received on the stream; keep-alive comments arrive every 25s; disconnecting cleans up the Soketi subscription and timer.
- **Next Task If Passed:** TASK 4.3 - TV Screen Renderer

## Recently Completed

- **TASK 1.1 — Docker Compose Full Stack:** Live-validated. All 6 services (`app`, `postgres`, `redis`, `soketi`, `minio`, `nginx`) started via `docker compose -f docker/docker-compose.yml up -d` and reached a healthy/running state. `curl localhost:9011` (MinIO console, remapped from 9001) returned 200, `curl localhost:6001` (Soketi) returned 200, and `curl localhost/api/health` (through nginx → app) returned the expected JSON. Postgres/redis/minio host ports were remapped to 5433/6380/9010-9011 to avoid conflicting with other Docker projects already running on this host — see the "Known deviation" note above.
- **TASK 1.2 — Prisma Schema — Core Tables:** Live-validated. `corepack pnpm@10.33.2 prisma migrate dev --name init --config=./prisma.config.ts` succeeded against the live Postgres container, creating `prisma/migrations/20260821130848_init/`. Verified 35 model tables + `_prisma_migrations` in `information_schema.tables`, matching every model in `prisma/schema.prisma`.
- **TASK 1.3 — Prisma Seed File:** Live-validated. `prisma/seed.ts` seeds 4 plans (`essential`/`professional`/`premium`/`enterprise`, limits/features JSON matching the pricing table, `-1` = unlimited), 14 app settings, 6 prompt templates, and 7 layout-preset `Template` rows (`hero`, `two-column`, `image-left`, `image-right`, `quote`, `grid`, `lower-third` — hand-authored placeholder `editorState`/`htmlContent`, to be replaced once Phase 3's `renderEditorHtml()` exists). Plans/settings/prompts use real `upsert` (unique key exists); layout presets use `deleteMany` + `createMany` scoped to `category: "layout-preset"` since `Template` has no natural unique key — verified idempotent across 3 consecutive runs. **Established `lib/db.ts`** as the shared `PrismaClient` singleton (see the Prisma 7 architecture note above) — discovered because Prisma 7 removed schema-level `datasource.url` entirely and requires an explicit driver `adapter`; added `@prisma/adapter-pg` as a dependency.
- **TASK 1.4 — `lib/settings.ts` and `lib/prompts.ts`:** Live-validated. `getSetting`/`setSetting` and `resolvePrompt`/`renderPrompt` implemented per architecture doc Sections 5.4–5.5, Redis-cached (300s TTL), tenant override merged with `??`. **Established `lib/redis.ts`** as the shared `ioredis` singleton (same pattern as `lib/db.ts`). **Established the test runner** (`vitest`, `pnpm test`) — 7 tests across a unit test (`lib/prompts.test.ts`) and two integration tests (`lib/settings.integration.test.ts`, `lib/prompts.integration.test.ts`) that exercise the live seeded Postgres/Redis, all passing. Confirmed cache invalidation (`setSetting` → immediate fresh `getSetting`) and `??` (not `||`) override-merge semantics.
- **TASK 1.5 — Auth:** Live-validated end-to-end. Added `AdminUser` model + migration (`clientId` nullable, user's explicit design choice — see the "Auth established" note above). NextAuth v4 credentials flow, `lib/auth.ts`, `lib/tenant.ts` (`scopedPrisma` via Prisma Client Extensions — `$use()` middleware is gone in Prisma 7), `lib/withClientAuth.ts`, `middleware.ts` all built and typechecked. 12 new tests passing (auth unit tests, `withClientAuth` unit tests with mocked session, `scopedPrisma` cross-tenant integration tests proving reads/updates/deletes are all correctly isolated) — 19 tests total across the whole suite. Manually verified via `pnpm dev` (port 3100, since 3000 was occupied by another process on this host): unauthenticated `GET /admin` redirects to `/admin/login`; a full NextAuth credentials login round-trip with the seeded super-admin produced a session with `isSuperAdmin: true`; a wrong-password attempt produced no session. Flagged two minor follow-ups (both noted above): the `middleware.ts` → `proxy.ts` rename Next.js 16.1 wants, and the `Template`/`ImageCache`/`AiContentLibrary` scoping exception in `lib/tenant.ts`.
- **TASK 1.6 — `lib/usage.ts`:** Live-validated, **Phase 1 complete.** `checkAndIncrement`/`checkFeature`/`decrementUsage`/`getUsageSummary` implemented per architecture doc Section 4.3, `UsageMetric`/`FeatureFlag` as literal union types matching the exact keys seeded in Task 1.3 (compile-time enforcement of the runbook's "keys must match exactly" pitfall). Plan resolution defaults an unsubscribed client to `essential` (no `Subscription` row required — mirrors the schema's own `planSlug @default("essential")`). 5 new tests passing (24 total across the suite): 10-then-blocked `ai_slides` limit on Essential, `google_reviews` false on Essential / true on Professional, decrement-with-floor-at-0 rollback, and a full-plan usage summary — all against real seeded `Plan` rows and freshly created throwaway `Client`/`Subscription` rows, cleaned up after. See `docs/phases/results/phase-1-result.md` for the complete phase wrap-up.
- **TASK 2.1 — Screen Management (Pairing + List):** Live-validated end-to-end, including a full in-browser walkthrough (not just automated tests). Resolved two doc problems before building: architecture doc Section 10 doesn't exist, and the runbook's pairing description was self-contradictory — confirmed with the user that the TV displays the code and the admin enters it (standard smart-TV pairing UX). Built `lib/pairing.ts` (two-phase Redis handshake — generate/claim/consume), `lib/screens.ts` (`computeScreenStatus`, computed on read, 90s online/offline threshold), `lib/validation/screens.ts` (first use of the new `zod` dependency), three API routes (`/api/v1/pair/request`, `/api/v1/clients/[clientId]/screens`, `.../screens/[screenId]`), and two pages (`/pair`, `/admin/screens`). **Generalized `withClientAuth`** to pass through full route params (see Standing Conventions) — the first real usage since Task 1.5 revealed the gap exactly as anticipated. 10 new tests (36 total). Manual browser verification: generated a code on `/pair`, claimed it from `/admin/screens` as a throwaway tenant admin, watched `/pair`'s background poll auto-detect the claim and flip to "Paired ✓" within one 3s cycle — then confirmed reusing the same code correctly failed with 400 (single-use enforced live, not just in tests). Docker image rebuilt successfully with the new routes/dependencies. `"sleeping"` status and the super-admin client-switcher are explicitly out of scope (P2 / Phase 6).
- **TASK 2.2 — Media Library (Upload to MinIO):** Live-validated end-to-end, **Phase 2 complete.** MinIO bucket didn't exist yet (confirmed via `mc ls`) — `lib/storage.ts` lazily creates it plus a public-read policy on first use instead of adding a compose bootstrap service. Added `checkStorageQuota()` to `lib/usage.ts` as a cumulative-total check distinct from `checkAndIncrement`'s monthly counters (see Standing Conventions). **Found and fixed a real gap while building this:** `scopedPrisma()`'s `count()`/`aggregate()`/`groupBy()` weren't in `SCOPED_OPERATIONS` — `scopedPrisma(clientId).mediaAsset.count()` would have silently counted every tenant's assets. Fixed before it shipped in the media list route. 6 new tests (42 total), including an explicit cross-tenant `MediaAsset` isolation test (the Phase 2 gate names this specifically). Manual browser verification: uploaded a real PNG, confirmed the thumbnail actually loads through the live nginx→MinIO proxy path (not just a DB-row check) with correct `content-type`, uploaded a disallowed type and got `415`, deleted the asset and confirmed it's gone from both the grid and MinIO directly (`mc ls`). Folder tree UI deliberately simplified to root-only — no folder CRUD API was built, `MediaFolder`'s nesting support is schema-only for now. See `docs/phases/results/phase-2-result.md` for the complete phase wrap-up.
- **TASK 3.1 — `EditorState` Type + `lib/editor.ts` Renderer:** Typechecked and tested — first task in the project needing no DB/Redis/browser verification at all (pure types + a pure rendering function). Scoped `EditorBlock.type` down to `text`/`image`/`shape`/`logo` (architecture doc Section 9.3 lists `qr`/`video` too, but neither has a props type specified anywhere in the source docs, and neither is P1). Sourced `ShapeBlockProps`/`LogoBlockProps` fields from Section 14.2's table since Section 9.3 references them without defining them. **Deliberately deviated from the reference `renderEditorHtml()` pseudocode**: computed the canvas aspect ratio from `state.width`/`state.height` instead of the doc's hardcoded `padding-top:56.25%`, since portrait templates (`orientation: "portrait"`, already schema-supported) would render with the wrong ratio otherwise — flagged this same fix forward for Task 3.2's canvas component, which repeats the same hardcoded value. 9 new tests (51 total): valid HTML output, `<script>` sanitization, image/logo block rendering, `{{LOGO_URL}}` placeholder (never a real URL), zIndex ordering independent of input array order, invisible-block exclusion, purity (identical input → identical output), and no-mutation of the input blocks array. Docker image rebuilt successfully.
- **TASK 3.2 — Editor Canvas — React Component:** Live-validated end-to-end with a full in-browser walkthrough, not just automated tests — first UI task since Phase 2. Built `hooks/useEditorState.ts` (immer-based reducer with `addBlock`/`removeBlock`/`updateBlock`/`updateBlockLive`/`commitBlock`/`undo`/`redo`, 50-entry history cap, `reducer` exported for direct unit testing) and `components/editor/EditorCanvas.tsx` (see Standing Conventions for the `DraggableCore`-not-`Draggable`, hand-rolled resize-handle, and canvas-scaling design decisions). Carried the Task 3.1 aspect-ratio fix forward as flagged. Added a minimal `app/admin/editor/page.tsx` + `EditorHarness.tsx` test harness since no task explicitly owns page creation (see Standing Conventions — this is a deliberate scope boundary, not a finished editor page). 9 new tests (60 total) against the exported reducer: add/remove/update, live-update-doesn't-grow-history, commit-grows-history-by-one-and-clears-future, undo restores exact pre-drag percentages, redo restores the moved value, undo/redo no-ops at history boundaries, 50-entry history cap, and a bounds check that live-patched positions/sizes always stay within 0–100. Manual browser verification (via synthetic `mousedown`/`mousemove`/`mouseup` and `pointerdown`/`pointermove`/`pointerup` event dispatch, since precise pixel-delta math needed exact control the Preview tools' built-in click/fill don't offer): click-to-select revealed exactly 8 resize handles; a 100×50px drag produced `left`/`top` percentages matching the expected `(delta/canvasRect) * 100` formula to 4+ decimal places; `Ctrl+Z` reverted to the exact pre-drag `8%/12%`, `Ctrl+Shift+Z` restored the moved value; the `se` handle resize changed only `width`/`height` (position unchanged) and the `w` handle resize changed only `x`/`width` (top/height unchanged), both matching expected math exactly; clicking empty canvas cleared selection and hid all handles; "Add Text Block"/"Add Shape Block" added new independently-selectable blocks. Docker image rebuilt successfully, `/api/health` still 200.
- **TASK 3.3 — Block Types — Text, Image, Shape, Logo:** Live-validated end-to-end, including the real Pexels API (see Standing Conventions — `.env.local`'s key is a placeholder, but a real key is already in effect via the host environment, so this was verified with genuine search results, not just the gated-failure path originally anticipated before starting). Built real block components (`components/editor/blocks/{Text,Image,Shape,Logo}Block.tsx`) replacing Task 3.2's inline placeholder rendering; `lib/images/pexels.ts` + `lib/images/search.ts` (provider adapter / cache+gating+logging orchestration split, per `.github/instructions/ai-generation.instructions.md`); `app/api/v1/clients/[clientId]/image/search/route.ts`; `components/editor/panels/ImageSearchPanel.tsx` and `EditorProperties.tsx` (right-hand properties panel, per-block-type controls); `components/editor/BrandingContext.tsx` (client branding via React Context + CSS custom properties on the canvas wrapper). **Found and fixed a real vitest gap**: no path-alias resolution was configured at all — `@/`-aliased *value* imports in test files silently never worked (the one prior `@/` test import was `import type`-only and got erased before resolution mattered); fixed via `resolve: { tsconfigPaths: true }` in `vitest.config.mts`. 2 new tests (62 total): cache hit skips gating entirely, quota-exhausted cache-miss is blocked before any provider call is attempted. Manual browser verification with a throwaway tenant (branding + image search are now tenant-scoped, so the harness page's guard was tightened to `session.user.clientId`): confirmed branding CSS custom properties on the canvas wrapper matched the seeded `ClientBranding` row exactly; a single `contenteditable` edit session (focus → keystrokes → blur) committed as one undoable history entry, reverting to the exact original text on `Ctrl+Z`; a real "mountain" search returned 20 live Pexels results, selecting one updated the image block's `src` and auto-added a **locked** attribution text block ("Photo by ... on Pexels"); confirmed `image_searches` usage was incremented and a `GenerationLog(success:true)` row written for the real call (checked directly in Postgres); a properties-panel field edit (shape fill color) committed as exactly one undo step; drag and resize (including edge-clamping) still work identically after the block-rendering swap. Docker image rebuilt successfully, `/api/health` still 200.
- **TASK 3.4 — Editor Save Flow + Template API, Phase 3 complete:** Live-validated end-to-end. Built `lib/templates.ts` (`saveTemplateVersion()` — atomic create-or-version transaction; `getOwnedTemplate()` — shared ownership check reused across 4 route files), `lib/validation/templates.ts` (first zod validation of `EditorState` at an HTTP boundary, discriminated on `block.type`), the full route set (`POST /editor/save`, `GET/POST /templates`, `GET/PATCH/DELETE /templates/:id`, `GET /templates/:id/versions`, `POST /templates/:id/versions/:v/restore`), and `app/admin/editor/[templateId]/page.tsx` (loads an existing template; `lib/branding.ts` factored out of `page.tsx` once a second page needed the same branding fetch). Thumbnails deliberately stay `thumbnailUrl: null` — no puppeteer, matching the runbook's own explicit allowance and Task 2.2's identical precedent (Docker base image lacks headless-Chromium system libs). 7 new tests (69 total): new-template save creates v1; a second save on the same `templateId` increments to v2 with v1 untouched; restoring v1 creates v3 with v1's exact `editorState` (never rewinding `currentVersion`); cross-tenant save attempts return `not_found`; `editorStateSchema` rejects an unknown block type and a text block with wrong props shape before any DB write. Manual browser verification with a throwaway tenant: saved a new template from `/admin/editor` (name + Save button), confirmed `Template`+`TemplateVersion` v1 rows in Postgres, confirmed the URL updated to `/admin/editor/:id` via `router.replace()` and the page reloaded with the correct saved state; edited a block and saved again — `currentVersion` became 2, v1 untouched (checked directly in Postgres); called the restore endpoint for v1 — got back v3 with v1's exact content, confirmed via `GET .../templates/:id`; confirmed `PATCH` (vertical metadata) and list filtering (`?vertical=...`) both work correctly and are tenant-scoped; confirmed both layers of cross-tenant protection live (`withClientAuth`'s 403 for a mismatched `clientId` path param, `getOwnedTemplate`'s 404 for a same-session different-tenant resource); confirmed the separate `POST /templates` create endpoint also works. Docker image rebuilt successfully, `/api/health` still 200. `docs/phases/results/phase-3-result.md` generated.
- **TASK 4.1 — Playlists — CRUD + Assignment:** Live-validated end-to-end, including a real publish call through the actual deployed Docker container (not just the local dev build). Built `lib/soketi.ts` (`publishEvent()` via the server-side `pusher` package — first real Soketi usage since Task 1.1), `lib/playlists.ts` (`recomputeTotalDuration`/`nextItemOrder`/`assignPlaylistToScreen`/`publishPlaylist`, the testable core behind every route, matching Task 3.4's lib-extraction pattern), the full playlist API (list/create/get/patch/delete, item add/update/delete, assign, publish), and `/admin/playlists` + `/admin/playlists/[playlistId]` (list view, item editor with up/down reorder — a deliberate simplification of the runbook's "drag-to-reorder" — duration editing, add-item form across all 5 item types, assign-to-screen, publish). **Found and fixed a real Docker-networking gap**: `SOKETI_HOST` was never overridden for the `app` container (unlike `DATABASE_URL`/`REDIS_URL`/`MINIO_ENDPOINT`, which already were) — `.env.local`'s `localhost` value would have been unreachable from inside the container; fixed and verified by an actual successful publish through the container, not just a TCP check. **Found and fixed a real reorder bug live in the browser** (not caught by automated tests): swapping two items' `order` via parallel `PATCH` calls violates the `(playlistId, order)` unique constraint; the first fix attempt (`-Date.now()` as a temp sentinel) hit a second bug (int4 overflow); fixed with a sequential 3-step swap through a small fixed sentinel (`-1`). Also added `assignedPlaylist: { id, name }` to `GET /screens` and a "Playing: {name}" label to `ScreensManager.tsx`, since Task 4.1's own "Done when" criteria explicitly requires the screen view to show the assigned playlist's name and Task 2.1 never built that. 12 new tests (77 total): gap-strategy order sequencing (10/20/30), total-duration recompute (including back to 0 after all items removed), same-tenant assignment succeeds, cross-tenant assignment rejected on both the screen side and the playlist side, publish sets `status`/`publishedAt`, publish on a foreign-tenant playlist returns `not_found`. Manual browser verification with two throwaway tenants: created a playlist, added a media item and a web-link item (both rendered with correct thumbnail/label), reordered via Up (verified in Postgres), assigned to a screen (confirmed "Playing: Lobby Rotation" on `/admin/screens`), published (status/`publishedAt` set), confirmed cross-tenant assign returns 404, confirmed a full create+publish round-trip against the real Docker container (not just `next start`) succeeds end-to-end. Docker image rebuilt successfully, `/api/health` still 200.

## Phase Tracking

### Phase 1: Core Infrastructure & Config Layer
- [x] **Task 1.1:** Docker Compose Full Stack — live-validated, all 6 services healthy (ports remapped for host conflicts, see above)
- [x] **Task 1.2:** Prisma Schema — Core Tables — live migration applied, 35 tables verified
- [x] **Task 1.3:** Prisma Seed File — 4 plans, 14 app settings, 6 prompt templates, 7 layout presets, verified idempotent
- [x] **Task 1.4:** `lib/settings.ts` and `lib/prompts.ts` — implemented, Redis-cached, 7 tests passing (unit + integration)
- [x] **Task 1.5:** Auth — NextAuth.js + API Bearer Tokens — `AdminUser` model, NextAuth v4, `scopedPrisma`, `withClientAuth`, `middleware.ts`, 12 new tests, manual login round-trip verified
- [x] **Task 1.6:** `lib/usage.ts` — Billing & Usage Gates — implemented, 5 new tests (24 total in suite), Essential-plan limit/feature/rollback/summary all verified
- [x] **Phase 1 Wrap-up:** `docs/phases/results/phase-1-result.md` generated

### Phase 2: Screens, Media & Basic Admin UI
- [x] **Task 2.1:** Screen Management — Pairing + List — pairing flow, screen CRUD, status badges, 10 new tests, full browser walkthrough verified
- [x] **Task 2.2:** Media Library — Upload to MinIO — `lib/storage.ts`, storage quota, cross-tenant isolation, 6 new tests, full browser walkthrough verified
- [x] **Phase 2 Wrap-up:** `docs/phases/results/phase-2-result.md` generated

### Phase 3: Slide Editor
- [x] **Task 3.1:** EditorState Type + `lib/editor.ts` Renderer — pure types + pure renderer, 9 new tests, no infra dependency
- [x] **Task 3.2:** Editor Canvas — React Component — drag/resize/undo/redo, 9 new tests, full browser walkthrough verified
- [x] **Task 3.3:** Block Types — Text, Image, Shape, Logo — real block components, Pexels search (verified live with real results), properties panel, branding context, 2 new tests
- [x] **Task 3.4:** Editor Save Flow + Template API — versioned save/restore, template CRUD, atomic transactions, 7 new tests, full browser walkthrough verified
- [x] **Phase 3 Wrap-up:** `docs/phases/results/phase-3-result.md` generated

### Phase 4: Playlists, Schedules & Real-Time
- [x] **Task 4.1:** Playlists — CRUD + Assignment — full playlist API, `lib/soketi.ts` publish, `/admin/playlists` UI, 12 new tests, full browser walkthrough verified (including through the deployed Docker container)
- [ ] **Task 4.2:** SSE Gateway — TV Real-Time Connection
- [ ] **Task 4.3:** TV Screen Renderer
- [ ] **Phase 4 Wrap-up:** Generate `docs/phases/results/phase-4-result.md`

### Phase 5: AI Generation Pipeline
- [ ] **Task 5.1:** `lib/ai.ts` — OpenRouter Integration
- [ ] **Task 5.2:** Slide + Announcement Generation APIs
- [ ] **Task 5.3:** Image Search + Pexels Provider
- [ ] **Phase 5 Wrap-up:** Generate `docs/phases/results/phase-5-result.md`

### Phase 6: Settings UI, Billing & Polish
- [ ] **Task 6.1:** Admin Settings — Prompts + General
- [ ] **Task 6.2:** Billing — Stripe + Usage Dashboard
- [ ] **Phase 6 Wrap-up:** Generate `docs/phases/results/phase-6-result.md`

## Phase Gates

### Before Starting Phase 2

- [x] Tenant isolation verified (`lib/tenant.integration.test.ts` — cross-tenant read/update/delete all blocked).
- [x] Prompt-from-DB behaviour verified (`lib/prompts.integration.test.ts`).
- [x] Settings cache invalidation verified (`lib/settings.integration.test.ts`).
- [x] Usage-gate behaviour verified (`lib/usage.integration.test.ts` — limit block, feature flag, rollback, summary).

**Gate passed.** Full detail in `docs/phases/results/phase-1-result.md`.

### Before Starting Phase 3

- [x] Cross-tenant screens and media isolation verified (`lib/tenant.integration.test.ts`).
- [x] Pairing codes expire correctly and cannot be reused (`lib/pairing.integration.test.ts` + live browser re-use rejection in Task 2.1).
- [x] Media MIME validation enforced (`415` for disallowed types, verified live).
- [x] Media size validation enforced before upload (`413` before any MinIO call).

**Gate passed.** Full detail in `docs/phases/results/phase-2-result.md`.

### Before Starting Phase 4

- [x] `renderEditorHtml()` is pure for identical `EditorState` input (`lib/editor.test.ts`).
- [x] XSS sanitization verified for editor text content (`lib/editor.test.ts` — `<script>` stripped; `isomorphic-dompurify` used throughout).
- [x] Percentage-based positioning is preserved across editor interactions (drag/resize/save/restore verified live end-to-end in Task 3.4).
- [x] Image-search usage gating is enforced before provider calls (`lib/images/search.test.ts` + a live successful search confirmed incrementing `UsageRecord`/`GenerationLog`).

**Gate passed.** Full detail in `docs/phases/results/phase-3-result.md`.

### Before Starting Phase 5

- Playlist CRUD, reorder, assignment, and publish flows are verified.
- `playlist.updated` broadcasts are emitted after publish.
- SSE connections stay open, deliver updates, and clean up on disconnect.
- TV renderer updates within 2 seconds of publish and heartbeat visibility is confirmed.

### Before Starting Phase 6

- `generateWithPrompt()` resolves prompts from DB, parses output, and logs every call.
- Usage rollback is verified for failed AI calls.
- Slide and announcement endpoints enforce `429` limits correctly.
- Image search is usage-gated, cached, and returns attribution.

### Before Closing Phase 6

- Prompt and settings editing respects tenant versus super-admin permission boundaries.
- Settings and prompt cache invalidation is confirmed after writes.
- Stripe checkout and webhook flows are verified in test mode.
- Usage dashboard thresholds and downgrade flow are validated.

## Result Document Expectations

After each phase completes, create `docs/phases/results/phase-{N}-result.md` using `docs/phases/results/README.md` as the canonical template.

At minimum, every result document must include:

- phase summary,
- completed tasks,
- outputs delivered,
- architecture and data changes,
- validation and completion-gate results,
- known risks and follow-ups,
- next-phase handoff back into this orchestrator.

## Hub Contract

This file answers:

- what is active,
- what comes next,
- what is blocked,
- which prerequisites apply,
- which agent to use, and
- which phase runbook to open.

The phase files answer the detailed execution questions: numbered prompts, embedded context, outputs, pitfalls, and full acceptance criteria.

## Maintenance Rules

1. When a task is finished and validated, check the box `[x]` next to it.
2. Update the "Current State" section so the active phase, task, status, runbook, and validation target are accurate.
3. Rewrite the "Next Up" block for the next task with the correct persona, prerequisites, context sections, acceptance target, and validation check.
4. Keep this file lean. Do not copy full task cards or full persona prompt text into the orchestrator.
5. Keep the phase file references accurate. If a runbook is expanded or renamed, update the hub in the same change.