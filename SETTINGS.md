# Display Relay — Settings Reference

This file consolidates every setting defined for the project so far: environment
variables, Docker service configuration, and the database-driven settings model
described in the architecture doc. Nothing here has been changed by this
document — it is a reference snapshot of what already exists in the repo.

Sources: [.env.example](.env.example), [docker/docker-compose.yml](docker/docker-compose.yml), [prisma/schema.prisma](prisma/schema.prisma), [Display Relay_Project Setup & Architecture.md](Display%20Relay_Project%20Setup%20%26%20Architecture.md) (Section 5).

---

## 1. Environment Variables (`.env.local`, from `.env.example`)

| Variable | Example / Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://display_platform:display_platform@postgres:5432/display_platform` | Prisma connection string |
| `REDIS_URL` | `redis://redis:6379` | Cache, sessions, pairing codes |
| `SOKETI_HOST` | `localhost` | Real-time gateway host |
| `SOKETI_PORT` | `6001` | Real-time gateway port |
| `SOKETI_APP_ID` | `display-platform` | Soketi app identifier |
| `SOKETI_APP_KEY` | `display-platform-key` | Soketi client key |
| `SOKETI_APP_SECRET` | `display-platform-secret` | Soketi server secret |
| `NEXTAUTH_SECRET` | *(replace)* | NextAuth session/JWT signing secret |
| `NEXTAUTH_URL` | `http://localhost` | NextAuth canonical app URL |
| `BCRYPT_ROUNDS` | `12` | Password hashing cost |
| `SUPER_ADMIN_EMAIL` | `admin@your-domain.com` | Bootstrap super-admin account |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` | AI generation provider (model/prompt come from DB, not env) |
| `PEXELS_API_KEY` | *(secret)* | Stock image provider |
| `PIXABAY_API_KEY` | *(secret)* | Stock image provider |
| `OPENVERSE_API_KEY` | *(optional, blank)* | Stock image provider |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | *(secret)* | Google Calendar sync |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | *(secret)* | Google Calendar sync |
| `GOOGLE_CALENDAR_WEBHOOK_SECRET` | *(secret)* | Google Calendar push notifications |
| `GOOGLE_PLACES_API_KEY` | *(secret)* | Google Reviews widget |
| `OPENWEATHERMAP_API_KEY` | *(secret)* | Weather-triggered content |
| `MINIO_ENDPOINT` | `http://minio:9000` | Object storage endpoint |
| `MINIO_ACCESS_KEY` | `minioadmin` | Object storage access key |
| `MINIO_SECRET_KEY` | `minioadmin123` | Object storage secret key |
| `MINIO_BUCKET` | `display-platform-assets` | Object storage bucket name |
| `MINIO_PUBLIC_URL` | `http://localhost/assets` | Public URL prefix for served assets |
| `NEXT_PUBLIC_APP_URL` | `http://localhost` | Client-visible app URL |
| `NEXT_PUBLIC_SOKETI_HOST` | `localhost` | Client-visible real-time host |
| `NEXT_PUBLIC_SOKETI_KEY` | `display-platform-key` | Client-visible real-time key |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Billing |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Billing webhook verification |
| `STRIPE_STARTER_PRICE_ID` | `price_...` | Starter plan price |
| `STRIPE_PRO_PRICE_ID` | `price_...` | Pro plan price |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Client-side Stripe key |
| `PAIRING_CODE_TTL_SECONDS` | `300` | TV pairing code expiry |

**Rule of thumb (per `AGENTS.md`):** only secrets and connection endpoints belong
in env vars. Prompts, model names, plan limits, and feature gates must be
DB-driven — see Section 3 below.

---

## 2. Docker Compose Services (`docker/docker-compose.yml`)

| Service | Image (pinned) | Host port | Container port | Notes |
|---|---|---|---|---|
| `app` | built from local `Dockerfile` | — (proxied via nginx) | 3000 | Next.js app; depends on postgres, redis, soketi, minio |
| `postgres` | `postgres:17.9-bookworm@sha256:...` | `5433` | 5432 | DB `display_platform`, user/pass `display_platform` |
| `redis` | `redis:7.4.8-alpine@sha256:...` | `6380` | 6379 | Cache + pairing codes |
| `soketi` | `quay.io/soketi/soketi:...-16-alpine@sha256:...` | `6001` | 6001 | Uses Redis as backing store |
| `minio` | `minio/minio:RELEASE.2025-09-07T16-13-09Z@sha256:...` | `9010` (API), `9011` (console) | 9000 / 9001 | Root user/pass from `MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY` |
| `nginx` | `nginx:1.30.0-alpine@sha256:...` | `80` | 80 | Reverse proxy in front of app, soketi, minio; config at `docker/nginx/nginx.conf` |

**Host ports for postgres/redis/minio are remapped** from the documented
defaults (5432/6379/9000/9001) because this host already runs other Docker
projects bound to those ports. Container-internal ports and all
service-to-service networking (nginx → `app:3000`, nginx → `soketi:6001`,
nginx → `minio:9000`, soketi → `redis:6379`) are unchanged — only the
host-facing side moved. `.env.local` (gitignored) uses the remapped ports for
host-run tooling like the Prisma CLI.

Volumes: `pgdata`, `redisdata`, `miniodata` (all named, persisted).

All images are pinned to an exact tag **and** a digest — per
`.github/instructions/docker-pinning.instructions.md`, `latest` is never
allowed.

---

## 3. Database-Driven Settings (design, not yet migrated/seeded)

The architecture mandates that no platform behavior requires a code change —
everything below lives in Postgres and is edited through `/admin/settings`.
These models exist in [prisma/schema.prisma](prisma/schema.prisma) and the
tables are now **live** (migration `20260821130848_init` applied), but no
rows have been seeded yet — the seed values below are still design-only
until `prisma/seed.ts` (Task 1.3) exists and runs.

### 3.1 Settings tables

| Model | Purpose |
|---|---|
| `AppSetting` | Global, super-admin-only settings (one row per key) |
| `TenantSetting` | Per-tenant override of an `AppSetting` |
| `PromptTemplate` | Every AI prompt used by the platform (no prompt text in source code) |
| `TenantPromptOverride` | Per-tenant customization of a prompt |
| `FeatureFlagOverride` | Per-tenant feature grant outside their plan |
| `VerticalConfig` | Per-vertical (dental clinic, cloud hosting, retail, ...) field maps and defaults |

### 3.2 Seeded `AppSetting` defaults (live, `prisma/seed.ts`)

| Key | Default value | Category |
|---|---|---|
| `platform.name` | `"Display Platform"` | platform |
| `platform.support_email` | `""` | platform |
| `ai.default_model` | `"anthropic/claude-3.5-sonnet"` | ai |
| `ai.fallback_model` | `"openai/gpt-4o-mini"` | ai |
| `ai.image_provider` | `"pexels"` | ai |
| `ai.enable_image_ranking` | `true` | ai |
| `ai.max_candidates_per_slide` | `5` | ai |
| `media.max_upload_mb` | `200` | media |
| `media.allowed_mime_types` | `["image/jpeg","image/png","image/webp","image/gif","image/svg+xml","video/mp4","video/webm","application/pdf"]` | media |
| `features.public_template_library` | `true` | features |
| `features.template_publishing` | `true` | features |
| `features.smooth_setup_wizard` | `true` | features |
| `billing.stripe_enabled` | `true` | billing |
| `billing.trial_days` | `14` | billing |

### 3.3 Seeded `PromptTemplate` slugs (live)

| Slug | Purpose | Default model | Temp | Max tokens |
|---|---|---|---|---|
| `slide.generate` | Single slide generation | `anthropic/claude-3.5-sonnet` | 0.75 | 500 |
| `deck.generate` | Full deck generation | `anthropic/claude-3.5-sonnet` | 0.7 | 2000 |
| `announcement.generate` | Announcement generation | `anthropic/claude-3.5-sonnet` | 0.6 | 300 |
| `image.rank` | LLM ranking of image candidates | `anthropic/claude-3.5-sonnet` | 0.2 | 100 |
| `schedule.suggest` | Dayparting suggestions from appointment data | `anthropic/claude-3.5-sonnet` | 0.3 | 800 |
| `template.generate.batch` | Batch content-library generation | `anthropic/claude-3.5-sonnet` | 0.85 | 1500 |

Each prompt is resolved at runtime via `resolvePrompt(slug, clientId)` in
[lib/prompts.ts](lib/prompts.ts) — **implemented and tested**: tenant override →
global default (merged with `??`, not `||`), cached in Redis for 300s,
invalidated on write (`redis.del` after any `AppSetting`/`TenantSetting`/prompt
write — the "Redis Caching Hygiene" golden rule in `AGENTS.md`). Settings
resolution is the equivalent [lib/settings.ts](lib/settings.ts)
(`getSetting`/`setSetting`), same caching/invalidation rules. Both read from
[lib/db.ts](lib/db.ts) (Prisma) and [lib/redis.ts](lib/redis.ts) (ioredis) —
the shared singletons every future `lib/*.ts`/API route must reuse.

### 3.4 Settings UI surface (`/admin/settings`, planned)

| Path | Section | Editable by |
|---|---|---|
| `/admin/settings/general` | Name, city, vertical, timezone, brand voice | Tenant admin |
| `/admin/settings/branding` | Logo, colors, font | Tenant admin |
| `/admin/settings/prompts` | View/edit prompt templates + per-tenant overrides | Tenant admin |
| `/admin/settings/integrations` | API tokens, webhook URLs, Google credentials | Tenant admin |
| `/admin/settings/billing` | Plan, usage bars, generation log, Stripe portal | Tenant admin |
| `/admin/settings/features` | Feature flag overrides (view only) | Super admin |
| `/admin/settings/app` | Global platform settings, plan definitions | Super admin only |

---

## 4. Auth

`AdminUser` is a new model (migration `20260821133959_add_admin_user`,
added during Task 1.5 — the original schema had no login-credential table).
`clientId` is nullable: `null` means a platform super-admin, not tied to any
tenant; a set value means a tenant admin scoped to that `Client`.

| Setting | Value | Purpose |
|---|---|---|
| Session strategy | JWT | Required — `CredentialsProvider` can't use database sessions without a custom adapter |
| `SUPER_ADMIN_EMAIL` | `admin@your-domain.com` (`.env.local`) | Matched against `AdminUser.email` at sign-in to set `session.user.isSuperAdmin` |
| Seeded super-admin password | `dev-password-change-me` | **Local dev only**, hashed via `bcrypt` (`BCRYPT_ROUNDS`) in `prisma/seed.ts`'s `seedSuperAdmin()`. Change before any real deploy. |
| Login route | `POST /api/auth/callback/credentials` | Standard NextAuth v4 credentials flow |
| Protected paths | `/admin/*` | Enforced by `middleware.ts`; unauthenticated requests redirect to `/admin/login` (page not built yet — Phase 2/6) |

`lib/tenant.ts`'s `scopedPrisma(clientId)` auto-scopes every model with a
**required** `clientId` field. `Template`, `ImageCache`, and
`AiContentLibrary` have a **nullable** `clientId` (null = globally shared)
and are deliberately excluded — see the comment in `lib/tenant.ts`.

---

## 5. Usage & Billing Gates

`lib/usage.ts` implements the plan-enforcement layer referenced throughout
`.github/instructions/ai-generation.instructions.md`. Metric/feature keys
are TypeScript literal union types (`UsageMetric`, `FeatureFlag`), matching
the exact keys in the seeded `Plan.limits`/`Plan.features` (see the pricing
table in [PROGRAM.md](PROGRAM.md)) — mistyped keys fail to typecheck rather
than silently missing the gate.

| Function | Purpose |
|---|---|
| `checkAndIncrement(clientId, metric)` | Increments and enforces a monthly usage counter; `-1` in `Plan.limits` means unlimited |
| `checkFeature(clientId, feature)` | Returns whether the client's plan has a boolean feature enabled |
| `decrementUsage(clientId, metric)` | Rolls back a count after a failed outbound call (e.g. failed AI generation); floors at 0 |
| `getUsageSummary(clientId)` | Current-period `{ metric, current, limit }[]` for every metric in the client's plan |

Plan resolution (`Subscription.planSlug` → `Plan`) is cached in Redis for 5
minutes (`plan:{clientId}`) — a plan upgrade can appear stale for up to that
long, a documented tradeoff, not a bug. A client with no `Subscription` row
defaults to the `essential` plan (mirrors `Subscription.planSlug`'s own
schema default) — a judgment call made during Task 1.6 since no client has
had a real subscription yet.

---

## 6. Status

- Env vars and Docker Compose config: **live-validated.** All 6 services run
  healthy via `docker compose -f docker/docker-compose.yml up -d` (host ports
  for postgres/redis/minio remapped, see Section 2).
- Prisma settings models: **migrated and seeded.** `prisma/seed.ts` populates
  4 plans, 14 app settings, 6 prompt templates, 7 layout-preset templates,
  and 1 super-admin `AdminUser`, verified idempotent across repeated runs.
- Prisma client access: **`lib/db.ts`** is now the required entry point for
  any DB access — Prisma 7 removed schema-level `datasource.url` and requires
  an explicit driver adapter (`@prisma/adapter-pg`) at the `PrismaClient`
  constructor. Don't construct `PrismaClient` anywhere else.
- Redis client access: **`lib/redis.ts`** (`ioredis`) is the required entry
  point for any cache access, same dev-mode singleton pattern as `lib/db.ts`.
- `lib/settings.ts`, `lib/prompts.ts`: **implemented and tested.**
- Auth/tenant scoping: **implemented and tested** — see Section 4. Full
  login round-trip verified manually (`pnpm dev`): correct credentials
  produce a session with `isSuperAdmin: true`; wrong password produces no
  session. Settings UI and `/admin/login` page itself are still **not yet
  implemented** (staged for Phase 6 / Phase 2).
- `lib/usage.ts`: **implemented and tested** — see Section 5.
- **Phase 1 is complete.** Full wrap-up in
  [docs/phases/results/phase-1-result.md](docs/phases/results/phase-1-result.md).
- Test suite: **24 passing tests** across 7 files (`pnpm test`, `vitest`),
  including live integration tests against the seeded Postgres/Redis
  containers — no mocking of the database or cache layer.
