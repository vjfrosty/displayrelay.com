# Display Platform Master Orchestrator

This file is the planning hub for Phases 1-6. Use it to determine what is active, what is blocked, which persona to use, and which phase runbook to open next. Use the phase files for detailed execution instructions.

## Current State

**Current Phase:** Phase 1 - Core Infrastructure & Config Layer  
**Current Task:** TASK 1.2 - Prisma Schema — Core Tables  
**Status:** In Progress — Task 1.1 repo outputs and Task 1.2 schema/config are implemented, but live validation is blocked  
**Primary Runbook:** `docs/phases/phase-1-core.md`  
**Blocked By:** Docker daemon / compose runtime unavailable in this session, so Postgres at `postgres:5432` is unreachable  
**Next Validation Target:** `docker compose -f docker/docker-compose.yml up -d` succeeds, `docker compose -f docker/docker-compose.yml ps` shows all 6 services running, and `corepack pnpm@10.33.2 prisma migrate dev --name init --config=./prisma.config.ts` succeeds.

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

## Next Up: TASK 1.2

- **Task Description:** Close the outstanding live Docker Compose validation from Task 1.1 and complete the initial Prisma migration for Task 1.2.
- **Agent To Use:** `Infrastructure`
- **Prerequisites:** Docker daemon accessible from this session, `.env.local` populated, and the existing repo scaffold unchanged.
- **Architecture Context:** `Display Relay_Project Setup & Architecture.md` Sections 33.1, 33.2, 33.3, 8, 4.2, 5.1, and 9.
- **Vibe Guide Context:** Phase 1 / Task 1.1 and Task 1.2 cards in `display-platform-vibe-coding-guide.docx.md`.
- **Primary Runbook:** `docs/phases/phase-1-core.md`
- **Repo State:** Task 1.1 files exist and `docker compose config` passes. Task 1.2 Prisma files exist and `prisma validate --config=./prisma.config.ts`, `prisma format --config=./prisma.config.ts`, and `pnpm typecheck` pass.
- **Acceptance Target:** `docker compose ps` shows all 6 services running, `curl localhost:9001` returns the MinIO login page, `curl localhost:6001` returns a Soketi response, and `prisma migrate dev` succeeds.
- **Immediate Validation Check:** Run `docker compose -f docker/docker-compose.yml up -d`, `docker compose -f docker/docker-compose.yml ps`, `curl localhost:9001`, `curl localhost:6001`, then `corepack pnpm@10.33.2 prisma migrate dev --name init --config=./prisma.config.ts`.
- **Next Task If Passed:** TASK 1.3 - Prisma Seed File

## Phase Tracking

### Phase 1: Core Infrastructure & Config Layer
- [ ] **Task 1.1:** Docker Compose Full Stack — repo files created and `docker compose config` passes; live service validation pending Docker access
- [ ] **Task 1.2:** Prisma Schema — Core Tables — schema/config validation passes; initial migration pending reachable Postgres
- [ ] **Task 1.3:** Prisma Seed File
- [ ] **Task 1.4:** `lib/settings.ts` and `lib/prompts.ts`
- [ ] **Task 1.5:** Auth — NextAuth.js + API Bearer Tokens
- [ ] **Task 1.6:** `lib/usage.ts` — Billing & Usage Gates
- [ ] **Phase 1 Wrap-up:** Generate `docs/phases/results/phase-1-result.md`

### Phase 2: Screens, Media & Basic Admin UI
- [ ] **Task 2.1:** Screen Management — Pairing + List
- [ ] **Task 2.2:** Media Library — Upload to MinIO
- [ ] **Phase 2 Wrap-up:** Generate `docs/phases/results/phase-2-result.md`

### Phase 3: Slide Editor
- [ ] **Task 3.1:** EditorState Type + `lib/editor.ts` Renderer
- [ ] **Task 3.2:** Editor Canvas — React Component
- [ ] **Task 3.3:** Block Types — Text, Image, Shape, Logo
- [ ] **Task 3.4:** Editor Save Flow + Template API
- [ ] **Phase 3 Wrap-up:** Generate `docs/phases/results/phase-3-result.md`

### Phase 4: Playlists, Schedules & Real-Time
- [ ] **Task 4.1:** Playlists — CRUD + Assignment
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

- Tenant isolation verified.
- Prompt-from-DB behaviour verified.
- Settings cache invalidation verified.
- Usage-gate behaviour verified.

### Before Starting Phase 3

- Cross-tenant screens and media isolation verified.
- Pairing codes expire correctly and cannot be reused.
- Media MIME validation enforced.
- Media size validation enforced before upload.

### Before Starting Phase 4

- `renderEditorHtml()` is pure for identical `EditorState` input.
- XSS sanitization verified for editor text content.
- Percentage-based positioning is preserved across editor interactions.
- Image-search usage gating is enforced before provider calls.

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