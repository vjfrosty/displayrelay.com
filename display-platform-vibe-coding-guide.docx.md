

**Display Platform**

Vibe Coding Guide

Step-by-step AI-assisted build plan for GitHub Copilot \+ VS Code

| Tool | GitHub Copilot \+ VS Code (Chat, Inline, Agent) |
| :---- | :---- |
| **Level** | Intermediate — Next.js, TypeScript, Prisma |
| **Stack** | Next.js 14 · PostgreSQL · Redis · Soketi · MinIO · OpenRouter |
| **Phases** | 6 phases, 30 self-contained tasks |
| **Hardest parts** | Multi-tenancy, Real-time SSE, AI pipeline, Slide Editor |
| **Created** | March 2026 |

| How to use this guide Each TASK CARD is self-contained. You should be able to hand one card to Copilot and get a working result. The "Copilot prompts" row contains exact chat prompts — paste them word-for-word into Copilot Chat. The "Context to paste" row tells you which README sections to attach before prompting. The "Done when" row is your acceptance test. Do not move to the next card until all checks pass. Red boxes are real bugs you will hit — read them before starting each task. |
| :---- |

# **1\. Vibe Coding Philosophy for This Project**

This codebase has one unusual property that changes how you should work with Copilot: everything is database-driven. Prompts, feature flags, AI models, usage limits — none of it is hardcoded. That means Copilot will often try to write constants and .env lookups where you need DB reads. The rule throughout this guide is: if it controls behaviour, it belongs in the DB.

## **1.1 The Golden Rules**

* Never hardcode prompt text. Always resolve from PromptTemplate via resolvePrompt(slug, clientId).

* Never hardcode model names. They come from the resolved prompt's defaultModel field.

* Never hardcode plan limits. Always call checkAndIncrement() from lib/usage.ts.

* Never hardcode feature gates. Always call checkFeature() from lib/usage.ts.

* All tenant queries must be scoped. Use scopedPrisma(clientId) from lib/tenant.ts.

* Real-time means Soketi. Never use polling for user-triggered updates.

## **1.2 Copilot Modes to Use**

| Mode | When to use it |
| :---- | :---- |
| **Copilot Chat (Ctrl+Alt+I)** | Planning, architecture questions, explaining patterns. Paste context from this guide before prompting. |
| **Inline Copilot (Tab)** | Filling in implementation details, completing functions you started writing. |
| **Copilot Agent (/new, /fix)** | Creating new files, fixing test failures, refactoring. Give it the task card as context. |
| **@workspace** | Questions about your existing code. Use once you have 3+ files built. |
| **\#file reference** | Reference a specific file in chat: \#lib/settings.ts — stops Copilot hallucinating its contents. |

## **1.3 Context Template — Use This Every Session**

Start every new Copilot Chat session by pasting this block, then add the task-specific context below it:

| Standard session opener — paste this first, every time You are helping build Display Platform, a self-hosted smart TV display system. Tech stack: Next.js 14 App Router, TypeScript, Prisma ORM, PostgreSQL, Redis, Soketi (real-time), MinIO (assets), OpenRouter (AI). Auth via NextAuth.js. Package manager: pnpm. Core rule: all AI prompts, model names, feature flags, usage limits, and platform settings are stored in the database. Never hardcode them. All Prisma queries must be scoped to a clientId (multi-tenant). Use scopedPrisma(clientId) from lib/tenant.ts. API routes follow /api/v1/clients/:clientId/... convention. I am an intermediate TypeScript/Next.js developer. Explain non-obvious patterns briefly. |
| :---- |

# **2\. AI Personas — Which Bot for Each Phase**

Each phase needs a different system prompt. Copy the relevant persona block into Copilot Chat at the start of each phase session.

## **Persona A — Infrastructure & Schema Bot**

Use for: Phase 1 tasks (Docker, Prisma, seed, lib/ utilities)

| Persona A prompt — paste into Copilot Chat You are a backend infrastructure engineer. You write Prisma schemas, Docker Compose files, and TypeScript utility libraries. Your code is production-ready: you always add indexes, use transactions where needed, and cache hot reads in Redis with a 5-minute TTL. You always add JSDoc to exported functions. When writing Prisma models, you include @@index directives for any field used in WHERE clauses. You never use any\! — always type properly. |
| :---- |

## **Persona B — Auth & Multi-Tenancy Bot**

Use for: Auth tasks, scopedPrisma, middleware, bearer tokens

| Persona B prompt — paste into Copilot Chat You are a security-focused Next.js developer specialising in multi-tenant SaaS. You always scope database queries to a clientId. You never return data from tenant A to tenant B. You write NextAuth.js configuration correctly for App Router (authOptions in a route handler, not pages/api). For API routes, you write a withAuth(handler, { requireClientId: true }) wrapper that validates both the session and that the session user belongs to the requested clientId. You always validate input with Zod. |
| :---- |

## **Persona C — Real-Time & SSE Bot**

Use for: Soketi integration, SSE gateway, screen heartbeat

| Persona C prompt — paste into Copilot Chat You are an expert in real-time web systems using Soketi (self-hosted Pusher-compatible). The platform uses Server-Sent Events (SSE) via a Next.js route at /api/v1/clients/:clientId/events. Soketi runs at SOKETI\_HOST:SOKETI\_PORT. You know that SSE requires: response.headers Content-Type text/event-stream, Cache-Control no-cache, Connection keep-alive, and that the stream must send a comment (: keep-alive) every 30s or proxies close it. You never use WebSockets directly — always via Soketi's Pusher-compatible API from lib/soketi.ts. |
| :---- |

## **Persona D — AI Pipeline Bot**

Use for: OpenRouter integration, prompt resolution, slide generation, image provider

| Persona D prompt — paste into Copilot Chat You are an AI integration engineer. All prompts are stored in the PromptTemplate database table and resolved via resolvePrompt(slug, clientId) from lib/prompts.ts. You never write prompt strings in code. The AI API is OpenRouter at https://openrouter.ai/api/v1/chat/completions. You always: (1) resolve the prompt from DB, (2) check usage with checkAndIncrement(), (3) render variables with renderPrompt(), (4) call OpenRouter, (5) log the result in GenerationLog. Every generation must be atomic: if usage increment succeeds but the API call fails, you roll back the usage count. |
| :---- |

## **Persona E — Canvas Editor Bot**

Use for: Slide editor, Fabric.js / React canvas, block components, editor state serialization

| Persona E prompt — paste into Copilot Chat You are a React canvas/editor specialist. The slide editor stores its state as an EditorState JSON object (defined in types/editor.ts). It renders to HTML via renderEditorHtml() in lib/editor.ts. You use percentage-based positioning (x, y, width, height as % of canvas) so slides are resolution-independent. You never store absolute pixel values in EditorState. The canvas is 16:9 ratio (1920x1080 base). Block types are: text, image, shape, logo, qr, video. You always sort blocks by zIndex before rendering. CSS custom properties (--color-primary etc.) are used for branding so themes apply automatically. |
| :---- |

## **Persona F — UI & Component Bot**

Use for: Admin pages, React components, Tailwind styling, forms

| Persona F prompt — paste into Copilot Chat You are a Next.js App Router UI developer. You write React Server Components where possible, Client Components only when you need useState/useEffect/event handlers — always add "use client" at the top. You use Tailwind CSS for all styling, never inline style objects unless overriding a library. You build accessible forms (label \+ htmlFor). Error states and loading states are always handled. You never fetch data in a Client Component — use server actions or API routes with SWR/React Query in the client. |
| :---- |

# **3\. Tech Stack Primer — What You Need to Know**

You said you are intermediate with Next.js, Prisma, and TypeScript. Here are the specific patterns this project uses that differ from typical tutorials.

## **3.1 Next.js App Router — Key Patterns**

| Pattern | How it works here |
| :---- | :---- |
| **API routes** | Live at app/api/... and export named functions: export async function GET(req, { params }) {} |
| **Route params** | Use const { clientId } \= await params — note: params is async in Next 14 |
| **Server Actions** | For form submissions: export async function createScreen(formData: FormData) {} with "use server" |
| **Middleware** | middleware.ts at project root — use it for auth checks on /admin/\* routes |
| **Dynamic imports** | Heavy libs (Fabric.js, canvas) must be: const fabric \= await import('fabric') inside a Client Component |

## **3.2 Prisma — Multi-Tenant Pattern**

Every query in this project is scoped. lib/tenant.ts exports a scopedPrisma(clientId) function that returns a Prisma client with automatic clientId filtering applied via Prisma middleware. You never call prisma.screen.findMany() — you always call scopedPrisma(clientId).screen.findMany().

// lib/tenant.ts pattern

export function scopedPrisma(clientId: string) {

  const client \= new PrismaClient()

  client.$use(async (params, next) \=\> {

    if (params.action \=== 'findMany') {

      params.args.where \= { ...params.args.where, clientId }

    }

    return next(params)

  })

  return client

}

## **3.3 Redis — Caching Pattern**

Settings and prompts are cached in Redis for 5 minutes. The key pattern is: setting:global:key, setting:{clientId}:key, prompt:global:slug, prompt:{clientId}:slug. When you update a setting via the API, you must call redis.del(cacheKey) after the DB write. Copilot will often forget this — check every setSetting() call.

## **3.4 Soketi — Real-Time Pattern**

Soketi is a self-hosted Pusher-compatible WebSocket server. You send events from the server via lib/soketi.ts. TV screens subscribe via the Pusher JS client. The channel name convention is: client-{clientId}. Events are defined in Section 19 of the README.

// lib/soketi.ts — server side push

import Pusher from 'pusher'

export const soketi \= new Pusher({ host: process.env.SOKETI\_HOST, ... })

export async function broadcast(clientId: string, event: string, data: object) {

  await soketi.trigger(\`client-${clientId}\`, event, data)

}

## **3.5 The Four Hardest Parts — Upfront Warnings**

| Multi-tenancy — the \#1 source of bugs Forgetting to scope a query lets tenant A see tenant B's data. Every Prisma query needs clientId. The fix: always use scopedPrisma(clientId), never use the global prisma import in route handlers. Test: after building any list API, create 2 tenants, add data to tenant A, verify tenant B gets empty array. |
| :---- |

| Real-time SSE — the \#1 connection issue Nginx buffers SSE responses by default, breaking the stream. You must add proxy\_buffering off to the Nginx location block. SSE connections close after 60s behind most reverse proxies. Send a comment every 25s: res.write(': keep-alive\\n\\n') Next.js App Router: SSE needs a ReadableStream response, not a normal Response. See task card for pattern. |
| :---- |

| AI pipeline — the \#1 logic error Copilot will hardcode prompt strings. Every prompt must come from resolvePrompt(). Grep for backtick prompts before each commit. Usage rollback: if you increment usage and the AI call fails, you must decrement. Wrap both in a try/catch with a finally block. OpenRouter returns different error shapes for rate limits vs model errors — always check res.ok before parsing. |
| :---- |

| Slide Editor — the \#1 performance trap Fabric.js cannot be imported server-side (it needs DOM). Always dynamic import it inside a useEffect or "use client" component. EditorState uses percentage positions (0-100). Never store pixel values — they break on different screen sizes. The renderEditorHtml() function must produce identical output every time for the same EditorState. No Date.now(), no Math.random(). |
| :---- |

| PHASE 1 — Core Infrastructure & Config Layer  (Weeks 1–4) |
| :---- |

Phase 1 builds the foundation everything else sits on. The config and settings layer must be built before any feature work — every later phase reads from getSetting() and resolvePrompt(). Do not skip the seed file.

| TASK 1.1  Docker Compose Full Stack |  |
| :---- | :---- |
| **Copilot Persona** Persona A (Infrastructure Bot) \+ paste Section 33.2 and 33.3 as context | **Context to paste into Copilot** README sections 33.1, 33.2, 33.3, 8 (env vars). Docker Compose with 6 services: app, postgres, redis, soketi, minio, nginx. |
| **Inputs (what must exist first)** Docker and Docker Compose installed Domain or localhost ready .env.local with all vars from Section 8 | **Outputs (what this task produces)** docker-compose.yml in /docker/ nginx.conf with correct upstream blocks All services start with docker compose up |
| **Copilot prompts — paste these in sequence** **1\.**  Create docker/docker-compose.yml exactly matching Section 33.2. Include all 6 services. **2\.**  Create docker/nginx/nginx.conf matching Section 33.3. Add proxy\_buffering off to the / location block (SSE fix). **3\.**  Create .env.example with all variables from Section 8, values set to placeholder strings. **4\.**  Run docker compose up \-d and verify: postgres on 5432, redis on 6379, soketi on 6001, minio console on 9001\. |  |
| **✓ Done when...** docker compose ps shows all 6 services as running curl localhost:9001 returns MinIO login page curl localhost:6001 returns Soketi response | **⚠ Common pitfalls** Port 5432 conflict if local Postgres is running — stop it first MinIO requires MINIO\_ROOT\_USER min 3 chars Soketi needs SOKETI\_REDIS\_HOST set to redis (the service name, not localhost) |

| TASK 1.2  Prisma Schema — Core Tables |  |
| :---- | :---- |
| **Copilot Persona** Persona A (Infrastructure Bot) \+ paste Section 9 table list and Section 5.1 schema as context | **Context to paste into Copilot** README Section 9 (complete table list), Section 4.2 (billing schema), Section 5.1 (settings schema), Section 9.2 (template schema). |
| **Inputs (what must exist first)** Task 1.1 complete DATABASE\_URL in .env.local | **Outputs (what this task produces)** prisma/schema.prisma with all 33 tables pnpm prisma migrate dev \--name init succeeds All @@index directives added |
| **Copilot prompts — paste these in sequence** **1\.**  Create prisma/schema.prisma. Start with the billing models from Section 4.2 (Plan, Subscription, UsageRecord, GenerationLog). **2\.**  Add all config models from Section 5.1 (AppSetting, TenantSetting, PromptTemplate, TenantPromptOverride, FeatureFlagOverride, VerticalConfig). **3\.**  Add the Template, TemplateVersion, TemplateTag, TemplateRating, TemplateFavourite models from Section 9.2. **4\.**  Add remaining content tables: Screen, MediaAsset, MediaFolder, Playlist, PlaylistItem, Schedule, ScheduleSlot, Slide, Deck, AiContentLibrary, AppIntegration. **5\.**  Add @@index on every field used in WHERE clauses (clientId, status, planSlug, metric+period, tag, vertical). **6\.**  Run: pnpm prisma migrate dev \--name init |  |
| **✓ Done when...** pnpm prisma studio opens and shows all 33 tables No TypeScript errors in prisma/schema.prisma migrate dev completes with no errors | **⚠ Common pitfalls** Missing @@unique(\[clientId, key\]) on TenantSetting breaks upsert logic later Missing @@unique(\[clientId, metric, period\]) on UsageRecord causes duplicate usage rows Template.editorState must be Json type, not String |

| TASK 1.3  Prisma Seed File |  |
| :---- | :---- |
| **Copilot Persona** Persona A (Infrastructure Bot) \+ paste Sections 5.2 and 5.3 in full as context | **Context to paste into Copilot** README Section 5.2 (app settings), Section 5.3 (prompt templates), Section 4.1 (plan definitions). This is the most important seed file you will ever write. |
| **Inputs (what must exist first)** Task 1.2 complete — all tables exist | **Outputs (what this task produces)** prisma/seed.ts that seeds: 4 plans, 15+ app settings, 6 prompt templates, layout preset templates pnpm prisma db seed runs cleanly All prompt templates have correct variable maps |
| **Copilot prompts — paste these in sequence** **1\.**  Create prisma/seed.ts. Seed the 4 plans (Essential, Professional, Premium, Enterprise) with limits JSON exactly from Section 4.1. **2\.**  Seed all app settings from Section 5.2. Use upsert so the seed is idempotent (re-runnable without duplicating rows). **3\.**  Seed all 6 prompt templates from Section 5.3 exactly: slide.generate, deck.generate, announcement.generate, image.rank, schedule.suggest, template.generate.batch. **4\.**  Seed the 7 layout preset templates (hero, two-column, image-left, image-right, quote, grid, lower-third) as Template rows with clientId: null, category: "layout-preset". **5\.**  Add "seed" script to package.json: prisma db seed **6\.**  Run pnpm prisma db seed and verify row counts. |  |
| **✓ Done when...** SELECT COUNT(\*) FROM prompt\_templates \= 6 SELECT COUNT(\*) FROM plans \= 4 SELECT COUNT(\*) FROM templates WHERE category \= 'layout-preset' \= 7 Seed is idempotent: run twice, counts do not double | **⚠ Common pitfalls** Seed must use upsert not create — createMany fails on re-run Prompt template variables field must be valid JSON, not a TypeScript object literal defaultModel must match exactly: anthropic/claude-3.5-sonnet |

| TASK 1.4  lib/settings.ts and lib/prompts.ts |  |
| :---- | :---- |
| **Copilot Persona** Persona A (Infrastructure Bot) \+ paste Sections 5.4 and 5.5 verbatim as context | **Context to paste into Copilot** README Section 5.4 (settings resolution) and Section 5.5 (prompt resolution). These are the two most-used utility files in the whole codebase. |
| **Inputs (what must exist first)** Task 1.3 complete (DB seeded) Redis running (Task 1.1) | **Outputs (what this task produces)** lib/settings.ts — getSetting(key, clientId?) and setSetting(key, value, clientId?) with Redis cache lib/prompts.ts — resolvePrompt(slug, clientId?) and renderPrompt(template, vars) Both files are fully typed with no any |
| **Copilot prompts — paste these in sequence** **1\.**  Create lib/settings.ts exactly matching Section 5.4. Cache key: setting:global:key or setting:{clientId}:key. TTL: 300s. **2\.**  Create lib/prompts.ts exactly matching Section 5.5. Cache key: prompt:global:slug or prompt:{clientId}:slug. TTL: 300s. **3\.**  Write a unit test for renderPrompt: it should replace {{vertical}} with "dental-clinic" when vars \= { vertical: "dental-clinic" }. **4\.**  Write an integration test: call getSetting("platform.name") and verify it returns "Display Platform" (from seed). **5\.**  Write an integration test: call resolvePrompt("slide.generate") and verify systemPrompt is not empty. |  |
| **✓ Done when...** All unit tests pass: pnpm test lib/settings lib/prompts getSetting returns cached value on second call (add console.log to verify Redis hit) resolvePrompt with a tenant override merges correctly — tenant value wins | **⚠ Common pitfalls** setSetting must invalidate Redis cache after DB write — Copilot often forgets del() resolvePrompt merge: null fields in TenantPromptOverride must not overwrite base values — use ?? not || renderPrompt must not throw on missing variables — replace with empty string |

| TASK 1.5  Auth — NextAuth.js \+ API Bearer Tokens |  |
| :---- | :---- |
| **Copilot Persona** Persona B (Auth Bot) \+ paste Section 21 as context | **Context to paste into Copilot** README Section 21 (multi-tenancy and auth). Admin sessions via NextAuth. Screen auth via per-screen bearer tokens. Super-admin via SUPER\_ADMIN\_EMAIL env var. |
| **Inputs (what must exist first)** Task 1.2 complete (Client, ApiToken tables exist) NEXTAUTH\_SECRET in .env.local | **Outputs (what this task produces)** app/api/auth/\[...nextauth\]/route.ts — credentials provider lib/auth.ts — getServerSession wrapper \+ isAdmin() \+ isSuperAdmin() lib/tenant.ts — scopedPrisma(clientId) Middleware: app/middleware.ts — redirects unauthenticated /admin/\* to /admin/login |
| **Copilot prompts — paste these in sequence** **1\.**  Create app/api/auth/\[...nextauth\]/route.ts with CredentialsProvider. Hash passwords with bcrypt (BCRYPT\_ROUNDS from env). **2\.**  Create lib/auth.ts: export getSession() wrapping getServerSession, export isAdmin(session) boolean, export isSuperAdmin(session) that checks email \=== SUPER\_ADMIN\_EMAIL. **3\.**  Create lib/tenant.ts: export scopedPrisma(clientId) using Prisma middleware that injects clientId into all findMany/findFirst/update/delete where clauses. **4\.**  Create middleware.ts at project root: protect /admin/\* routes, redirect to /admin/login if no session. **5\.**  Create a withClientAuth(handler) HOF for API routes that validates session belongs to requested clientId params. |  |
| **✓ Done when...** GET /admin redirects to /admin/login when not authenticated GET /admin redirects to /admin/welcome when authenticated GET /api/v1/clients/wrong-client/screens returns 403 when session belongs to different client | **⚠ Common pitfalls** App Router NextAuth: authOptions must be in the route handler file, not a separate module — causes TS errors scopedPrisma middleware: update and delete also need clientId in where — not just findMany Middleware matcher must exclude /api/auth/\* or login loop occurs |

| TASK 1.6  lib/usage.ts — Billing & Usage Gates |  |
| :---- | :---- |
| **Copilot Persona** Persona A (Infrastructure Bot) \+ paste Section 4.3 and 4.4 as context | **Context to paste into Copilot** README Section 4.3 (checkAndIncrement), Section 4.4 (UI enforcement). This is called before every AI generation and feature use. |
| **Inputs (what must exist first)** Tasks 1.2, 1.3, 1.4 complete (tables seeded, settings working) | **Outputs (what this task produces)** lib/usage.ts — checkAndIncrement(), checkFeature(), getUsageSummary() UsageRecord rows increment correctly Period key is "YYYY-MM" format |
| **Copilot prompts — paste these in sequence** **1\.**  Create lib/usage.ts. Implement checkAndIncrement(clientId, metric) exactly matching Section 4.3. Period key: new Date().toISOString().slice(0,7) **2\.**  Implement checkFeature(clientId, feature): load plan from DB (cache 5min in Redis), return plan.features\[feature\] \=== true **3\.**  Implement getUsageSummary(clientId): return all UsageRecord rows for current period plus the plan limits for comparison. **4\.**  Add a rollback helper: decrementUsage(clientId, metric) for use when an AI call fails after usage was incremented. **5\.**  Write tests: checkAndIncrement at 100% limit returns { allowed: false }. At 80% it still allows but sets a warning flag. |  |
| **✓ Done when...** checkAndIncrement on an Essential plan for ai\_slides: allows up to 10, blocks on the 11th checkFeature for google\_reviews returns false for Essential plan getUsageSummary returns current counts alongside limits | **⚠ Common pitfalls** Plan limits are cached 5 min in Redis — after plan upgrade, the old limit may still be returned for up to 5 min. Document this. The metric string must exactly match the plan limits JSON keys (ai\_slides not aiSlides) Period key must be computed server-side. Never trust client-sent period. |

| PHASE 2 — Screens, Media & Basic Admin UI  (Week 3–4) |
| :---- |

| TASK 2.1  Screen Management — Pairing \+ List |  |
| :---- | :---- |
| **Copilot Persona** Persona B (Auth Bot) \+ Persona F (UI Bot) \+ paste Section 10 as context | **Context to paste into Copilot** README Section 10 (screen management), Section 2.1 (screen status model), Section 3.1 (feature list). Focus on P1 features only. |
| **Inputs (what must exist first)** Phase 1 complete Auth working (Task 1.5) | **Outputs (what this task produces)** GET/POST /api/v1/clients/:clientId/screens — list and create POST /api/v1/clients/:clientId/screens/pair — consume pairing code lib/pairing.ts — generate 6-digit code, store in Redis TTL 300s /pair page — TV-side pairing screen with QR code /admin/screens — list page with status badges |
| **Copilot prompts — paste these in sequence** **1\.**  Create lib/pairing.ts: generateCode() creates a 6-digit code, stores { clientId, screenId } in Redis with PAIRING\_CODE\_TTL\_SECONDS TTL. consumeCode(code) validates and deletes. **2\.**  Create GET /api/v1/clients/:clientId/screens — returns all screens for the client. PATCH and DELETE for individual screens. **3\.**  Create POST /api/v1/pair/request — TV calls this with a code, receives back a clientId and a bearer token. **4\.**  Create /pair page (app/pair/page.tsx) — shows 6-digit code, QR code (use qrcode library), polls every 3s for pairing completion. **5\.**  Create /admin/screens page showing screen list with status badges (Online=green, Offline=red, Sleeping=blue, Ready=yellow). |  |
| **✓ Done when...** TV visits /pair, sees 6-digit code Admin generates code, TV enters it, screen appears in /admin/screens Screen status shows correctly based on last heartbeat timestamp | **⚠ Common pitfalls** QR code library requires browser canvas — use qrcode.react for the /pair page (Client Component) Pairing code must be deleted from Redis after consumption — single use only Screen status is derived from last\_seen\_at timestamp, not stored directly. Calculate it on read. |

| TASK 2.2  Media Library — Upload to MinIO |  |
| :---- | :---- |
| **Copilot Persona** Persona A (Infrastructure Bot) \+ Persona F (UI Bot) \+ paste Section 11 as context | **Context to paste into Copilot** README Section 11 (media library), lib/storage.ts pattern. MinIO is S3-compatible — use the AWS SDK. |
| **Inputs (what must exist first)** Phase 1 complete MinIO running (Task 1.1) MINIO\_\* env vars set | **Outputs (what this task produces)** lib/storage.ts — upload(file, folder), deleteFile(key), getPublicUrl(key) POST /api/v1/clients/:clientId/media — multipart upload GET /api/v1/clients/:clientId/media — list with folder filter /admin/media — upload, grid view, folder navigation |
| **Copilot prompts — paste these in sequence** **1\.**  Create lib/storage.ts using @aws-sdk/client-s3. Implement: upload(buffer, mimeType, key) → returns public URL, deleteFile(key), listFiles(prefix). **2\.**  Create POST /api/v1/clients/:clientId/media — accept multipart/form-data, validate MIME type against app setting media.allowed\_mime\_types, check storage quota, upload to MinIO at path clients/{clientId}/{folder}/{uuid}.{ext}. **3\.**  Create GET /api/v1/clients/:clientId/media with query params: folder, search, sort. Return paginated results. **4\.**  Create /admin/media page: drag-and-drop upload zone, folder tree sidebar, grid view with thumbnails, file details panel. |  |
| **✓ Done when...** Upload a 1MB PNG — appears in grid with thumbnail Upload a file type not in allowed\_mime\_types — returns 415 error Delete a file — removed from MinIO and DB | **⚠ Common pitfalls** MinIO path must include clientId or tenants can overwrite each other's files Check file size against media.max\_upload\_mb before uploading (not after) Video thumbnails require ffmpeg — use a placeholder thumbnail for video files initially |

| PHASE 3 — Slide Editor  (Weeks 5–8) |
| :---- |

The slide editor is the most technically complex part of Phase 3\. Tackle it in the order shown — trying to build the full editor in one task will overwhelm Copilot.

| TASK 3.1  EditorState Type \+ lib/editor.ts Renderer |  |
| :---- | :---- |
| **Copilot Persona** Persona E (Canvas Editor Bot) \+ paste Section 9.3 and 14.7 verbatim | **Context to paste into Copilot** README Section 9.3 (EditorState type), Section 14.7 (renderEditorHtml). Build the data model and renderer before any UI. |
| **Inputs (what must exist first)** Task 1.2 complete (Template table exists) lib/validation/sanitizeHtml.ts exists | **Outputs (what this task produces)** types/editor.ts — all editor types fully defined lib/editor.ts — renderEditorHtml(state) → HTML string lib/validation/sanitizeHtml.ts — DOMPurify wrapper Unit tests for renderEditorHtml |
| **Copilot prompts — paste these in sequence** **1\.**  Create types/editor.ts with EditorState, EditorBlock, TextBlockProps, ImageBlockProps, ShapeBlockProps, LogoBlockProps, BackgroundConfig exactly as in Section 9.3. **2\.**  Create lib/validation/sanitizeHtml.ts: import isomorphic-dompurify, export sanitizeHtml(input: string): string. **3\.**  Create lib/editor.ts: implement renderEditorHtml(state: EditorState) matching Section 14.7. Sort blocks by zIndex, render each type, apply percentage positioning. **4\.**  Logo blocks must output: \<img src="{{LOGO\_URL}}" — this is a template placeholder replaced at display time. **5\.**  Write tests: a state with one TextBlock renders a div with the correct text. A state with an ImageBlock renders an img tag. renderEditorHtml is pure — same input always produces same output. |  |
| **✓ Done when...** renderEditorHtml({ blocks: \[textBlock\], background: { type: "color", value: "\#fff" }, ... }) returns valid HTML XSS test: TextBlock with content "\<script\>alert(1)\</script\>" has script stripped by sanitizeHtml Logo block renders {{LOGO\_URL}} placeholder, not an actual URL | **⚠ Common pitfalls** Never use Date.now() or random values in renderEditorHtml — it must be a pure function for snapshot testing Percentage positions: x:10 means left:10%, not left:10px — Copilot will default to px sanitizeHtml must be imported from isomorphic-dompurify not browser DOMPurify — SSR compatibility |

| TASK 3.2  Editor Canvas — React Component |  |
| :---- | :---- |
| **Copilot Persona** Persona E (Canvas Editor Bot). Reference \#components/editor/ in Copilot Chat once files exist. | **Context to paste into Copilot** README Section 14.1 (editor layout), Section 14.2 (block types). The canvas is the drag-and-drop editing area. |
| **Inputs (what must exist first)** Task 3.1 complete types/editor.ts defined Client Component environment ready | **Outputs (what this task produces)** components/editor/EditorCanvas.tsx — 16:9 canvas with drag/resize blocks hooks/useEditorState.ts — undo/redo with immer Block selection, drag, and resize working No Fabric.js import errors (dynamic import pattern) |
| **Copilot prompts — paste these in sequence** **1\.**  Create hooks/useEditorState.ts using immer for immutable updates. Implement: addBlock, updateBlock, removeBlock, moveBlock, resizeBlock, undo, redo. State history: keep last 50 states. **2\.**  Create components/editor/EditorCanvas.tsx as a Client Component. The canvas div has position:relative and padding-top:56.25% for 16:9 ratio. Blocks are position:absolute with left/top/width/height as percentages. **3\.**  Implement click-to-select: clicking a block sets selectedBlockId in state. **4\.**  Implement drag-to-move using react-draggable. Convert pixel drag delta to percentage of canvas dimensions. **5\.**  Implement resize handles on selected block (8 handles: corners \+ edges). Convert pixel resize to percentage. |  |
| **✓ Done when...** Drag a text block across the canvas — position updates in EditorState as percentages Undo (Ctrl+Z) reverts the last move Selecting a block shows resize handles. Resize a block — dimensions update correctly. | **⚠ Common pitfalls** react-draggable gives pixel deltas — you must convert to percentage by dividing by canvas offsetWidth/offsetHeight Canvas must have a stable ref (useRef) for dimension calculations — don't use window.innerWidth Undo/redo: block the undo stack during drags (only push to history on drag end, not drag move) |

| TASK 3.3  Block Types — Text, Image, Shape, Logo |  |
| :---- | :---- |
| **Copilot Persona** Persona E (Canvas Editor Bot) \+ Persona F (UI Bot) | **Context to paste into Copilot** README Section 14.2 (block types table), Section 14.3 (inline image search), Section 23 (branding CSS vars). |
| **Inputs (what must exist first)** Task 3.2 complete lib/storage.ts working (Task 2.2) Pexels API key set | **Outputs (what this task produces)** components/editor/blocks/ — TextBlock, ImageBlock, ShapeBlock, LogoBlock components ImageBlock with inline Pexels search panel Branding CSS vars injected at canvas level All block props panels in EditorProperties.tsx |
| **Copilot prompts — paste these in sequence** **1\.**  Create components/editor/blocks/TextBlock.tsx: renders a contenteditable div for editing, applies fontSize, fontFamily, color, align from props. **2\.**  Create components/editor/blocks/ImageBlock.tsx: renders img with objectFit from props. On click when selected, opens ImageSearchPanel. **3\.**  Create components/editor/panels/ImageSearchPanel.tsx: text input → calls GET /api/v1/clients/:clientId/image/search → displays results grid → on select, updates ImageBlockProps. **4\.**  Create components/editor/blocks/ShapeBlock.tsx: renders an SVG rect or circle with fill and stroke from props. **5\.**  Create components/editor/blocks/LogoBlock.tsx: reads clientId from context, renders branding.logoUrl. Falls back to placeholder. **6\.**  Create components/editor/EditorProperties.tsx: right panel showing different form controls based on selected block type. |  |
| **✓ Done when...** Add a text block, type in it — content updates in EditorState Add an image block, search "mountain" — Pexels results appear, selecting one sets the src Logo block renders the client's logo URL Changing font size in properties panel updates the block immediately | **⚠ Common pitfalls** contenteditable in React: use onInput not onChange, and set suppressContentEditableWarning={true} ImageSearchPanel must call checkAndIncrement("image\_searches") before the Pexels API call CSS vars for branding must be injected as style={{ "--color-primary": brand.primaryColor }} on the canvas wrapper div |

| TASK 3.4  Editor Save Flow \+ Template API |  |
| :---- | :---- |
| **Copilot Persona** Persona E (Canvas Editor Bot) \+ paste Section 14.6 as context | **Context to paste into Copilot** README Section 14.6 (save flow), Section 15.6 (template API). |
| **Inputs (what must exist first)** Tasks 3.1–3.3 complete Template table in DB (Task 1.2) | **Outputs (what this task produces)** POST /api/v1/clients/:clientId/editor/save — saves EditorState → HTML \+ thumbnail GET/POST/PATCH/DELETE /api/v1/clients/:clientId/templates Template versioning: each save creates a TemplateVersion row |
| **Copilot prompts — paste these in sequence** **1\.**  Create POST /api/v1/clients/:clientId/editor/save. It should: (1) call renderEditorHtml(editorState), (2) upsert the Template row, (3) create a TemplateVersion row with the new version number, (4) return { template, version }. **2\.**  For thumbnail generation: use puppeteer to screenshot the rendered HTML at 1920x1080 then resize to 400x225. Upload to MinIO. This can be stubbed with a placeholder initially. **3\.**  Create the full template CRUD API matching Section 15.6: GET list with filters, GET by id, POST, PATCH, DELETE. **4\.**  Create GET /api/v1/clients/:clientId/templates/:id/versions — returns all TemplateVersion rows for a template. **5\.**  Create POST .../versions/:v/restore — copies the requested version's editorState back to the Template row. |  |
| **✓ Done when...** Save a template — TemplateVersion row created with version: 1 Edit and save again — version increments to 2 Restore version 1 — editorState reverts, new version 3 created with the old state GET templates with ?vertical=dental-clinic returns only dental templates | **⚠ Common pitfalls** Template version must be atomic: if HTML render fails, don't save the Template row Puppeteer for thumbnails: add puppeteer to a separate Docker service or it will bloat the app image forkedFromId must be preserved when editing — don't null it on save |

| PHASE 4 — Playlists, Schedules & Real-Time  (Weeks 9–10) |
| :---- |

| TASK 4.1  Playlists — CRUD \+ Assignment |  |
| :---- | :---- |
| **Copilot Persona** Persona F (UI Bot) \+ Persona C (Real-Time Bot) for the Soketi broadcast | **Context to paste into Copilot** README Section 12 (playlists), Section 17 (playlist API routes). |
| **Inputs (what must exist first)** Phase 1 complete Screen management working (Task 2.1) | **Outputs (what this task produces)** Full playlist CRUD API POST .../playlists/:id/items — add items (media, template, web\_link) POST .../playlists/:id/assign — assign to screen /admin/playlists — list and editor |
| **Copilot prompts — paste these in sequence** **1\.**  Create all playlist API routes from Section 17\. PlaylistItem has an order field — implement reorder endpoint. **2\.**  PlaylistItem.itemType can be: media\_asset, template, web\_link, stream\_url, google\_reviews. Validate against this enum. **3\.**  POST .../playlists/:id/publish: set status \= "published", broadcast Soketi event playlist.updated. **4\.**  Create /admin/playlists — list with Published/Draft badges, click-through to editor. **5\.**  Playlist editor: drag to reorder items, set duration per item, preview thumbnails. |  |
| **✓ Done when...** Create a playlist, add 3 items of different types — all appear with correct thumbnails Reorder items — order field updates in DB Assign playlist to screen — screen shows playlist name in its detail view Publish playlist — Soketi event is broadcast (check Soketi dashboard) | **⚠ Common pitfalls** PlaylistItem order must be managed with a gap strategy (10, 20, 30...) to allow insertions without renumbering all rows Assignment to screen must validate that the screen belongs to the same clientId as the playlist Soketi broadcast must happen after the DB commit, not before |

| TASK 4.2  SSE Gateway — TV Real-Time Connection |  |
| :---- | :---- |
| **Copilot Persona** Persona C (Real-Time Bot) — this task has the most Copilot traps. Read the pitfalls carefully first. | **Context to paste into Copilot** README Section 19 (Soketi SSE gateway), Section 24 (screen polling strategy). This is the most technically tricky single task. |
| **Inputs (what must exist first)** Task 4.1 complete (Soketi working) lib/soketi.ts exists | **Outputs (what this task produces)** GET /api/v1/clients/:clientId/events — Server-Sent Events route TV screen subscribes and receives playlist.updated events Keep-alive comment every 25 seconds |
| **Copilot prompts — paste these in sequence** **1\.**  Create GET /api/v1/clients/:clientId/events as a streaming route. Use Next.js ReadableStream response: **2\.**  Pattern: return new Response(new ReadableStream({ start(controller) { ... } }), { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" } }) **3\.**  Inside the stream: subscribe to Soketi channel client-{clientId} using the Pusher server library. Forward events to the SSE stream as: data: {JSON}\\n\\n **4\.**  Add a keep-alive timer: every 25s send: : keep-alive\\n\\n **5\.**  On client disconnect (controller.close), unsubscribe from Soketi and clear the timer. **6\.**  Test by opening the URL in the browser — you should see a persistent connection in Network tab with event data flowing. |  |
| **✓ Done when...** curl \-N http://localhost:3000/api/v1/clients/demo/events keeps connection open Trigger a playlist update — the event appears in the SSE stream within 1 second Kill the curl process — no memory leak (Soketi subscription cleaned up) | **⚠ Common pitfalls** Next.js App Router does not support node-style res.write() for streaming — must use ReadableStream The Nginx proxy\_buffering off config from Task 1.1 is required or SSE never reaches the TV Pusher server library for Soketi: use pusher npm package with host override, not pusher-js (client library) |

| TASK 4.3  TV Screen Renderer |  |
| :---- | :---- |
| **Copilot Persona** Persona C (Real-Time Bot) \+ Persona F (UI Bot) | **Context to paste into Copilot** README Section 18 (TV screen routes), Section 24 (polling strategy). The screen at /screens/:clientId/:screenId that TVs display. |
| **Inputs (what must exist first)** Tasks 4.1, 4.2 complete Playlist system working renderEditorHtml working (Task 3.1) | **Outputs (what this task produces)** /screens/:clientId/:screenId — full-page playlist renderer Playlist loop with configurable durations SSE subscription to receive live updates Screen heartbeat: POST to update last\_seen\_at every 30s |
| **Copilot prompts — paste these in sequence** **1\.**  Create app/screens/\[clientId\]/\[screenId\]/page.tsx as a Client Component. It fetches the assigned playlist on mount. **2\.**  Implement the content loop: iterate through PlaylistItems, display each for its duration, loop back to start. **3\.**  Connect to SSE: when playlist.updated event arrives, re-fetch the playlist and restart the loop from the beginning. **4\.**  Heartbeat: every 30s, call PATCH /api/v1/clients/:clientId/screens/:screenId with { lastSeenAt: new Date() }. **5\.**  Render each PlaylistItem type: template items use htmlContent rendered in a sandboxed iframe, media items use img/video tags, web\_link items use an iframe. |  |
| **✓ Done when...** TV at /screens/demo/lobby shows playlist content cycling through items Edit playlist in admin, publish — TV updates within 2 seconds via SSE Screen status in admin shows Online after 30s heartbeat | **⚠ Common pitfalls** Template htmlContent in an iframe: use srcdoc attribute, not src — avoids same-origin issues Loop restart on SSE update: use a ref for the current item index, clear it on update Heartbeat creates many DB writes — batch them: write to Redis immediately, flush to DB every 5 minutes via a cron |

| PHASE 5 — AI Generation Pipeline  (Weeks 11–13) |
| :---- |

| TASK 5.1  lib/ai.ts — OpenRouter Integration |  |
| :---- | :---- |
| **Copilot Persona** Persona D (AI Pipeline Bot) \+ paste Section 27 and 5.5 as context | **Context to paste into Copilot** README Section 27 (OpenRouter), Section 5.5 (prompt resolution). The core AI generation function. |
| **Inputs (what must exist first)** Tasks 1.4 (prompts.ts), 1.6 (usage.ts) complete OPENROUTER\_API\_KEY set | **Outputs (what this task produces)** lib/ai.ts — generateWithPrompt(slug, variables, clientId?) function GenerationLog row written on every call Usage rollback on failure |
| **Copilot prompts — paste these in sequence** **1\.**  Create lib/ai.ts exactly matching Section 27\. The function: (1) resolvePrompt(slug, clientId), (2) renderPrompt for system and user, (3) call OpenRouter, (4) parse response based on responseFormat. **2\.**  Add a GenerationLog row after every call: model, promptSlug, promptTokens, outputTokens, durationMs, success, error. **3\.**  Usage rollback: if checkAndIncrement succeeds but the OpenRouter call throws, call decrementUsage(clientId, metric) in the catch block. **4\.**  For responseFormat \=== "json": wrap JSON.parse in a try/catch. If parsing fails, return { error: "invalid\_json", raw: content }. **5\.**  Add retry logic: if OpenRouter returns 429 (rate limit), wait 2s and retry once. |  |
| **✓ Done when...** Call generateWithPrompt("slide.generate", { vertical: "dental", clientName: "Test", ... }) — returns parsed JSON GenerationLog row created in DB after each call If OPENROUTER\_API\_KEY is wrong, error is returned (not thrown), and usage is rolled back | **⚠ Common pitfalls** OpenRouter returns choices\[0\].message.content as a string even when requesting JSON — always JSON.parse the content string response\_format: { type: "json\_object" } must be set in the request body or GPT models return markdown-wrapped JSON promptTokens comes from data.usage.prompt\_tokens — check if data.usage exists before reading |

| TASK 5.2  Slide \+ Announcement Generation APIs |  |
| :---- | :---- |
| **Copilot Persona** Persona D (AI Pipeline Bot) | **Context to paste into Copilot** README Section 25 (slide generation), Section 17 (API routes). The first user-facing AI feature. |
| **Inputs (what must exist first)** Task 5.1 complete Seed data has slide.generate and announcement.generate prompts (Task 1.3) | **Outputs (what this task produces)** POST /api/v1/clients/:clientId/slides/generate — returns slide JSON \+ suggested layout POST /api/v1/clients/:clientId/announcements/generate — returns announcement JSON Usage gate enforced before generation |
| **Copilot prompts — paste these in sequence** **1\.**  Create POST /api/v1/clients/:clientId/slides/generate. Body: { prompt, context: { screenType, season, orientation } }. Steps: (1) checkAndIncrement(clientId, "ai\_slides"), (2) load client vertical and brand voice from tenant settings, (3) call generateWithPrompt("slide.generate", vars, clientId), (4) return the result. **2\.**  Create POST /api/v1/clients/:clientId/announcements/generate. Body: { brief }. Same pattern with "ai\_announcements" usage metric. **3\.**  If checkAndIncrement returns allowed: false, return 429 with { error: "usage\_limit\_reached", upgradeUrl }. **4\.**  Write an integration test: call the generate endpoint with a valid prompt. Mock the OpenRouter fetch to return a valid response. Verify GenerationLog row is created. |  |
| **✓ Done when...** POST /slides/generate returns { icon, tag, title, body, suggestedLayout, tags } JSON 11th call on Essential plan returns 429 GenerationLog row written after each successful generation | **⚠ Common pitfalls** Variables must include all required keys from the prompt template's variables field in DB — if any are missing, renderPrompt leaves {{placeholder}} in the prompt clientName and vertical must come from the DB (client.name, client.vertical), not from the request body Usage check and increment must be atomic — no race condition between check and increment for concurrent requests (use Redis INCR) |

| TASK 5.3  Image Search \+ Pexels Provider |  |
| :---- | :---- |
| **Copilot Persona** Persona D (AI Pipeline Bot) \+ paste Section 26 as context | **Context to paste into Copilot** README Section 26 (image provider system), Section 14.3 (inline image search). Pexels first, Pixabay later. |
| **Inputs (what must exist first)** Task 1.4 complete (getSetting working) PEXELS\_API\_KEY set image\_cache table exists (Task 1.2) | **Outputs (what this task produces)** lib/images/pexels.ts — searchImages(query, perPage, orientation) lib/images/normalize.ts — SlideImage type POST /api/v1/clients/:clientId/image/search — usage gated, cached 24h Result includes attribution text for rendering |
| **Copilot prompts — paste these in sequence** **1\.**  Define SlideImage type in types/image.ts: { id, url, thumbnailUrl, width, height, photographer, photographerUrl, provider, attributionText }. **2\.**  Create lib/images/pexels.ts: call Pexels API, map response to SlideImage\[\], include attributionText \= "Photo by {photographer} on Pexels". **3\.**  Create lib/images/normalize.ts: normalizeProviderResult(raw, provider) → SlideImage\[\]. **4\.**  Create POST /api/v1/clients/:clientId/image/search. Check checkAndIncrement("image\_searches"). Check image\_cache table first (key: provider:query:perPage). If cache miss, call Pexels, save to cache with 24h TTL, return results. **5\.**  Respect active provider from getSetting("ai.image\_provider", clientId). Currently only pexels is implemented. |  |
| **✓ Done when...** Search "mountain sunrise" — returns 10 SlideImage objects with attribution Same search twice within 24h — second call hits cache (check image\_cache table) Essential plan: 21st search returns 429 | **⚠ Common pitfalls** Pexels free tier has rate limits — always check the cache before calling the API Attribution is legally required for Pexels images — it must appear on any slide that uses a Pexels photo normalizeProviderResult must handle Pexels and Pixabay response shapes — don't couple it to one provider |

| PHASE 6 — Settings UI, Billing & Polish  (Weeks 14–16) |
| :---- |

| TASK 6.1  Admin Settings — Prompts \+ General |  |
| :---- | :---- |
| **Copilot Persona** Persona B (Auth Bot for permission checks) \+ Persona F (UI Bot) | **Context to paste into Copilot** README Section 5.6 (settings UI), Sections /admin/settings/prompts and /admin/settings/general. |
| **Inputs (what must exist first)** Phase 1 complete (settings \+ prompts in DB) | **Outputs (what this task produces)** /admin/settings/general — tenant name, city, vertical, timezone /admin/settings/prompts — list all prompt templates, edit system/user prompts, temperature, model PATCH /api/v1/clients/:clientId/settings/:key and PATCH /api/v1/admin/prompts/:slug |
| **Copilot prompts — paste these in sequence** **1\.**  Create /admin/settings/general: form with inputs for tenant name, city, vertical (select), timezone. On submit, calls PATCH /api/v1/clients/:clientId/settings/general.vertical etc. **2\.**  Create /admin/settings/prompts: list all PromptTemplate rows. For each, show a card with the slug, category, and an Edit button. **3\.**  Edit view: two textareas (system prompt, user prompt template), sliders for temperature (0–1 step 0.05) and maxTokens (100–4000 step 100), model selector. Saving writes to TenantPromptOverride if a tenant is editing, or PromptTemplate if super-admin. **4\.**  Create PATCH /api/v1/clients/:clientId/settings/:key — validates the key is in the allowed overridable list, writes TenantSetting, invalidates Redis cache. **5\.**  Create PATCH /api/v1/admin/prompts/:slug — super-admin only, writes PromptTemplate directly. |  |
| **✓ Done when...** Edit a prompt temperature in the UI — change is reflected immediately on next generation Non-super-admin can edit tenant override but cannot edit the global PromptTemplate Redis cache is cleared after settings save (verify by checking Redis CLI) | **⚠ Common pitfalls** Prompt editing is dangerous — add a "Reset to default" button that deletes the TenantPromptOverride row Variable names in the prompt template must match the variables JSON field exactly — add a live preview showing which vars are being used Temperature slider step: 0.05 not 0.1 — match the DB field precision |

| TASK 6.2  Billing — Stripe \+ Usage Dashboard |  |
| :---- | :---- |
| **Copilot Persona** Persona A (Infrastructure Bot) \+ Persona F (UI Bot) | **Context to paste into Copilot** README Section 4.5 (Stripe events), Section 5.6 billing settings page. Stripe Checkout \+ usage bars. |
| **Inputs (what must exist first)** Phase 1 complete Stripe keys set in env Subscription and UsageRecord tables exist | **Outputs (what this task produces)** POST /api/v1/billing/checkout — create Stripe checkout session POST /api/v1/billing/webhook — handle Stripe events /admin/settings/billing — usage bars for all metrics \+ Stripe portal link |
| **Copilot prompts — paste these in sequence** **1\.**  Create POST /api/v1/billing/checkout: create a Stripe Checkout session with the selected plan's priceId, attach clientId as metadata, return the session URL. **2\.**  Create POST /api/v1/billing/webhook: verify Stripe signature, handle the 5 events from Section 4.5. On checkout.session.completed: upsert Subscription row. On customer.subscription.deleted: set planSlug to "free". **3\.**  Create GET /api/v1/clients/:clientId/usage: return current period UsageRecord rows plus plan limits from getClientPlan(). **4\.**  Create /admin/settings/billing: call getUsageSummary() for all metrics, render progress bars (yellow at 80%, red at 100%). Show current plan, next billing date, and a "Manage Billing" button linking to Stripe Customer Portal. |  |
| **✓ Done when...** Complete checkout flow in Stripe test mode — Subscription row created in DB Usage bars show correct percentages Usage bar turns yellow at 80% and red at 100% Customer subscription.deleted webhook downgrades plan to free | **⚠ Common pitfalls** Stripe webhook must validate the signature using stripe.webhooks.constructEvent() — raw body required, not parsed JSON Use Stripe CLI for local webhook testing: stripe listen \--forward-to localhost:3000/api/v1/billing/webhook Plan cache in Redis must be invalidated on subscription changes — clear setting:{clientId}:plan on every webhook event |

# **7\. Testing Strategy**

Given you are using GitHub Copilot and building at pace, a pragmatic testing approach works better than 100% coverage. Test the three categories below — skip unit testing UI components for now.

## **7.1 What to Test (and What to Skip)**

| Area | Strategy | Priority examples |
| :---- | :---- | :---- |
| **lib/ utilities** | Unit test all of them. These are pure functions or near-pure. Tests take 5 minutes to write and save hours of debugging. | settings.ts, prompts.ts, usage.ts, editor.ts, ai.ts |
| **API routes** | Integration test the security layer and business logic. Mock Prisma with prisma-mock. | Permission checks, usage gates, tenant scoping |
| **DB operations** | Use a test database (test schema in same Postgres). Seed, run, teardown. | Seed file idempotency, cascade deletes, unique constraints |
| **UI components** | Skip unit tests. Manual test during development. Add Playwright E2E for critical flows later. | Playwright: pairing flow, playlist publish, slide save |
| **AI generation** | Mock the OpenRouter fetch. Test that prompts are resolved from DB, not hardcoded. Test usage rollback. | fetch mock returning invalid JSON tests error path |
| **Real-time SSE** | Integration test only: open SSE connection, trigger Soketi broadcast, assert event received. | Use EventSource in Jest with jest-environment-jsdom |

## **7.2 Test Setup — Copilot Prompts**

| Setting up Vitest (recommended over Jest for Next.js 14\) Prompt 1: "Set up Vitest for a Next.js 14 App Router project with TypeScript. Include vitest.config.ts, a test helper that creates a clean Prisma client pointing at a test database, and an example test for a lib/ utility function." Prompt 2: "Create a test helper mockFetch(responses) that replaces global.fetch in tests and returns the given responses in order. Include TypeScript types." Prompt 3: "Write unit tests for lib/prompts.ts covering: (1) resolvePrompt returns base template when no tenant override exists, (2) resolvePrompt merges tenant override fields correctly, (3) renderPrompt replaces all {{variable}} placeholders." |
| :---- |

## **7.3 The Non-Negotiable Test Checklist**

Before moving between phases, these tests must pass. Each one catches a real class of bug.

| Test name | What it verifies |
| :---- | :---- |
| **Tenant isolation** | Create clients A and B. Add a screen to A. GET screens for B. Must return empty array. |
| **Usage gate** | Set an Essential plan client's ai\_slides count to 10\. Call /slides/generate. Must return 429\. |
| **Prompt from DB** | Delete the slide.generate PromptTemplate row. Call /slides/generate. Must throw "Prompt not found" error, not produce a hardcoded fallback. |
| **Settings cache invalidation** | Call getSetting("platform.name"). Update it. Call getSetting again. Must return new value, not cached value. |
| **SSE keep-alive** | Open SSE connection. Wait 30s. Connection must still be open (check Network tab in devtools). |
| **Editor state purity** | Call renderEditorHtml with the same EditorState 100 times. All outputs must be byte-identical. |
| **Stripe webhook signature** | POST to /billing/webhook with a tampered payload. Must return 400\. |

# **8\. GitHub Copilot Quick-Reference Cards**

Paste these exact prompts into Copilot Chat when you hit common problems. They are tuned for this codebase.

| "I am getting TypeScript errors in my Prisma queries" "I am using Prisma with Next.js App Router and getting TypeScript errors on \[paste the error\]. My schema has \[paste relevant model\]. The query I am writing is \[paste query\]. Explain the type error and show the corrected query." |
| :---- |

| "Copilot keeps hardcoding the AI prompt" "IMPORTANT: Do not hardcode any prompt text. The prompt must be resolved from the database using resolvePrompt(slug, clientId) from \#lib/prompts.ts. Here is the function signature: \[paste resolvePrompt signature\]. Rewrite the generation function to use this instead of any string literal." |
| :---- |

| "The SSE stream is not working behind Nginx" "My Server-Sent Events route works on localhost but not in production behind Nginx. The connection closes immediately. Nginx config is: \[paste config\]. The Next.js route is: \[paste route\]. What Nginx directives do I need to add to prevent the stream from being buffered and closed?" |
| :---- |

| "Fabric.js / canvas import is failing in Next.js" "I am getting a ReferenceError: document is not defined when importing Fabric.js in my Next.js App Router project. The component is \[paste component\]. Rewrite it using dynamic import inside a useEffect or show me how to use next/dynamic with ssr: false to fix this." |
| :---- |

| "The multi-tenant scope is not working" "I need to write a Prisma query that is automatically scoped to a clientId. I have scopedPrisma(clientId) in \#lib/tenant.ts. Rewrite this query \[paste query\] to use scopedPrisma so that it only returns records belonging to the correct client and cannot return data from other tenants." |
| :---- |

## **8.1 Final Build Order Summary**

Follow this order. Each item is a dependency of everything below it.

1. Docker Compose \+ Nginx (Task 1.1)

2. Prisma Schema \+ Migrations (Task 1.2)

3. Seed File — plans, settings, prompts (Task 1.3)

4. lib/settings.ts \+ lib/prompts.ts (Task 1.4)

5. Auth — NextAuth \+ middleware (Task 1.5)

6. lib/usage.ts — billing gates (Task 1.6)

7. Screen pairing \+ Media library (Tasks 2.1, 2.2)

8. EditorState type \+ renderEditorHtml (Task 3.1)

9. Canvas drag/resize (Task 3.2)

10. Block types \+ properties panel (Task 3.3)

11. Template save \+ version history (Task 3.4)

12. Playlist CRUD \+ assignment (Task 4.1)

13. SSE gateway (Task 4.2)

14. TV screen renderer (Task 4.3)

15. lib/ai.ts — OpenRouter (Task 5.1)

16. Slide \+ announcement generation (Task 5.2)

17. Image search \+ Pexels (Task 5.3)

18. Settings UI \+ prompt editor (Task 6.1)

19. Billing \+ Stripe (Task 6.2)

*— End of Guide —*