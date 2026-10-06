# Phase 2 Result — Screens, Media & Basic Admin UI

## Phase Summary

- Status: Completed
- Completion date: 2026-08-22
- Runbook used: `docs/phases/phase-2-screens.md`
- Orchestrator updated: Yes

Phase 2 delivered the project's first two real end-user features on top of
Phase 1's infrastructure: screen pairing (a TV displays a code, an admin
claims it, the screen shows up in a list with a live-computed status badge)
and a media library (upload/list/delete against MinIO, with MIME/size/quota
gating). Both tasks were verified with full in-browser walkthroughs against
the live Docker stack, not just automated tests.

## Tasks Completed

- [x] Task 2.1 — Screen Management — Pairing + List
- [x] Task 2.2 — Media Library — Upload to MinIO
- [x] Phase wrap-up completed

## Outputs Delivered

**Screen pairing (Task 2.1)**
- `lib/pairing.ts` — `generateCode`/`checkCode`/`claimCode`/`consumeCode`, a two-phase Redis-backed handshake.
- `lib/screens.ts` — `computeScreenStatus()`, computed on read from `lastHeartbeatAt`.
- `lib/validation/screens.ts` — first use of the new `zod` dependency.
- `app/api/v1/pair/request/route.ts`, `app/api/v1/clients/[clientId]/screens/route.ts`, `.../screens/[screenId]/route.ts`.
- `app/pair/page.tsx`, `app/admin/screens/page.tsx` + `ScreensManager.tsx`.

**Media library (Task 2.2)**
- `lib/storage.ts` — `upload`/`deleteFile`/`listFiles`/`getPublicUrl` against MinIO via `@aws-sdk/client-s3`, with lazy bucket + public-read-policy bootstrap.
- `checkStorageQuota()` added to `lib/usage.ts`.
- `lib/validation/media.ts`.
- `app/api/v1/clients/[clientId]/media/route.ts`, `.../media/[assetId]/route.ts`.
- `app/admin/media/page.tsx` + `MediaManager.tsx`.

**Shared infrastructure fixes made along the way**
- `lib/withClientAuth.ts` generalized to pass through full route params (needed the moment a nested `[screenId]` segment appeared).
- `lib/tenant.ts`'s `SCOPED_OPERATIONS` extended to cover `count`/`aggregate`/`groupBy` — `scopedPrisma(clientId).mediaAsset.count()` would otherwise have silently counted every tenant's rows.

**Tests:** 18 new tests across the phase (10 for Task 2.1, 8 for Task 2.2 — storage, quota, and the added `count()`/media-isolation regression tests), bringing the suite to 42 tests across 10 files, all passing.

## Architecture And Data Changes

No schema changes this phase — `Screen`, `MediaAsset`, `MediaFolder` all already existed from Task 1.2. New architectural decisions:

- **Pairing UX resolved with the user**: the docs self-contradicted on whether the TV or the admin enters the code. Confirmed: TV displays it, admin enters it — the standard smart-TV pairing pattern (Chromecast/YouTube/Netflix-style), and the only one that doesn't require typing on a remote.
- **Screen status is computed, never stored** — `lastHeartbeatAt` recency (90s threshold, derived from the architecture doc's documented 30s heartbeat cadence) determines online/offline/ready_to_play on every read. `"sleeping"` (operation-hours based) is explicitly P2 and unimplemented.
- **Storage quota is a cumulative check, not a periodic counter** — `checkStorageQuota()` sums live `MediaAsset.sizeBytes` rather than routing through `checkAndIncrement`'s monthly-reset `UsageRecord` model, which would have been semantically wrong for a value that doesn't reset every month.
- **MinIO bucket bootstrap is lazy, in-application** (`lib/storage.ts`), not a compose-level init container — the bucket didn't exist before this task (confirmed via `mc ls` returning nothing).
- **Object key scheme** `clients/{clientId}/{folderId|"root"}/{uuid}.{ext}` — keeps tenant isolation visible in the storage layout itself, not just the DB.
- **Thumbnails are placeholder-only this phase** (images reuse `publicUrl`, video/PDF get no thumbnail) — real thumbnail generation needs `ffmpeg`/image-decoding dependencies not in scope yet.
- **Folder tree UI simplified to root-only** — no folder CRUD API was built; `MediaFolder`'s nesting is schema-ready but unused by the UI.

## Validation And Completion Gate Results

### Validation Summary

- Commands run: `pnpm typecheck`, `pnpm test` (after every file added), `pnpm build`, `docker compose up -d --build app` (twice, once per task), `curl localhost/api/health` regression checks.
- Tests run: 42 total (`pnpm test`), including live-integration tests against the real Postgres/Redis/MinIO containers — no mocking.
- Manual verification performed: full in-browser walkthroughs for both tasks via the preview tool, using a throwaway tenant `Client`/`AdminUser` (the seeded super-admin has `clientId: null` and can't exercise tenant-scoped flows). Task 2.1: generated a pairing code, claimed it from the admin UI, watched the TV-side page auto-detect the claim within one 3s poll and flip to "Paired ✓," confirmed a reused code correctly fails with `400`. Task 2.2: uploaded a real PNG, confirmed the thumbnail loads through the actual nginx→MinIO proxy path (not just a DB check) with the correct `content-type`, uploaded a disallowed file type and got `415`, deleted the asset and confirmed it's gone from both the UI and MinIO directly (`mc ls`).
- Not validated: folder creation/navigation (not built this phase), video/PDF thumbnail rendering (deliberately deferred), any Phase 3+ consumption of media assets (editor doesn't exist yet).

### Completion Gate

- [x] Cross-tenant screens isolation verified — `lib/tenant.integration.test.ts`.
- [x] Cross-tenant media isolation verified — same file, explicit `MediaAsset` test added in Task 2.2 to directly cover this named gate item.
- [x] Pairing codes expire correctly and cannot be reused — `lib/pairing.integration.test.ts` plus a live re-use rejection observed in the browser.
- [x] Media MIME validation enforced — `415` returned and observed live for a disallowed type.
- [x] Media size validation enforced before upload — checked before the MinIO call in `POST /api/v1/clients/[clientId]/media`.

## Risks And Follow-Ups

- **Folder tree UI not built** — `/admin/media` is root-only; `MediaFolder` nesting exists at the schema level only. Add folder CRUD + a real tree sidebar when a later phase needs it (nothing currently depends on it).
- **Thumbnails are placeholders** — images just reuse the full-size `publicUrl`; video/PDF show no thumbnail. Real thumbnail generation (image resizing, `ffmpeg` for video) is a discrete follow-up task, not scoped here.
- **No image dimension/duration capture** — `MediaAsset.width`/`height`/`durationSecs` stay `null`. Would need an image-decoding dependency not currently installed.
- **Super-admin can't manage screens or media** — both `/admin/screens` and `/admin/media` need a `clientId`; a super-admin (`clientId: null`) sees a "no tenant selected" message instead. A client-switcher UI is Phase 6 territory.
- **All Phase 1 follow-ups from the prior fix pass remain as previously documented** (dev-only super-admin password, host-specific port remapping, Soketi's maintenance pace, the pending Next.js `16.3.3` security patch) — untouched this phase, not re-litigated here.

## Next Phase Handoff

- Next staged task: Task 3.1 — `EditorState` Type + `lib/editor.ts` Renderer
- Next runbook: `docs/phases/phase-3-editor.md`
- Prerequisites confirmed: Task 1.2 complete (`Template` table exists with `editorState`/`htmlContent` fields); `lib/storage.ts` from Task 2.2 will be needed by Task 3.3 (image blocks) later in this phase.
- Orchestrator next-up block updated: Yes
