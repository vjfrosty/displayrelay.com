# Phase 1 Result — Core Infrastructure & Config Layer

## Phase Summary

- Status: Completed
- Completion date: 2026-08-21
- Runbook used: `docs/phases/phase-1-core.md`
- Orchestrator updated: Yes

Phase 1 built the entire foundation every later phase depends on: a live
Docker stack, the full Prisma schema (plus one addition), the DB-driven
settings/prompt resolution layer, authentication and tenant scoping, and
usage/billing gates. All six tasks are live-validated against a running
Postgres/Redis/MinIO/Soketi/Nginx stack — nothing here was only statically
checked.

## Tasks Completed

- [x] Task 1.1 — Docker Compose Full Stack
- [x] Task 1.2 — Prisma Schema — Core Tables
- [x] Task 1.3 — Prisma Seed File
- [x] Task 1.4 — `lib/settings.ts` and `lib/prompts.ts`
- [x] Task 1.5 — Auth — NextAuth.js + API Bearer Tokens
- [x] Task 1.6 — `lib/usage.ts` — Billing & Usage Gates
- [x] Phase wrap-up completed

## Outputs Delivered

**Infrastructure**
- `docker/docker-compose.yml` — 6 services (`app`, `postgres`, `redis`, `soketi`, `minio`, `nginx`), all image-pinned to exact tag + digest. Host ports for `postgres`/`redis`/`minio` remapped (`5433`/`6380`/`9010`-`9011`) to avoid conflicting with other Docker projects already running on this host; `soketi` (`6001`) and `nginx` (`80`) unchanged. Container-internal ports and service-to-service networking are untouched.
- `.env.local` (gitignored) — populated from `.env.example` with the remapped ports and dev-safe placeholder secrets.

**Database**
- `prisma/schema.prisma` — 36 models: the 35 originally designed plus one new addition, `AdminUser` (see "Architecture And Data Changes" below).
- Two migrations applied live: `20260821130848_init` (core schema) and `20260821133959_add_admin_user`.
- `prisma/seed.ts` — idempotently seeds 4 `Plan` rows, 14 `AppSetting` rows, 6 `PromptTemplate` rows, 7 layout-preset `Template` rows, and 1 super-admin `AdminUser` row.

**Shared libraries**
- `lib/db.ts` — the required `PrismaClient` singleton (Prisma 7 driver-adapter pattern; see below).
- `lib/redis.ts` — the required `ioredis` singleton.
- `lib/settings.ts` — `getSetting`/`setSetting`, Redis-cached (300s TTL), tenant override over global default.
- `lib/prompts.ts` — `resolvePrompt`/`renderPrompt`, Redis-cached (300s TTL), tenant override merged with `??`.
- `lib/auth.ts` — `getSession`/`isAdmin`/`isSuperAdmin`.
- `lib/tenant.ts` — `scopedPrisma(clientId)` via Prisma Client Extensions.
- `lib/withClientAuth.ts` — route-wrapper helper for client-scoped API routes (Phase 2+ will be the first consumer).
- `lib/usage.ts` — `checkAndIncrement`/`checkFeature`/`decrementUsage`/`getUsageSummary`.

**Auth**
- `app/api/auth/[...nextauth]/route.ts` — NextAuth v4 credentials provider, JWT sessions.
- `middleware.ts` — protects `/admin/*`.
- `types/next-auth.d.ts` — `Session`/`JWT` type augmentation for `clientId`/`isSuperAdmin`.

**Testing**
- `vitest.config.mts` + `vitest.setup.ts` — test runner, loads `.env.local`.
- 24 tests across 7 files (`pnpm test`), all passing: 3 unit-only files, 4 integration files that exercise the live seeded Postgres/Redis with no mocking.

## Architecture And Data Changes

### Schema addition: `AdminUser`

The original schema (from before this phase's work began) had no
login-credential table — `Client` models a tenant/business, not an
individual login. NextAuth's `CredentialsProvider` needs something to
authenticate against, so Task 1.5 added:

```prisma
model AdminUser {
  id           String   @id @default(uuid())
  clientId     String?  // null = platform super-admin
  email        String   @unique
  passwordHash String
  name         String?
  status       String   @default("active")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([clientId])
  @@map("admin_users")
}
```

This was a deliberate choice made with the user (not assumed): `clientId`
nullable, `null` meaning a platform super-admin not tied to any tenant,
rather than folding login fields directly onto `Client` (which would have
implied exactly one login per tenant and no clean way to represent a
super-admin).

### Prisma 7's driver-adapter requirement

Discovered while building the seed script: Prisma 7 removed the
`datasource.url` field from `schema.prisma` entirely, and `new
PrismaClient()` throws immediately unless constructed with an explicit
driver `adapter` — there is no environment-variable fallback the way there
was in Prisma 5/6. Every DB access in this codebase now goes through
`lib/db.ts`, which constructs the client once with `@prisma/adapter-pg`.
This is a project-wide convention now, not a one-off — flagged prominently
in the orchestrator so it isn't rediscovered by a later task.

### Tenant scoping via Prisma Client Extensions, not `$use()`

`lib/tenant.ts`'s `scopedPrisma(clientId)` uses `prisma.$extends({ query: {
$allModels: { $allOperations(...) } } })` to auto-inject `where: {
clientId }` on `findMany`/`findFirst`/`findFirstOrThrow`/`update`/
`updateMany`/`delete`/`deleteMany`. The old `$use()` middleware API referenced
in some older Prisma documentation no longer exists in Prisma 7.

Auto-scoping applies to every model with a **required** `clientId` field
(25 models, enumerated in `lib/tenant.ts`). Three models —
`Template`, `ImageCache`, `AiContentLibrary` — have a **nullable** `clientId`
where `null` means globally shared content (the template library, the
shared image-search cache, the shared AI content library). These are
deliberately excluded from auto-scoping; their own route handlers in Phase 3
and Phase 5 will need bespoke "mine OR global" `where` logic instead.

### Usage-metric and feature-flag key vocabulary

`lib/usage.ts` defines `UsageMetric` and `FeatureFlag` as TypeScript literal
union types, matching exactly the keys established in `prisma/seed.ts`'s
`Plan.limits`/`Plan.features` JSON (`ai_slides`, `google_reviews`, etc.).
This is now the compile-time-enforced canonical vocabulary — any later task
that calls `checkAndIncrement`/`checkFeature` with a mistyped key will fail
to typecheck rather than silently miss the gate.

An unsubscribed client (no `Subscription` row) defaults to the `essential`
plan, mirroring `Subscription.planSlug`'s own schema default. This wasn't
explicitly specified anywhere and was a judgment call, documented here for
visibility.

## Validation And Completion Gate Results

### Validation Summary

- Commands run: `docker compose up -d` / `ps`, `prisma migrate dev` (x2),
  `prisma db seed` (multiple times, idempotency confirmed), `pnpm typecheck`
  (clean after every task), `pnpm test` (24/24 passing), manual `pnpm dev` +
  `curl` for the auth flow.
- Tests run: 24 automated tests across 7 files — see `pnpm test`. Full list:
  `lib/prompts.test.ts` (unit), `lib/settings.integration.test.ts`,
  `lib/prompts.integration.test.ts`, `lib/auth.test.ts` (unit),
  `lib/withClientAuth.test.ts` (unit, mocked session),
  `lib/tenant.integration.test.ts`, `lib/usage.integration.test.ts`.
- Manual verification performed: full Docker stack brought up and curl-checked
  (MinIO console, Soketi, `/api/health` through nginx); a full NextAuth
  credentials login round-trip against the seeded super-admin, confirming a
  correct password produces a session with `isSuperAdmin: true` and a wrong
  password produces no session; unauthenticated `/admin` redirect confirmed.
- Not validated: the `app` Docker container has not yet made a real DB/Redis
  call from *inside* the container — see "Risks And Follow-Ups" below. No
  browser-based UI testing was performed (no UI exists yet — Phase 1 is
  infrastructure-only).

### Completion Gate

- [x] Tenant isolation verified — `lib/tenant.integration.test.ts` proves reads, updates, and deletes are all blocked across tenants.
- [x] Prompt-from-DB behaviour verified — `lib/prompts.integration.test.ts` resolves the seeded `slide.generate` prompt and proves tenant-override `??` merge semantics.
- [x] Settings cache invalidation verified — `lib/settings.integration.test.ts` proves `setSetting` → immediate fresh `getSetting`.
- [x] Usage-gate behaviour verified — `lib/usage.integration.test.ts` proves the Essential plan's 10-slide `ai_slides` limit blocks on the 11th call, `checkFeature` differentiates Essential vs. Professional, and rollback via `decrementUsage` floors at 0.

## Risks And Follow-Ups

**Update (2026-08-21, same day):** three of the six items below were fixed
in a follow-up pass; struck through and marked resolved. See
`docs/phases/ORCHESTRATOR.md` Standing Conventions for the current state.

- ~~**App-container env split (open)**~~ **— Resolved.** `docker/docker-compose.yml`'s
  `app` service now has an `environment:` block overriding
  `DATABASE_URL`/`REDIS_URL`/`MINIO_ENDPOINT` to the internal compose network
  names. Verified via TCP-level reachability checks (`docker compose exec
  app node -e "..."`) to `postgres:5432`, `redis:6379`, `minio:9000` — all
  succeeded. **Also discovered and fixed while verifying this:** the
  `Dockerfile` never ran `prisma generate`, so the containerized build had
  been silently broken since Task 1.3 introduced `lib/db.ts` — every
  validation since then ran via `pnpm dev`/`pnpm test` on the host, which
  masked it. Added `RUN pnpm exec prisma generate --config=./prisma.config.ts`
  to the `builder` stage before `pnpm build`. New minor follow-up from this:
  `.env.local` is copied into the Docker build context so `generate` can
  read it, bundling a (currently dev-placeholder-only) secrets file into
  image layers — worth hardening before real deployment, not fixed now.
- ~~**`middleware.ts` → `proxy.ts` (open, low priority)**~~ **— Resolved.**
  Re-verified against current Next.js docs: `proxy.ts` still accepts a
  default export exactly like `middleware.ts` did, and always runs on the
  Node.js runtime (never Edge) — if anything lower-risk for next-auth v4's
  `withAuth()`, not higher. Straight rename, no logic change. Verified via
  the running production container: `curl localhost/admin` still redirects
  to `/admin/login`, no deprecation warning in container logs.
- ~~**`scopedPrisma` scoping exception (by design, not a bug)**~~ **— Partially
  resolved.** `Template`/`ImageCache`/`AiContentLibrary` still need their own
  Phase 3/5 route-handler scoping logic (that part was never going to be
  built in Phase 1). What's fixed: `lib/tenant.ts` now **throws** if
  `scopedPrisma()` is called against any of the three, instead of silently
  returning every tenant's rows unfiltered — closes a real footgun. Added
  `mineOrGlobalWhere(clientId)`, the reusable `{ OR: [{ clientId }, {
  clientId: null }] }` fragment those future route handlers will use with
  the raw `prisma` client. Both covered by new tests in
  `lib/tenant.integration.test.ts`.
- **Dev-only super-admin password:** unchanged — not a code fix, no
  production deployment exists yet to protect. `prisma/seed.ts`'s
  `seedSuperAdmin()` hashes a hardcoded local-dev password
  (`dev-password-change-me`, documented in `SETTINGS.md`). Must be changed
  before any real deployment.
- **Host-specific port remapping:** unchanged — inherent to this shared dev
  host, not a bug. Don't copy the remapped compose file verbatim to a
  clean single-purpose production host.
- **Version drift — partially addressed.** `next` bumped `16.2.4` →
  `16.3.2` (latest stable at fix time). **New follow-up:** Vercel has a
  security release scheduled for **2026-08-26** (`16.3.3`, one
  critical-severity CVE, details not yet published) — not available yet,
  bump again once it ships. Soketi's maintenance pace is unchanged/untouched
  — still a Phase-4 evaluation item, not a patch-version-bump-sized fix.

## Next Phase Handoff

- Next staged task: Task 2.1 — Screen Management — Pairing + List
- Next runbook: `docs/phases/phase-2-screens.md`
- Prerequisites confirmed: Phase 1 complete, auth and tenant scoping working, Redis available for pairing codes, MinIO running (Task 2.2 will use it).
- Orchestrator next-up block updated: Yes
