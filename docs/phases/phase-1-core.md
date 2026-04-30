# Phase 1 — Core Infrastructure & Config Layer (Weeks 1–4)

Phase 1 builds the foundation everything else sits on. The config and settings layer must be built before any feature work because every later phase reads from `getSetting()` and `resolvePrompt()`. Do not skip the seed file, and do the tasks in order shown.

## Phase 1 Dependencies

- Docker and Docker Compose installed.
- Local environment ready for Postgres, Redis, Soketi, MinIO, and Nginx.
- `.env.local` populated from the architecture document before Task 1.1.

## Recommended Packages And Versions

Use these pinned versions as the baseline for every later phase unless a later phase adds an extra package.

| Area | Package or service | Recommended version | Recommendation |
|---|---|---|---|
| Runtime | Node.js | 24.15.0 LTS | Use the same runtime locally, in CI, and in containers where possible. |
| Package manager | pnpm | 10.33.2 | Pin via the `packageManager` field in `package.json`. |
| App framework | `next` | 16.2.4 | Use this instead of the older `14.x` target from the architecture draft. |
| UI runtime | `react` and `react-dom` | 19.2.5 | Keep React aligned with the Next.js major. |
| Language | `typescript` | 6.0.3 | Pin exactly to avoid compiler drift during the build-out. |
| Auth | `next-auth` | 4.24.14 | Use the maintained v4 line and harden callbacks and logging. |
| Password hashing | `bcrypt` | 6.0.0 | Use for credentials auth in Task 1.5. |
| ORM | `prisma` and `@prisma/client` | 7.8.0 | Keep the Prisma CLI and generated client on the same version. |
| Database | PostgreSQL | 17.9 | Prefer this over PostgreSQL 15 for a fresh build. |
| Cache | Redis | 7.4.8 | Stay on the stable 7.4.x line. |
| Real-time | Soketi | 1.6.1 | Pin an exact image tag and digest. Do not use `latest`. |
| Object storage | MinIO | `RELEASE.2025-09-07T16-13-09Z` | Pin an exact image tag and digest before deployment. |
| Reverse proxy | Nginx | 1.30.0 | Keep `proxy_buffering off` for SSE traffic. |

## Related Targeted Instructions

- `.github/instructions/docker-pinning.instructions.md` for exact image tags, digests, and compose discipline.
- `.github/instructions/multi-tenancy.instructions.md` for `scopedPrisma(clientId)`, auth boundaries, and tenant-safe route handling.
- `.github/instructions/ai-generation.instructions.md` for prompt, model, and usage-gating rules used by settings/prompt utilities.
- `.github/instructions/realtime-cache.instructions.md` for Redis invalidation and Soketi/cache hygiene.

Keep the runbook focused on task order, concrete outputs, validations, and phase gates. The reusable coding rules above now live in the targeted instruction files.

## TASK 1.1 Docker Compose Full Stack

**Copilot Agent:** `Infrastructure`  
**Context To Paste:** `Display Relay_Project Setup & Architecture.md` Sections 33.1, 33.2, 33.3, and 8. Docker Compose with 6 services: app, postgres, redis, soketi, minio, and nginx.

**Inputs (what must exist first):**
- Docker and Docker Compose installed.
- Domain or localhost ready.
- `.env.local` populated from Section 8.

**Outputs (what this task produces):**
- `docker/docker-compose.yml`
- `docker/nginx/nginx.conf`
- `.env.example`
- All services start with `docker compose up`

**Recommended Docker image pins for this task:**

| Service | Recommended image pin |
|---|---|
| app base image | `node:24.15.0-bookworm-slim@sha256:<fill-me>` |
| postgres | `postgres:17.9-bookworm@sha256:<fill-me>` |
| redis | `redis:7.4.8-alpine@sha256:<fill-me>` |
| soketi | `quay.io/soketi/soketi:e446df8e3e06b8430d75cf58555bc409bf240a4e-16-alpine@sha256:<fill-me>` |
| minio | `minio/minio:RELEASE.2025-09-07T16-13-09Z@sha256:<fill-me>` |
| nginx | `nginx:1.30.0-alpine@sha256:<fill-me>` |

Use exact tags plus digests in `docker/docker-compose.yml`. Replace every `sha256:<fill-me>` placeholder before the first deploy. Soketi publishes Quay tags in commit-based form, so keep the tested tag and record the matching app release in the phase result.

**Copilot prompts — paste these in sequence:**
1. Create `docker/docker-compose.yml` exactly matching Section 33.2. Include all 6 services and use the pinned image references above instead of major-only tags or `latest`.
2. Create `docker/nginx/nginx.conf` matching Section 33.3. Add `proxy_buffering off` to the `/` location block.
3. Create `.env.example` with all variables from Section 8 and placeholder values.
4. Run `docker compose up -d` and verify postgres on 5432, redis on 6379, soketi on 6001, and the MinIO console on 9001.
5. Run `docker compose config` and verify no service image uses `latest`, a major-only tag, or an unfilled digest placeholder.

**Done when:**
- `docker compose ps` shows all 6 services as running.
- `curl localhost:9001` returns the MinIO login page.
- `curl localhost:6001` returns a Soketi response.

**Common pitfalls:**
- Port 5432 conflicts with a local Postgres install. Stop the local process first.
- MinIO requires `MINIO_ROOT_USER` to be at least 3 characters.
- Soketi must use `SOKETI_REDIS_HOST=redis`, not `localhost`.
- `postgres:17`, `redis:7`, `nginx:stable`, or any `latest` tag is not good enough for this task.
- Leaving `sha256:<fill-me>` in the compose file is acceptable only while drafting. Replace it before any shared environment deploy.

**Validation before moving on:**
- Nginx includes `proxy_buffering off` for SSE compatibility.
- All six services remain healthy after restart.
- `docker compose config` shows exact image pins for postgres, redis, soketi, minio, and nginx.

---

## TASK 1.2 Prisma Schema — Core Tables

**Copilot Agent:** `Infrastructure`  
**Context To Paste:** `Display Relay_Project Setup & Architecture.md` Section 9 (complete table list), Section 4.2 (billing schema), Section 5.1 (settings schema), and Section 9.2 (template schema).

**Inputs (what must exist first):**
- Task 1.1 complete.
- `DATABASE_URL` present in `.env.local`.

**Outputs (what this task produces):**
- `prisma/schema.prisma` with all 33 tables.
- `pnpm prisma migrate dev --name init` succeeds.
- All required `@@index` and `@@unique` directives present.

**Copilot prompts — paste these in sequence:**
1. Create `prisma/schema.prisma`. Start with the billing models from Section 4.2: `Plan`, `Subscription`, `UsageRecord`, and `GenerationLog`.
2. Add the config models from Section 5.1: `AppSetting`, `TenantSetting`, `PromptTemplate`, `TenantPromptOverride`, `FeatureFlagOverride`, and `VerticalConfig`.
3. Add the template models from Section 9.2: `Template`, `TemplateVersion`, `TemplateTag`, `TemplateRating`, and `TemplateFavourite`.
4. Add the remaining content tables: `Screen`, `MediaAsset`, `MediaFolder`, `Playlist`, `PlaylistItem`, `Schedule`, `ScheduleSlot`, `Slide`, `Deck`, `AiContentLibrary`, and `AppIntegration`.
5. Add `@@index` on every field used in `WHERE` clauses: `clientId`, `status`, `planSlug`, `metric + period`, `tag`, and `vertical`.
6. Run `pnpm prisma migrate dev --name init`.

**Done when:**
- `pnpm prisma studio` opens and shows all 33 tables.
- No TypeScript errors remain in `prisma/schema.prisma`.
- `migrate dev` completes with no errors.

**Common pitfalls:**
- Missing `@@unique([clientId, key])` on `TenantSetting` breaks upsert logic later.
- Missing `@@unique([clientId, metric, period])` on `UsageRecord` causes duplicate usage rows.
- `Template.editorState` must be `Json`, not `String`.

**Validation before moving on:**
- Verify `TenantSetting` and `UsageRecord` composite uniqueness is present.
- Verify template state fields use the correct Prisma types.

---

## TASK 1.3 Prisma Seed File

**Copilot Agent:** `Infrastructure`  
**Context To Paste:** `Display Relay_Project Setup & Architecture.md` Section 5.2 (app settings), Section 5.3 (prompt templates), and Section 4.1 (plan definitions). This is the most important seed file in the project.

**Inputs (what must exist first):**
- Task 1.2 complete.
- All Phase 1 tables exist.

**Outputs (what this task produces):**
- `prisma/seed.ts`
- `package.json` seed script
- Plans, settings, prompt templates, and layout preset templates seeded idempotently

**Copilot prompts — paste these in sequence:**
1. Create `prisma/seed.ts`. Seed the 4 plans: Essential, Professional, Premium, and Enterprise with limits JSON exactly from Section 4.1.
2. Seed all app settings from Section 5.2 using `upsert` so the seed is idempotent.
3. Seed the 6 prompt templates from Section 5.3 exactly: `slide.generate`, `deck.generate`, `announcement.generate`, `image.rank`, `schedule.suggest`, and `template.generate.batch`.
4. Seed the 7 layout preset templates as `Template` rows with `clientId: null` and `category: "layout-preset"`.
5. Add the `seed` script to `package.json`: `prisma db seed`.
6. Run `pnpm prisma db seed` and verify row counts.

**Done when:**
- `prompt_templates` count is 6.
- `plans` count is 4.
- `templates` count for `category = 'layout-preset'` is 7.
- Running the seed twice does not duplicate rows.

**Common pitfalls:**
- Use `upsert`, not `create` or `createMany`, or reruns will fail.
- Prompt template `variables` must be valid JSON, not a TypeScript object literal.
- `defaultModel` must match the configured model string exactly.

**Validation before moving on:**
- Seed the database twice and confirm the counts stay stable.
- Verify every seeded prompt template has the expected variables map.

---

## TASK 1.4 `lib/settings.ts` and `lib/prompts.ts`

**Copilot Agent:** `Infrastructure`  
**Context To Paste:** `Display Relay_Project Setup & Architecture.md` Section 5.4 (settings resolution) and Section 5.5 (prompt resolution). These are the two most-used utility files in the codebase.

**Inputs (what must exist first):**
- Task 1.3 complete.
- Database seeded.
- Redis running from Task 1.1.

**Outputs (what this task produces):**
- `lib/settings.ts`
- `lib/prompts.ts`
- Unit and integration tests for settings and prompt resolution

**Copilot prompts — paste these in sequence:**
1. Create `lib/settings.ts` exactly matching Section 5.4. Cache keys: `setting:global:key` or `setting:{clientId}:key`. TTL: 300 seconds.
2. Create `lib/prompts.ts` exactly matching Section 5.5. Cache keys: `prompt:global:slug` or `prompt:{clientId}:slug`. TTL: 300 seconds.
3. Write a unit test for `renderPrompt` replacing `{{vertical}}` with `dental-clinic`.
4. Write an integration test for `getSetting("platform.name")` returning `Display Platform` from seed data.
5. Write an integration test for `resolvePrompt("slide.generate")` returning a non-empty `systemPrompt`.

**Done when:**
- All tests pass for `lib/settings` and `lib/prompts`.
- `getSetting` returns a cached value on the second call.
- `resolvePrompt` correctly merges a tenant override over the global base template.

**Common pitfalls:**
- `setSetting()` must invalidate Redis after the DB write.
- `resolvePrompt()` merge logic must use `??`, not `||`, so null override fields do not erase valid base values.
- `renderPrompt()` must not throw on missing variables; replace them with empty strings.

**Validation before moving on:**
- Verify cache invalidation returns the new setting value after an update.
- Verify tenant overrides do not erase non-overridden base prompt fields.

---

## TASK 1.5 Auth — NextAuth.js + API Bearer Tokens

**Copilot Agent:** `Auth`  
**Context To Paste:** `Display Relay_Project Setup & Architecture.md` Section 21. Admin sessions use NextAuth, screen auth uses per-screen bearer tokens, and super-admin is controlled by `SUPER_ADMIN_EMAIL`.

**Inputs (what must exist first):**
- Task 1.2 complete.
- `Client` and `ApiToken` tables exist.
- `NEXTAUTH_SECRET` present in `.env.local`.

**Outputs (what this task produces):**
- `app/api/auth/[...nextauth]/route.ts`
- `lib/auth.ts`
- `lib/tenant.ts`
- `app/middleware.ts`
- `withClientAuth()` helper for client-scoped API routes

**Copilot prompts — paste these in sequence:**
1. Create `app/api/auth/[...nextauth]/route.ts` with `CredentialsProvider`. Hash passwords with bcrypt using `BCRYPT_ROUNDS` from env.
2. Create `lib/auth.ts` exporting `getSession()`, `isAdmin(session)`, and `isSuperAdmin(session)`.
3. Create `lib/tenant.ts` exporting `scopedPrisma(clientId)` using Prisma middleware that injects `clientId` into `findMany`, `findFirst`, `update`, and `delete` where clauses.
4. Create `middleware.ts` protecting `/admin/*` and redirecting unauthenticated users to `/admin/login`.
5. Create a `withClientAuth(handler)` helper validating that the session belongs to the requested `clientId`.

**Done when:**
- `GET /admin` redirects to `/admin/login` when not authenticated.
- `GET /admin` redirects to `/admin/welcome` when authenticated.
- `GET /api/v1/clients/wrong-client/screens` returns `403` when the session belongs to a different client.

**Common pitfalls:**
- In App Router, `authOptions` must stay in the route handler file, not a separate module.
- `scopedPrisma()` must scope `update` and `delete`, not only read operations.
- Middleware matchers must exclude `/api/auth/*` or you create a login loop.

**Validation before moving on:**
- Create clients A and B, authenticate as A, and verify B data is inaccessible.
- Verify bearer-token path support exists for screens without breaking admin auth.

---

## TASK 1.6 `lib/usage.ts` — Billing & Usage Gates

**Copilot Agent:** `Infrastructure`  
**Context To Paste:** `Display Relay_Project Setup & Architecture.md` Section 4.3 (`checkAndIncrement`) and Section 4.4 (UI enforcement). This code runs before AI generation and gated feature use.

**Inputs (what must exist first):**
- Tasks 1.2, 1.3, and 1.4 complete.
- Tables seeded and settings working.

**Outputs (what this task produces):**
- `lib/usage.ts`
- `checkAndIncrement()`
- `checkFeature()`
- `getUsageSummary()`
- `decrementUsage()`
- Tests for usage and feature gating

**Copilot prompts — paste these in sequence:**
1. Create `lib/usage.ts` implementing `checkAndIncrement(clientId, metric)` exactly matching Section 4.3. Use `new Date().toISOString().slice(0, 7)` for the period key.
2. Implement `checkFeature(clientId, feature)` to load the plan from DB, cache it for 5 minutes in Redis, and return whether `plan.features[feature] === true`.
3. Implement `getUsageSummary(clientId)` returning current-period `UsageRecord` rows plus plan limits for comparison.
4. Add `decrementUsage(clientId, metric)` so failed AI calls can roll usage back.
5. Write tests proving a 100% limit blocks usage and an 80% limit still allows usage with a warning.

**Done when:**
- On an Essential plan, `checkAndIncrement("ai_slides")` allows 10 calls and blocks the 11th.
- `checkFeature("google_reviews")` returns false for Essential.
- `getUsageSummary()` returns current counts alongside plan limits.

**Common pitfalls:**
- Plan limits are cached for 5 minutes, so upgrades can appear stale briefly. Document this.
- Metric keys must match the limits JSON exactly, for example `ai_slides`, not `aiSlides`.
- Compute the period key server-side. Never trust a client-supplied period.

**Validation before closing the phase:**
- Verify a blocked usage path returns `allowed: false` when the plan limit is exceeded.
- Verify feature checks and summary values reflect seeded plan data.

## Phase 1 Completion Gate

Do not move to Phase 2 until all of the following are true:

- Tenant isolation is verified.
- Prompt-from-DB behaviour is verified by deleting the `slide.generate` prompt and confirming no hardcoded fallback exists.
- Settings cache invalidation is verified.
- Usage-gate behaviour is verified for both allowed and blocked states.
- `docs/phases/results/phase-1-result.md` is generated with architecture, schema changes, validation results, and follow-up notes.