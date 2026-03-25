# Display Relay — Project Setup & Architecture

> Self-hosted smart TV display platform. Screens are full-page web apps served
> directly to TV browsers, backed by a multi-tenant Next.js REST API with
> Server-Sent Events for real-time updates and an AI-powered slide/template
> generation engine with royalty-free image integration.
> Fully self-hosted on a VPS — no third-party display manager required.
> **Nothing is built yet — this is the full specification.**

---

## Table of Contents

1. [Overview](#1-overview)
2. [Navigation & Information Architecture](#2-navigation--information-architecture)
3. [Full Feature Roadmap](#3-full-feature-roadmap)
4. [Pricing Tiers & Usage Limits](#4-pricing-tiers--usage-limits)
4. [Tech Stack](#4-tech-stack)
5. [Repository Structure](#5-repository-structure)
6. [Environment Variables](#6-environment-variables)
7. [Database Schema](#7-database-schema)
8. [Screen Management & Pairing](#8-screen-management--pairing)
9. [Media Library](#9-media-library)
10. [Playlists](#10-playlists)
11. [Schedules & Zone Layouts](#11-schedules--zone-layouts)
12. [Relay Studio — Template Library](#12-Relay-studio--template-library)
13. [Apps, Stream URLs & Dashboards](#13-apps-stream-urls--dashboards)
14. [API Routes](#14-api-routes)
15. [TV Screen Routes](#15-tv-screen-routes)
16. [Real-Time: Soketi SSE Gateway](#16-real-time-soketi-sse-gateway)
17. [Webhook Endpoints](#17-webhook-endpoints)
18. [Multi-Tenancy & Auth](#18-multi-tenancy--auth)
19. [Vertical Packages & Configuration](#19-vertical-packages--configuration)
20. [Branding & Theming](#20-branding--theming)
21. [Screen Polling Strategy](#21-screen-polling-strategy)
22. [Slide Generation Engine](#22-slide-generation-engine)
23. [Image Provider System](#23-image-provider-system)
24. [AI Content Generation — OpenRouter](#24-ai-content-generation--openrouter)
25. [Google Calendar — Availability Sync](#25-google-calendar--availability-sync)
26. [Google Reviews — Social Trust Widget](#26-google-reviews--social-trust-widget)
27. [Weather-Triggered Content — OpenWeatherMap](#27-weather-triggered-content--openweathermap)
28. [n8n Workflow Automation Hub](#28-n8n-workflow-automation-hub)
29. [AI Content Library](#29-ai-content-library)
30. [VPS Deployment (Self-Hosted)](#30-vps-deployment-self-hosted)
31. [Prioritized Build Roadmap](#31-prioritized-build-roadmap)
32. [Local Development](#32-local-development)

---

## 1. Overview

The Display Platform is a fully self-hosted smart TV display system. Each
tenant manages screens, media, playlists, and schedules through an admin
dashboard. TV screens are paired using a 4-digit code displayed on the TV
itself, then served content over HTTPS from a VPS.

The platform includes a complete AI-powered template/slide generation engine
(Relay Studio), a media library backed by MinIO, mixed-type playlists
(media + apps + links + streams), zone-split schedule layouts, and a
real-time push layer via Soketi.

All components run on a VPS behind Nginx. Media assets are stored on MinIO
(self-hosted S3-compatible object storage), served directly by Nginx.

```
TV Browser
    │  navigates to /pair on first boot
    │  displays 4-digit code + QR
    │
    ▼
Admin Dashboard — enters code → screen paired
    │
    ▼
Next.js API Layer (VPS)
    ├── REST endpoints (media, playlists, schedules, slides, kpi…)
    ├── Soketi gateway (real-time push to screens)
    ├── Webhook receivers (external integrations)
    ├── AI generation (OpenRouter)
    └── MinIO (asset storage)
```

---

## 2. Navigation & Information Architecture

The admin dashboard sidebar mirrors the navigation structure observed in the
reference UI. Every section below is a top-level route in `/admin`.

```
/admin
├── /welcome           Onboarding checklist + quick actions
├── /screens           Screen list, pairing, status, tags, locations
├── /media             Media library — folders, upload, search, grid/list
├── /playlists         Playlist list — create, edit, assign to screen
├── /schedules         Schedule builder — calendar grid, zone picker
├── /Relay-studio       Template library — browse, search, create
├── /apps              Web links, Dashboards, Live Streaming
├── /stream-urls       Stream URL management
└── /video-wall        Video wall layout builder (future)
```

### 2.1 Screen Status Model

Every screen has one of four statuses, shown as colour-coded badges:

| Status | Colour | Meaning |
|---|---|---|
| Online | Green | Connected and actively playing content |
| Offline | Red | Not reachable |
| Sleeping | Blue | Connected but in power-save / off-hours mode |
| Ready to Play | Yellow | Paired and awaiting content assignment |

### 2.2 Screen List Columns

| Column | Description |
|---|---|
| Preview | Thumbnail of currently playing content |
| Screen name | User-assigned label (e.g. "Lobby", "koko") |
| Status | Online / Offline / Sleeping / Ready to Play |
| Last status changed | Timestamp |
| Now playing | Playlist or schedule name currently active |
| Tags | User-defined labels for grouping |
| Location | Physical location tag |
| Space | Tenant space / group the screen belongs to |
| Type | WEB / HDMI / Player device type |

### 2.3 Screen Filters

Screens list supports filtering by: Status · Tags · Locations · Spaces · Operation hours

---

## 3. Full Feature Roadmap

All items below are **planned for implementation**. Nothing is built.

### 3.1 Screen Management

| Feature | Priority | Notes |
|---|---|---|
| Screen list with status badges (Online/Offline/Sleeping/Ready) | 🔴 P1 | §8 |
| 4-digit pairing code + QR on TV `/pair` page | 🔴 P1 | §8.1 |
| Add screen flow (Admin enters code → paired) | 🔴 P1 | §8.2 |
| Screen detail: name, tags, location, space, type | 🔴 P1 | §8 |
| Filter by status / tags / locations / spaces | 🟡 P2 | |
| Operation hours per screen | 🟡 P2 | Sleep schedule |
| Screenshot / now-playing preview | 🟡 P2 | |
| Remote reboot / refresh command | 🟡 P2 | Via SSE |
| Portrait / landscape orientation flag | 🟡 P2 | |
| Video wall layout builder | 🔵 P3 | Multi-zone tiling |

### 3.2 Media Library

| Feature | Priority | Notes |
|---|---|---|
| File upload (image, video, PDF) to MinIO | 🔴 P1 | §9 |
| Folder organisation | 🔴 P1 | |
| Search media by name | 🔴 P1 | |
| Grid and list view toggle | 🟡 P2 | |
| Sort by name / date / size | 🟡 P2 | |
| New folder creation | 🟡 P2 | |
| Bulk select and delete | 🟡 P2 | |

### 3.3 Playlists

| Feature | Priority | Notes |
|---|---|---|
| Create / edit / delete playlists | 🔴 P1 | §10 |
| Mixed content types in one playlist (Media + Application) | 🔴 P1 | `content_type` tags |
| Playlist status: Draft / Published | 🔴 P1 | |
| Assign playlist to screen ("Set to screen") | 🔴 P1 | |
| Playlist preview thumbnails | 🟡 P2 | |
| Search playlists | 🟡 P2 | |
| Sort by date / name | 🟡 P2 | |

### 3.4 Schedules

| Feature | Priority | Notes |
|---|---|---|
| Schedule builder with visual weekly calendar grid | 🔴 P1 | §11 |
| Assign schedule to one or multiple screens | 🔴 P1 | |
| Zone layout picker: Main vs split zones | 🔴 P1 | §11.2 |
| Time-of-day content windows | 🔴 P1 | `time_rules` |
| Weather-triggered content rules | 🟡 P2 | §27 |
| AI schedule recommendations (dayparting) | 🟡 P2 | §24 |
| Operation hours / blackout periods | 🟡 P2 | |

### 3.5 Relay Studio

| Feature | Priority | Notes |
|---|---|---|
| Template library browser (1,500+ templates) | 🔴 P1 | §12 |
| Filter by orientation (Both/Vertical/Horizontal) | 🔴 P1 | |
| Filter by main group (Digital Menu Boards, Corporate…) | 🔴 P1 | |
| Filter by category (Coffee & Tea, Healthcare, Retail…) | 🔴 P1 | |
| Search templates | 🔴 P1 | |
| My Templates tab (saved/customised) | 🟡 P2 | |
| Create Template (drag-and-drop editor) | 🟡 P2 | |
| AI slide generation from prompt | 🟡 P2 | §22, §24 |
| Smooth Setup wizard (select 4 templates → instant playlist) | 🟡 P2 | §12.2 |
| Royalty-free image search (Pexels) | 🟡 P2 | §23 |
| Pixabay provider | 🔵 P3 | |
| Openverse provider | 🔵 P3 | |

### 3.6 Apps, Stream URLs & Dashboards

| Feature | Priority | Notes |
|---|---|---|
| Web links (embed any URL as a slide) | 🔴 P1 | §13.1 |
| Dashboard integrations (Salesforce, Zendesk, GitHub, Trello…) | 🟡 P2 | §13.2 |
| Live Streaming slide | 🔵 P3 | §13.3 |
| Integration registry (app marketplace) | 🔵 P3 | |

### 3.7 Real-Time

| Feature | Priority | Notes |
|---|---|---|
| Soketi SSE/WebSocket gateway | 🔴 P1 | §16 |
| Instant screen update on data/playlist change | 🔴 P1 | |
| Screen status heartbeat (Online/Offline detection) | 🔴 P1 | |
| Remote command channel (reboot, refresh) | 🟡 P2 | |
| Heartbeat keep-alive every 30 s | 🔴 P1 | |

### 3.8 AI & Integrations

| Feature | Priority | Notes |
|---|---|---|
| OpenRouter AI client (model-agnostic) | 🟡 P2 | §24 |
| Slide + announcement generation | 🟡 P2 | |
| AI image candidate ranking | 🟡 P2 | §22 |
| AI schedule recommendations | 🟡 P2 | §24 |
| Google Calendar availability sync | 🟡 P2 | §25 |
| Google Reviews widget | 🟡 P2 | §26 |
| OpenWeatherMap weather rules | 🟡 P2 | §27 |
| n8n workflow rule engine | 🟡 P2 | §28 |
| AI content library (200+ pre-generated) | 🟡 P2 | §29 |

---

## 4. Pricing Tiers & Usage Limits

The platform operates on a freemium model. Every tenant starts on the Free
tier. AI features and higher-volume generation are gated behind paid plans.
Usage is tracked per tenant per calendar month and enforced at the API layer
before any LLM or image provider call is made.

### 4.1 Plans

| Feature | Essential  | Professional  | Premium | Enterprise |
|---|---|---|---|---|
| **Price** | €5 / mo | €15 / mo | €30 / mo | Custom |
| **Screens** | 2 | 5 | Unlimited | Unlimited |
| **Media storage** | 500 MB | 5 GB | 25 GB | Custom |
| **Playlists** | 5 | 25 | Unlimited | Unlimited |
| **Schedules** | 2 | 10 | Unlimited | Unlimited |
| **AI slide generations** | 10 / mo | 100 / mo | 500 / mo | Unlimited |
| **AI deck generations** | 2 / mo | 20 / mo | 100 / mo | Unlimited |
| **AI announcement generations** | 5 / mo | 50 / mo | 200 / mo | Unlimited |
| **AI schedule suggestions** | 1 / mo | 10 / mo | 50 / mo | Unlimited |
| **Image searches (Pexels)** | 20 / mo | 200 / mo | 1,000 / mo | Unlimited |
| **Relay Studio templates** | 50 browse, 3 save | Full library, 20 save | Full library, unlimited save | Full library |
| **AI content library** | 10 items / mo | 100 items / mo | Unlimited | Unlimited |
| **Google Reviews widget** | ❌ | ✅ | ✅ | ✅ |
| **Weather-triggered rules** | ❌ | ✅ | ✅ | ✅ |
| **Google Calendar sync** | ❌ | ❌ | ✅ | ✅ |
| **Workflow automation rules** | ❌ | 3 rules | 25 rules | Unlimited |
| **Webhook integrations** | 1 | 5 | Unlimited | Unlimited |
| **Zone layouts** | Main only | All layouts | All layouts | All layouts |
| **Video wall** | ❌ | ❌ | ❌ | ✅ |
| **Priority support** | ❌ | Email | Email + Chat | Dedicated |

### 4.2 Usage Tracking — Database Schema

```prisma
// Plan definition (seeded — not user-editable)
model Plan {
  id          String   @id @default(uuid())
  slug        String   @unique  // "free"|"starter"|"pro"|"enterprise"
  name        String
  priceMonthly Int     // cents — 0 for free
  limits      Json     // matches UsageLimitKey enum values
  features    Json     // boolean feature flags
  isActive    Boolean  @default(true)
}

// Client subscription
model Subscription {
  id              String    @id @default(uuid())
  clientId        String    @unique
  planSlug        String    @default("free")
  status          String    @default("active")  // active|past_due|cancelled|trialing
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd  Boolean @default(false)
  stripeCustomerId   String?
  stripeSubId        String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  client          Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)
}

// Per-metric monthly usage counter
model UsageRecord {
  id        String   @id @default(uuid())
  clientId  String
  metric    String   // UsageLimitKey value
  period    String   // "2026-03" — YYYY-MM
  count     Int      @default(0)
  updatedAt DateTime @updatedAt

  @@unique([clientId, metric, period])
}

// Individual AI generation event log (for audit + debugging)
model GenerationLog {
  id           String   @id @default(uuid())
  clientId     String
  metric       String
  aiModel      String?
  promptTokens Int?
  outputTokens Int?
  durationMs   Int?
  success      Boolean  @default(true)
  error        String?
  createdAt    DateTime @default(now())
  client       Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
}
```

### 4.3 Usage Limit Keys

```typescript
// types/usage.ts
export type UsageLimitKey =
  | "ai_slides"           // POST /slides/generate
  | "ai_decks"            // POST /deck/generate
  | "ai_announcements"    // POST /announcements/generate
  | "ai_schedule_suggest" // POST /schedule/suggest
  | "image_searches"      // POST /image/search
  | "template_saves"      // POST /templates (save to My Templates)
  | "ai_library_items"    // items imported from ai_content_library
  | "screens"             // active paired screens
  | "playlists"           // total playlists
  | "schedules"           // total schedules
  | "webhooks"            // active webhook subscriptions
  | "workflow_rules";     // active workflow rules
```

### 4.4 `lib/usage.ts` — Enforcement Layer

Every AI and generation endpoint calls `checkAndIncrement()` before doing
any work. If the limit is reached, a `402 Payment Required` error is
returned with a `upgradeUrl` in the body.

```typescript
// lib/usage.ts

export async function checkAndIncrement(
  clientId: string,
  metric: UsageLimitKey
): Promise<{ allowed: boolean; current: number; limit: number; upgradeUrl?: string }> {
  const period = currentPeriod();                         // "2026-03"
  const plan   = await getClientPlan(clientId);           // cached 5 min in Redis
  const limit  = plan.limits[metric] as number;

  // -1 means unlimited (Enterprise / Pro for some metrics)
  if (limit === -1) {
    await increment(clientId, metric, period);
    return { allowed: true, current: -1, limit: -1 };
  }

  const current = await getCount(clientId, metric, period);

  if (current >= limit) {
    return {
      allowed: false,
      current,
      limit,
      upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/settings/billing`,
    };
  }

  await increment(clientId, metric, period);
  return { allowed: true, current: current + 1, limit };
}

async function increment(clientId: string, metric: string, period: string) {
  await prisma.usageRecord.upsert({
    where:  { clientId_metric_period: { clientId, metric, period } },
    create: { clientId, metric, period, count: 1 },
    update: { count: { increment: 1 }, updatedAt: new Date() },
  });
}

async function getCount(clientId: string, metric: string, period: string): Promise<number> {
  // Check Redis cache first (1-minute TTL per metric)
  const cached = await redis.get(`usage:${clientId}:${metric}:${period}`);
  if (cached) return parseInt(cached);

  const row = await prisma.usageRecord.findUnique({
    where: { clientId_metric_period: { clientId, metric, period } },
  });
  const count = row?.count ?? 0;
  await redis.setex(`usage:${clientId}:${metric}:${period}`, 60, String(count));
  return count;
}

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
```

### 4.5 Usage Gate in Route Handlers

```typescript
// app/api/v1/clients/[clientId]/slides/generate/route.ts
export async function POST(req: Request, { params }) {
  const { clientId } = await verifyToken(req, params.clientId);

  const gate = await checkAndIncrement(clientId, "ai_slides");
  if (!gate.allowed) {
    return Response.json({
      error:      "USAGE_LIMIT_REACHED",
      message:    `You have used all ${gate.limit} AI slide generations for this month.`,
      metric:     "ai_slides",
      current:    gate.current,
      limit:      gate.limit,
      upgradeUrl: gate.upgradeUrl,
    }, { status: 402 });
  }

  // ... generation logic
  await prisma.generationLog.create({
    data: { clientId, metric: "ai_slides", aiModel, promptTokens, outputTokens, durationMs, success: true }
  });
}
```

### 4.6 Feature Flag Gate

For boolean features (Google Reviews, Weather rules, Zone layouts, etc.),
a separate `checkFeature()` helper is used:

```typescript
// lib/usage.ts
export async function checkFeature(
  clientId: string,
  feature: string
): Promise<boolean> {
  const plan = await getClientPlan(clientId);
  return plan.features[feature] === true;
}

// Usage in route handler:
const allowed = await checkFeature(clientId, "weather_rules");
if (!allowed) {
  return Response.json({
    error:      "FEATURE_NOT_AVAILABLE",
    message:    "Weather-triggered rules require a Starter plan or higher.",
    upgradeUrl: `${APP_URL}/admin/settings/billing`,
  }, { status: 402 });
}
```

### 4.7 API Response Headers

Every AI/generation endpoint returns usage headers so the frontend can
update the counter without an extra request:

```http
X-Usage-Metric:  ai_slides
X-Usage-Current: 7
X-Usage-Limit:   10
X-Usage-Period:  2026-03
```

### 4.8 Admin Usage Dashboard (`/admin/settings/billing`)

Displays for the current tenant:

- Current plan name + renewal date
- Per-metric usage bars for the current month (used / limit)
- Upgrade CTA when any metric exceeds 80% of its limit
- Generation log table (metric, model, tokens, duration, timestamp)
- Plan comparison table with upgrade buttons

### 4.9 Usage Warnings in the UI

The Admin Dashboard surfacaes usage state proactively:

| Threshold | UI behaviour |
|---|---|
| ≥ 80% of any AI limit used | Yellow warning banner in Relay Studio / slide editor |
| 100% of any AI limit reached | Red banner + **✨ Generate with AI** button disabled + tooltip with upgrade link |
| Feature not on current plan | Button/toggle grayed out + lock icon + tooltip "Available on Starter+" |
| Storage > 90% | Warning in `/admin/media` header |
| Screens at plan limit | **Add screen** button disabled + upgrade prompt |

### 4.10 Plan Seeds

```typescript
// prisma/seed.ts — plan definitions
const plans = [
  {
    slug: "free", name: "Free", priceMonthly: 0,
    limits: {
      ai_slides: 10, ai_decks: 2, ai_announcements: 5, ai_schedule_suggest: 1,
      image_searches: 20, template_saves: 3, ai_library_items: 10,
      screens: 2, playlists: 5, schedules: 2, webhooks: 1, workflow_rules: 0,
    },
    features: {
      google_reviews: false, weather_rules: false, google_calendar: false,
      zone_layouts: false, video_wall: false, workflow_automation: false,
    },
  },
  {
    slug: "starter", name: "Starter", priceMonthly: 1900,
    limits: {
      ai_slides: 100, ai_decks: 20, ai_announcements: 50, ai_schedule_suggest: 10,
      image_searches: 200, template_saves: 20, ai_library_items: 100,
      screens: 5, playlists: 25, schedules: 10, webhooks: 5, workflow_rules: 3,
    },
    features: {
      google_reviews: true, weather_rules: true, google_calendar: false,
      zone_layouts: true, video_wall: false, workflow_automation: true,
    },
  },
  {
    slug: "pro", name: "Pro", priceMonthly: 5900,
    limits: {
      ai_slides: 500, ai_decks: 100, ai_announcements: 200, ai_schedule_suggest: 50,
      image_searches: 1000, template_saves: -1, ai_library_items: -1,
      screens: -1, playlists: -1, schedules: -1, webhooks: -1, workflow_rules: 25,
    },
    features: {
      google_reviews: true, weather_rules: true, google_calendar: true,
      zone_layouts: true, video_wall: false, workflow_automation: true,
    },
  },
  {
    slug: "enterprise", name: "Enterprise", priceMonthly: 0, // negotiated
    limits: {
      ai_slides: -1, ai_decks: -1, ai_announcements: -1, ai_schedule_suggest: -1,
      image_searches: -1, template_saves: -1, ai_library_items: -1,
      screens: -1, playlists: -1, schedules: -1, webhooks: -1, workflow_rules: -1,
    },
    features: {
      google_reviews: true, weather_rules: true, google_calendar: true,
      zone_layouts: true, video_wall: true, workflow_automation: true,
    },
  },
];
```

### 4.11 Stripe Integration (Payment)

Stripe handles subscription creation, upgrades, downgrades, and failed
payment handling. The platform does not store card details.

```
POST /api/v1/billing/checkout        Creates Stripe checkout session → redirect to Stripe
POST /api/v1/billing/portal          Opens Stripe customer portal (manage/cancel)
POST /api/v1/billing/webhook         Stripe webhook receiver
GET  /api/v1/clients/:clientId/usage Current usage snapshot for all metrics
GET  /api/v1/clients/:clientId/usage/log  Generation log (paginated)
```

**Stripe webhook events handled:**

| Event | Action |
|---|---|
| `checkout.session.completed` | Create / update `Subscription`, set `planSlug` |
| `invoice.payment_succeeded` | Advance `currentPeriodEnd`, reset monthly usage counters |
| `invoice.payment_failed` | Set `status: "past_due"`, email warning |
| `customer.subscription.deleted` | Set `status: "cancelled"`, downgrade to Free |
| `customer.subscription.updated` | Update `planSlug`, adjust limits immediately |

On successful payment, usage counters for the new period are **not** reset
manually — they are keyed by `period` (YYYY-MM), so rolling into a new
month automatically resets all counters.

### 4.12 Additional Environment Variables

```bash
# ── Stripe ────────────────────────────────────────────────────
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_STARTER_PRICE_ID="price_..."
STRIPE_PRO_PRICE_ID="price_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
```

---



| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS custom properties for per-tenant theming |
| Database | PostgreSQL 15 |
| ORM | Prisma |
| Cache | Redis 7 |
| Real-time Gateway | Soketi (self-hosted Pusher-compatible WebSocket server) |
| AI Generation | OpenRouter (`openrouter.ai/api/v1`) — model-agnostic |
| Image Provider (v1) | Pexels REST API |
| Image Provider (v2) | Pixabay REST API |
| Image Provider (v3) | Openverse API |
| Google Integrations | Google Calendar API, Google Places API |
| Weather | OpenWeatherMap API |
| Automation | n8n-compatible rule engine (custom) |
| Auth (API) | Bearer token — header or `?token=` query param |
| Auth (Admin) | NextAuth.js (credentials) |
| Asset Storage | MinIO (self-hosted S3-compatible) |
| Reverse Proxy | Nginx |
| Container | Docker + Docker Compose |
| Package manager | pnpm |

---

## 6. Repository Structure

```
display-platform/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── clients/
│   │       │   └── [clientId]/
│   │       │       ├── screens/              route.ts   GET list, POST create
│   │       │       │   └── [screenId]/       route.ts   GET, PATCH, DELETE
│   │       │       ├── screens/pair/         route.ts   POST — consume pairing code
│   │       │       ├── media/                route.ts   GET list, POST upload
│   │       │       │   └── [assetId]/        route.ts
│   │       │       ├── playlists/            route.ts
│   │       │       │   └── [playlistId]/     route.ts
│   │       │       ├── schedules/            route.ts
│   │       │       │   └── [scheduleId]/     route.ts
│   │       │       ├── templates/            route.ts   Relay Studio
│   │       │       ├── slides/
│   │       │       │   ├── route.ts
│   │       │       │   └── generate/         route.ts   AI generation
│   │       │       ├── announcements/
│   │       │       │   ├── route.ts
│   │       │       │   └── generate/         route.ts
│   │       │       ├── deck/generate/        route.ts   Full deck pipeline
│   │       │       ├── image/search/         route.ts   Image provider proxy
│   │       │       ├── kpi/                  route.ts
│   │       │       ├── availability/         route.ts
│   │       │       ├── schedule-data/        route.ts   Generic schedule entries
│   │       │       ├── social-feed/          route.ts
│   │       │       ├── schedule/suggest/     route.ts   AI dayparting
│   │       │       └── events/               route.ts   Soketi SSE proxy
│   │       └── hooks/
│   │           └── [clientId]/
│   │               ├── data-updated/         route.ts
│   │               ├── alert/                route.ts
│   │               ├── metric-updated/       route.ts
│   │               ├── record-created/       route.ts
│   │               └── calendar-sync/        route.ts
│   │
│   ├── pair/                                 page.tsx   TV pairing screen
│   │
│   ├── screens/
│   │   └── [clientId]/
│   │       └── [screenId]/                  page.tsx   Config-driven screen renderer
│   │
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx                          /welcome
│   │   ├── screens/                         page.tsx + [screenId]/page.tsx
│   │   ├── media/                           page.tsx
│   │   ├── playlists/                       page.tsx + [playlistId]/page.tsx
│   │   ├── schedules/                       page.tsx + [scheduleId]/page.tsx
│   │   ├── Relay-studio/                     page.tsx
│   │   ├── apps/                            page.tsx
│   │   ├── stream-urls/                     page.tsx
│   │   ├── video-wall/                      page.tsx
│   │   └── settings/                        page.tsx
│   │
│   └── layout.tsx
│
├── components/
│   ├── screens/
│   │   ├── ScreenShell.tsx                  Full-screen wrapper
│   │   ├── PairScreen.tsx                   TV pairing page (4-digit + QR)
│   │   ├── zones/
│   │   │   ├── MainZone.tsx                 Full-screen single zone
│   │   │   ├── ContentWeatherNewsZone.tsx   Split: content + weather + ticker
│   │   │   ├── ScheduleZone.tsx
│   │   │   ├── StatusZone.tsx
│   │   │   ├── AnnouncementZone.tsx
│   │   │   └── MetricsZone.tsx
│   │   └── slides/
│   │       ├── HeroSlide.tsx
│   │       ├── TwoColumnSlide.tsx
│   │       ├── SectionDividerSlide.tsx
│   │       ├── QuoteSlide.tsx
│   │       ├── GridSlide.tsx
│   │       ├── StreamUrlSlide.tsx
│   │       ├── GoogleReviewSlide.tsx
│   │       ├── WeatherSlide.tsx
│   │       └── WebLinkSlide.tsx
│   ├── ui/
│   │   ├── KpiCard.tsx
│   │   ├── Sparkline.tsx
│   │   ├── StatusBadge.tsx                  Online/Offline/Sleeping/Ready
│   │   ├── Toggle.tsx
│   │   └── Carousel.tsx
│   └── admin/
│       ├── ScreenList.tsx
│       ├── ScreenStatusBadge.tsx
│       ├── PairingCodeEntry.tsx
│       ├── MediaLibrary.tsx
│       ├── PlaylistEditor.tsx
│       ├── ScheduleCalendarGrid.tsx
│       ├── ZoneLayoutPicker.tsx
│       ├── RelayStudioBrowser.tsx
│       ├── TemplateCard.tsx
│       ├── SmoothSetupWizard.tsx
│       ├── BrandingEditor.tsx
│       ├── AiSlideGenerator.tsx
│       ├── WorkflowRuleBuilder.tsx
│       └── WeatherRuleSelector.tsx
│
├── lib/
│   ├── db.ts
│   ├── redis.ts
│   ├── soketi.ts
│   ├── auth.ts
│   ├── tenant.ts
│   ├── cache.ts
│   ├── pairing.ts                           Pairing code generation + validation
│   ├── storage.ts                           MinIO upload/delete/URL helpers
│   ├── ai.ts
│   ├── gcal.ts
│   ├── weather.ts
│   ├── reviews.ts
│   ├── automation.ts
│   ├── contentRefresh.ts
│   └── images/
│       ├── provider.ts
│       ├── pexels.ts
│       ├── pixabay.ts
│       ├── openverse.ts
│       ├── normalize.ts
│       └── attribution.ts
│
├── lib/render/
│   ├── renderDeckHtml.ts
│   └── themes.ts
│
├── lib/validation/
│   ├── deckSchema.ts
│   └── sanitizeHtml.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── hooks/
│   ├── useSSE.ts
│   ├── useScreenStatus.ts
│   └── useSlides.ts
│
├── types/
│   ├── screen.ts
│   ├── media.ts
│   ├── playlist.ts
│   ├── schedule.ts
│   ├── deck.ts
│   ├── image.ts
│   └── index.ts
│
├── config/
│   └── verticals/
│       ├── dental-clinic.ts
│       ├── cloud-hosting.ts
│       └── retail.ts
│
├── docker/
│   ├── docker-compose.yml
│   ├── nginx/nginx.conf
│   └── soketi/config.json
│
├── tailwind.config.ts
├── next.config.ts
├── .env.local
└── package.json
```

---

## 7. Environment Variables

```bash
# ── Database ──────────────────────────────────────────────────
DATABASE_URL="postgresql://user:password@localhost:5432/display_platform"

# ── Redis ─────────────────────────────────────────────────────
REDIS_URL="redis://localhost:6379"

# ── Soketi ────────────────────────────────────────────────────
SOKETI_HOST="localhost"
SOKETI_PORT="6001"
SOKETI_APP_ID="display-platform"
SOKETI_APP_KEY="your-app-key"
SOKETI_APP_SECRET="your-app-secret"

# ── Auth ──────────────────────────────────────────────────────
NEXTAUTH_SECRET="replace-with-a-long-random-string"
NEXTAUTH_URL="http://localhost:3000"
BCRYPT_ROUNDS=12

# ── AI — OpenRouter ───────────────────────────────────────────
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_DEFAULT_MODEL="anthropic/claude-3.5-sonnet"

# ── Image Providers ───────────────────────────────────────────
PEXELS_API_KEY="your-pexels-key"
PIXABAY_API_KEY="your-pixabay-key"
OPENVERSE_API_KEY=""

# ── Google Integrations ───────────────────────────────────────
GOOGLE_SERVICE_ACCOUNT_EMAIL="service@project.iam.gserviceaccount.com"
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_CALENDAR_WEBHOOK_SECRET="random-verification-token"
GOOGLE_PLACES_API_KEY="AIza..."

# ── Weather ───────────────────────────────────────────────────
OPENWEATHERMAP_API_KEY="your-owm-key"

# ── Asset Storage — MinIO ─────────────────────────────────────
MINIO_ENDPOINT="http://minio:9000"
MINIO_ACCESS_KEY="..."
MINIO_SECRET_KEY="..."
MINIO_BUCKET="display-platform-assets"
MINIO_PUBLIC_URL="https://your-domain.com/assets"

# ── App ───────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_PUBLIC_SOKETI_HOST="your-domain.com"
NEXT_PUBLIC_SOKETI_KEY="your-app-key"

# ── Pairing ───────────────────────────────────────────────────
PAIRING_CODE_TTL_SECONDS=300       # 5 minutes
PAIRING_CODE_LENGTH=6              # matches reference UX (123456 shown on TV)
```

---

## 8. Database Schema

### 7.1 Core Tables

```prisma
// Tenant
model Client {
  id        String   @id @default(uuid())
  slug      String   @unique
  name      String
  vertical  String   @default("generic")
  city      String?
  config    Json     @default("{}")
  status    String   @default("active")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Individual screen device
model Screen {
  id              String    @id @default(uuid())
  clientId        String
  name            String
  slug            String
  status          String    @default("offline")  // online|offline|sleeping|ready
  type            String    @default("WEB")       // WEB|HDMI|PLAYER
  tags            String[]
  location        String?
  spaceId         String?
  nowPlayingId    String?   // FK to Playlist or Schedule
  lastSeenAt      DateTime?
  operationHours  Json?     // { mon: ["08:00","22:00"], tue: [...] }
  token           String    @unique  // screen auth token
  config          Json      @default("{}")
  createdAt       DateTime  @default(now())
  client          Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)
}

// Pairing code — ephemeral, stored in Redis not Postgres
// Redis key: pair:{code} → { clientId, expiresAt }
// After pairing: deleted from Redis, screen.token written to Screen row

// Media asset
model MediaAsset {
  id         String   @id @default(uuid())
  clientId   String
  name       String
  folderId   String?
  mimeType   String   // image/jpeg, video/mp4, application/pdf …
  url        String   // MinIO public URL
  sizeBytes  Int
  width      Int?
  height     Int?
  durationMs Int?     // for video
  tags       String[]
  createdAt  DateTime @default(now())
  client     Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
}

// Media folder
model MediaFolder {
  id        String   @id @default(uuid())
  clientId  String
  name      String
  parentId  String?
  client    Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
}

// Playlist — mixed content types
model Playlist {
  id          String         @id @default(uuid())
  clientId    String
  name        String
  status      String         @default("draft")  // draft|published
  contentTypes String[]      // ["media","application","stream_url"] — for badge display
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  items       PlaylistItem[]
  client      Client         @relation(fields: [clientId], references: [id], onDelete: Cascade)
}

// Playlist item — polymorphic
model PlaylistItem {
  id           String   @id @default(uuid())
  playlistId   String
  sortOrder    Int      @default(0)
  durationSec  Int      @default(10)
  itemType     String   // "media"|"template"|"stream_url"|"web_link"|"google_reviews"|"weather"|"dashboard"
  mediaAssetId String?  // if itemType = media
  templateId   String?  // if itemType = template
  url          String?  // if itemType = stream_url | web_link | dashboard
  config       Json     @default("{}")
  playlist     Playlist @relation(fields: [playlistId], references: [id], onDelete: Cascade)
}

// Schedule
model Schedule {
  id          String           @id @default(uuid())
  clientId    String
  name        String
  zoneLayout  String           @default("main")  // "main"|"content-weather-news"|custom
  zoneConfig  Json             @default("{}")
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  slots       ScheduleSlot[]
  client      Client           @relation(fields: [clientId], references: [id], onDelete: Cascade)
}

// Schedule time slot
model ScheduleSlot {
  id           String   @id @default(uuid())
  scheduleId   String
  dayOfWeek    Int?     // 0=Sun … 6=Sat; null = every day
  startTime    String   // "09:00"
  endTime      String   // "12:00"
  playlistId   String?
  templateId   String?
  zoneId       String?  // which zone this slot applies to (for split layouts)
  weatherCond  String?
  schedule     Schedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
}

// Relay Studio template
model Template {
  id           String   @id @default(uuid())
  clientId     String?  // null = global library
  name         String
  category     String   // "healthcare"|"corporate"|"food"|"retail"…
  mainGroup    String   // "digital-menu"|"corporate"|"all"
  orientation  String   @default("horizontal")  // horizontal|vertical|both
  thumbnailUrl String?
  htmlContent  String   // rendered HTML
  config       Json     @default("{}")
  isLibrary    Boolean  @default(false)  // true = part of global Relay Studio library
  aiGenerated  Boolean  @default(false)
  createdAt    DateTime @default(now())
}

// App / Integration record
model AppIntegration {
  id          String   @id @default(uuid())
  clientId    String
  type        String   // "web_link"|"dashboard"|"stream_url"
  name        String
  url         String
  provider    String?  // "salesforce"|"zendesk"|"github"|"trello"|…
  config      Json     @default("{}")
  createdAt   DateTime @default(now())
  client      Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
}

// Generic availability / resource status
model Availability {
  id            String    @id @default(uuid())
  clientId      String
  resourceId    String
  resourceLabel String
  resourceType  String
  status        String    @default("available")
  currentRef    String?
  statusSince   DateTime?
  updatedAt     DateTime  @updatedAt
  client        Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)
}

// Webhook event log
model WebhookEvent {
  id          String    @id @default(uuid())
  clientId    String
  eventId     String
  eventType   String
  payload     Json
  processed   Boolean   @default(false)
  error       String?
  receivedAt  DateTime  @default(now())
  processedAt DateTime?
  @@unique([clientId, eventId])
}

// API token
model ApiToken {
  id          String    @id @default(uuid())
  clientId    String
  tokenHash   String
  label       String?
  scopes      String[]  @default(["read"])
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  revoked     Boolean   @default(false)
  createdAt   DateTime  @default(now())
  client      Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)
}

// Workflow rule
model WorkflowRule {
  id            String   @id @default(uuid())
  clientId      String
  name          String
  triggerEvent  String
  conditionJson Json
  actionType    String
  actionPayload Json
  enabled       Boolean  @default(true)
  createdAt     DateTime @default(now())
  client        Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
}

// AI content library
model AiContentLibrary {
  id             String    @id @default(uuid())
  vertical       String
  category       String
  targetScreen   String
  monthRelevance Int[]
  icon           String?
  tag            String?
  title          String
  body           String
  mediaUrl       String?
  aiModel        String
  generatedAt    DateTime  @default(now())
  refreshedAt    DateTime?
}

// Image cache
model ImageCache {
  id        String   @id @default(uuid())
  provider  String
  queryHash String
  results   Json
  cachedAt  DateTime @default(now())
  expiresAt DateTime
  @@unique([provider, queryHash])
}
```

---

## 9. Screen Management & Pairing

### 8.1 TV Pairing Screen (`/pair`)

When a TV loads `/pair` for the first time, the page:

1. Calls `POST /api/v1/pair/request` with a device fingerprint.
2. Server generates a 6-digit numeric code, stores `pair:{code} → { clientId?, deviceFingerprint }` in Redis with a 5-minute TTL.
3. TV displays the code in large digits + a QR code that encodes the admin URL with the code pre-filled.

```
┌─────────────────────────────┐
│   [Platform Logo]           │
│                             │
│   Pair Your Screen          │
│                             │
│   1. Go to your admin       │
│      dashboard              │
│   2. Click Add screen       │
│   3. Enter the code below   │
│                             │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐  │
│  │ 1 │ │ 0 │ │ 6 │ │ 0 │  │
│  └───┘ └───┘ └───┘ └───┘  │
│                             │
│   [QR code]                 │
│   Scan to open admin        │
└─────────────────────────────┘
```

### 8.2 Admin Pairing Flow

1. Admin clicks **Add screen** in `/admin/screens`.
2. Modal prompts for the 6-digit code shown on the TV.
3. `POST /api/v1/clients/:clientId/screens/pair` validates the code against Redis.
4. On success: a `Screen` row is created, a bearer token is generated and sent to the TV browser (which stores it in `localStorage`), Redis key deleted.
5. TV redirects to `/screens/:clientId/:screenId` and begins polling + SSE.

### 8.3 `lib/pairing.ts`

```typescript
export async function generatePairingCode(fingerprint: string): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await redis.setex(`pair:${code}`, parseInt(process.env.PAIRING_CODE_TTL_SECONDS!), JSON.stringify({ fingerprint }));
  return code;
}

export async function consumePairingCode(code: string, clientId: string) {
  const raw = await redis.get(`pair:${code}`);
  if (!raw) throw new Error("Invalid or expired pairing code");
  await redis.del(`pair:${code}`);
  return JSON.parse(raw);
}
```

---

## 10. Media Library

### 9.1 Overview

Located at `/admin/media`. Backed by MinIO. Supports images (JPEG, PNG, WebP,
GIF, SVG), videos (MP4, WebM), and PDFs.

### 9.2 `lib/storage.ts`

```typescript
import { Client as MinioClient } from "minio";

export const minio = new MinioClient({
  endPoint: process.env.MINIO_ENDPOINT!.replace("http://", ""),
  useSSL:   false,
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
});

export async function uploadAsset(clientId: string, file: Buffer, name: string, mime: string) {
  const key  = `${clientId}/${Date.now()}-${name}`;
  await minio.putObject(process.env.MINIO_BUCKET!, key, file, { "Content-Type": mime });
  return `${process.env.MINIO_PUBLIC_URL}/${key}`;
}

export async function deleteAsset(key: string) {
  await minio.removeObject(process.env.MINIO_BUCKET!, key);
}
```

### 9.3 API

```
GET    /api/v1/clients/:clientId/media            ?folderId=&search=&sort=name|date
POST   /api/v1/clients/:clientId/media            multipart/form-data upload
DELETE /api/v1/clients/:clientId/media/:assetId
GET    /api/v1/clients/:clientId/media/folders
POST   /api/v1/clients/:clientId/media/folders    { name, parentId? }
```

---

## 10. Playlists

### 10.1 Overview

Playlists combine any mix of content types in a single ordered list:
media files, Relay Studio templates, web links, stream URLs, Google Reviews
slides, weather slides, and dashboard embeds. Each item has an independent
`durationSec`.

### 10.2 Content Type Badges

Each playlist row in the list view shows colour-coded content type badges
derived from the distinct `itemType` values across its items:

| Badge | itemType values | Example |
|---|---|---|
| Media | `media` | Images, videos |
| Application | `web_link`, `dashboard`, `stream_url` | Salesforce, news feed |
| Template | `template` | Relay Studio slides |
| Widget | `google_reviews`, `weather` | Reviews carousel |

### 10.3 API

```
GET    /api/v1/clients/:clientId/playlists
POST   /api/v1/clients/:clientId/playlists           { name }
GET    /api/v1/clients/:clientId/playlists/:id
PATCH  /api/v1/clients/:clientId/playlists/:id
DELETE /api/v1/clients/:clientId/playlists/:id
POST   /api/v1/clients/:clientId/playlists/:id/publish
POST   /api/v1/clients/:clientId/playlists/:id/items
PATCH  /api/v1/clients/:clientId/playlists/:id/items/:itemId
DELETE /api/v1/clients/:clientId/playlists/:id/items/:itemId
POST   /api/v1/clients/:clientId/playlists/:id/assign  { screenIds: [] }
```

---

## 11. Schedules & Zone Layouts

### 11.1 Schedule Builder

Located at `/admin/schedules`. Presents a visual weekly calendar grid per
screen. Each time block is assigned a playlist. Blocks can span multiple days
or be day-specific.

### 11.2 Zone Layout Picker

When creating or editing a schedule, a modal asks:
**"Would you like to split the screen into zones?"**

Two initial layout options (expandable):

| Layout | Description |
|---|---|
| **Main** | Full-screen single zone — one playlist fills the entire display |
| **Content + Weather Right + News** | Left/main zone for content, right panel for weather widget, bottom ticker for news/announcements |

The selected `zoneLayout` is stored on the `Schedule` row. The TV screen
renderer reads this and mounts the appropriate zone component combination.

### 11.3 Zone Components

```typescript
// Zone layout map — driven by schedule.zoneLayout
const ZONE_LAYOUTS: Record<string, React.FC<ZoneProps>> = {
  "main":                  MainZone,
  "content-weather-news":  ContentWeatherNewsZone,
  // future: "split-left", "quad", etc.
};
```

### 11.4 API

```
GET    /api/v1/clients/:clientId/schedules
POST   /api/v1/clients/:clientId/schedules
PATCH  /api/v1/clients/:clientId/schedules/:id
DELETE /api/v1/clients/:clientId/schedules/:id
POST   /api/v1/clients/:clientId/schedules/:id/slots
PATCH  /api/v1/clients/:clientId/schedules/:id/slots/:slotId
DELETE /api/v1/clients/:clientId/schedules/:id/slots/:slotId
POST   /api/v1/clients/:clientId/schedules/:id/assign  { screenIds: [] }
```

---

## 12. Relay Studio — Template Library

### 12.1 Template Library Browser

Located at `/admin/Relay-studio`. Two tabs: **Template Library** (global
shared library) and **My Templates** (client-specific saved/customised
templates).

**Filters (left sidebar):**

- **Orientation**: Both / Vertical / Horizontal
- **Main Group**: All / Digital Menu Boards / Corporate / …
- **Categories**: All Templates / Coffee & Tea / Healthcare / Vintage /
  Asian Food / Poke / Donuts / Bakery / Medical / Corporate / …

**Header controls:** Search bar · Create Template button

Templates are displayed in a responsive grid. Each card shows a thumbnail,
name, and hover actions (Use / Preview / Edit).

### 12.2 Smooth Setup Wizard

Triggered from `/admin/schedules` when creating a first schedule. Multi-step
modal:

1. **Step 1** — Select vertical / category context (pre-filtered template grid).
2. **Step 2** — Select 4 templates to populate the initial playlist.
3. **Step 3** — Zone layout picker (Main vs split).
4. Finish → schedule and playlist created automatically.

### 12.3 Template Data Model

Templates in the global library (`isLibrary: true`) are seeded from the AI
content library and Pexels-backed generation. Client templates
(`isLibrary: false, clientId: X`) are saved customisations.

### 12.4 API

```
GET  /api/v1/clients/:clientId/templates   ?library=true&category=&orientation=&search=
POST /api/v1/clients/:clientId/templates   { name, category, htmlContent, config }
GET  /api/v1/clients/:clientId/templates/:id
PATCH /api/v1/clients/:clientId/templates/:id
POST /api/v1/clients/:clientId/deck/generate   full AI pipeline
POST /api/v1/clients/:clientId/image/search    Pexels/Pixabay proxy
```

---

## 13. Apps, Stream URLs & Dashboards

Located at `/admin/apps`. Three sections:

### 13.1 Web Links

Embed any URL as a full-screen or zone slide. Stored as
`AppIntegration { type: "web_link" }` and rendered via `<WebLinkSlide>` which
mounts a sandboxed `<iframe>`. Used for news feeds, weather pages, custom
web apps, or any HTTPS URL.

### 13.2 Dashboards

Pre-configured dashboard integrations rendered as iframes. Supported
providers (stored as `AppIntegration { type: "dashboard", provider: "..." }`):

- Salesforce
- Zendesk
- GitHub (repository stats)
- Trello
- Custom URL fallback

Each dashboard integration can be added to any playlist as an `itemType:
"dashboard"` item.

### 13.3 Live Streaming

`itemType: "stream_url"` in a playlist. Renders an RTMP/HLS stream via an
HTML5 `<video>` element or embedded player. Marked as **coming soon** in
the initial UI — functional stub present, full implementation in P3.

### 13.4 API

```
GET    /api/v1/clients/:clientId/apps
POST   /api/v1/clients/:clientId/apps   { type, name, url, provider?, config? }
DELETE /api/v1/clients/:clientId/apps/:id
```

---

## 14. API Routes

### 14.1 Complete Route List

```
# Billing & Usage
POST   /api/v1/billing/checkout
POST   /api/v1/billing/portal
POST   /api/v1/billing/webhook                  Stripe events
GET    /api/v1/clients/:clientId/usage           Current month counters for all metrics
GET    /api/v1/clients/:clientId/usage/log       Generation log (paginated)

# Screens
GET    /api/v1/clients/:clientId/screens
POST   /api/v1/clients/:clientId/screens
GET    /api/v1/clients/:clientId/screens/:screenId
PATCH  /api/v1/clients/:clientId/screens/:screenId
DELETE /api/v1/clients/:clientId/screens/:screenId
POST   /api/v1/clients/:clientId/screens/pair        { code }

# Media
GET    /api/v1/clients/:clientId/media
POST   /api/v1/clients/:clientId/media
DELETE /api/v1/clients/:clientId/media/:assetId
GET    /api/v1/clients/:clientId/media/folders
POST   /api/v1/clients/:clientId/media/folders

# Playlists
GET    /api/v1/clients/:clientId/playlists
POST   /api/v1/clients/:clientId/playlists
GET    /api/v1/clients/:clientId/playlists/:id
PATCH  /api/v1/clients/:clientId/playlists/:id
DELETE /api/v1/clients/:clientId/playlists/:id
POST   /api/v1/clients/:clientId/playlists/:id/publish
POST   /api/v1/clients/:clientId/playlists/:id/items
PATCH  /api/v1/clients/:clientId/playlists/:id/items/:itemId
DELETE /api/v1/clients/:clientId/playlists/:id/items/:itemId
POST   /api/v1/clients/:clientId/playlists/:id/assign

# Schedules
GET    /api/v1/clients/:clientId/schedules
POST   /api/v1/clients/:clientId/schedules
PATCH  /api/v1/clients/:clientId/schedules/:id
DELETE /api/v1/clients/:clientId/schedules/:id
POST   /api/v1/clients/:clientId/schedules/:id/slots
PATCH  /api/v1/clients/:clientId/schedules/:id/slots/:slotId
DELETE /api/v1/clients/:clientId/schedules/:id/slots/:slotId
POST   /api/v1/clients/:clientId/schedules/:id/assign

# Relay Studio / Templates
GET    /api/v1/clients/:clientId/templates
POST   /api/v1/clients/:clientId/templates
GET    /api/v1/clients/:clientId/templates/:id
PATCH  /api/v1/clients/:clientId/templates/:id
DELETE /api/v1/clients/:clientId/templates/:id
POST   /api/v1/clients/:clientId/deck/generate
POST   /api/v1/clients/:clientId/image/search

# Apps
GET    /api/v1/clients/:clientId/apps
POST   /api/v1/clients/:clientId/apps
DELETE /api/v1/clients/:clientId/apps/:id

# Screen data (consumed by TV)
GET    /api/v1/clients/:clientId/status
GET    /api/v1/clients/:clientId/schedule-data
GET    /api/v1/clients/:clientId/availability
GET    /api/v1/clients/:clientId/kpi
GET    /api/v1/clients/:clientId/social-feed
GET    /api/v1/clients/:clientId/events             SSE stream

# AI generation
POST   /api/v1/clients/:clientId/slides/generate
POST   /api/v1/clients/:clientId/announcements/generate
POST   /api/v1/clients/:clientId/schedule/suggest

# Webhooks
POST   /api/v1/hooks/:clientId/data-updated
POST   /api/v1/hooks/:clientId/alert
POST   /api/v1/hooks/:clientId/metric-updated
POST   /api/v1/hooks/:clientId/record-created
POST   /api/v1/hooks/:clientId/calendar-sync

# Pairing
POST   /api/v1/pair/request    { fingerprint } → { code }
```

### 14.2 Authentication

```http
Authorization: Bearer {token}
```

Or query param for TV screen URLs: `?token={token}`

### 14.3 Error Format

```json
{ "error": "UNAUTHORIZED", "message": "Invalid or missing bearer token", "status": 401 }
```

---

## 15. TV Screen Routes

Screens are config-driven — one dynamic page component renders all screen
types by loading the screen record and its assigned playlist/schedule.

```
/pair                                    Pairing page (pre-auth)
/screens/:clientId/:screenId             Main screen renderer
/screens/:clientId/:screenId?token=...   With inline auth token
```

The renderer resolves `screen.nowPlayingId`, loads the playlist or schedule,
picks the correct `zoneLayout` component, and begins the content loop.

**Fallback:** If API unreachable on mount → branded offline slide + retry
every 10 seconds.

---

## 16. Real-Time: Soketi SSE Gateway

### 16.1 Docker Service

```yaml
soketi:
  image: quay.io/soketi/soketi:latest
  environment:
    SOKETI_DEFAULT_APP_ID:     "display-platform"
    SOKETI_DEFAULT_APP_KEY:    "${SOKETI_APP_KEY}"
    SOKETI_DEFAULT_APP_SECRET: "${SOKETI_APP_SECRET}"
    SOKETI_REDIS_HOST:         "redis"
    SOKETI_REDIS_PORT:         "6379"
  depends_on: [redis]
  restart: unless-stopped
```

### 16.2 Broadcasting

```typescript
// lib/soketi.ts
export const broadcast = (clientId: string, event: string, data: object) =>
  soketi.trigger(`events:${clientId}`, event, data);
```

### 16.3 TV Subscription

```typescript
const channel = pusher.subscribe(`events:${clientId}`);
channel.bind("playlist.updated",      (d) => reloadPlaylist(d.playlistId));
channel.bind("schedule.updated",      (d) => reloadSchedule(d.scheduleId));
channel.bind("screen.command",        (d) => handleCommand(d.command)); // refresh/reboot
channel.bind("availability.changed",  (d) => updateZone(d));
channel.bind("alert.raised",          (d) => showAlertOverlay(d));
channel.bind("heartbeat",             ()  => updateLastSeen());
```

### 16.4 Event Types

| Event | Payload | Triggered by |
|---|---|---|
| `playlist.updated` | `{ playlistId }` | Admin saves playlist |
| `schedule.updated` | `{ scheduleId }` | Admin saves schedule |
| `screen.command` | `{ command: "refresh"\|"reboot" }` | Admin remote control |
| `availability.changed` | `{ resourceId, status }` | Calendar sync / webhook |
| `alert.raised` | `{ level, message }` | Alert webhook / rule |
| `alert.cleared` | `{ level }` | Alert webhook |
| `heartbeat` | `{ ts }` | Server every 30 s |

---

## 17. Webhook Endpoints

### 17.1 Idempotency

```typescript
const existing = await prisma.webhookEvent.findUnique({
  where: { clientId_eventId: { clientId, eventId } }
});
if (existing) return Response.json({ ok: true, duplicate: true });
```

### 17.2 Pipeline

1. Validate token + `clientId`.
2. Idempotency check.
3. Upsert data (generic model fields).
4. Run `workflow_rules` via `lib/automation.ts`.
5. Broadcast to Soketi.
6. Mark event processed.

---

## 18. Multi-Tenancy & Auth

All Prisma queries are wrapped in `lib/tenant.ts` which auto-appends
`WHERE client_id = $clientId`. Admin session via NextAuth.js. Screen tokens
are per-screen bearer tokens stored hashed in `Screen.token`.

---

## 19. Vertical Packages & Configuration

All industry-specific labels and field names live in
`config/verticals/*.ts` and are stored in `clients.config` (JSONB).
Components read only generic field names. Example:

```typescript
// config/verticals/dental-clinic.ts
export const dentalClinicConfig = {
  vertical: "dental-clinic",
  scheduleEntityLabel: "Patient",
  resourceType: "person",
  resourceLabel: "Doctor",
  statusFieldMap: {
    occupied:  { label: "With Patient", color: "#E8A87C" },
    available: { label: "Available",    color: "#5BAD8A" },
    break:     { label: "On Break",     color: "#CCC" },
  },
  packageDefaults: ["schedule-board", "waiting-display", "status-board"],
  templateCategories: ["healthcare", "corporate"],
};
```

---

## 20. Branding & Theming

```typescript
// CSS vars injected at screen layout level
const cssVars = `
  --color-primary:   ${branding.primaryColor};
  --color-secondary: ${branding.secondaryColor};
  --color-accent:    ${branding.accentColor};
  --font-family:     ${branding.fontFamily};
`;
```

Tailwind config exposes `bg-primary`, `text-accent` etc. via `var(--color-*)`.

---

## 21. Screen Polling Strategy

| Data | Interval | Notes |
|---|---|---|
| Status check | On mount | Then rely on SSE heartbeat |
| Active playlist items | 60 s | SSE handles real-time updates |
| Schedule data | At slot boundary | Re-fetch when time window changes |
| Availability / resource status | 60 s | SSE overrides via GCal push |
| KPI metrics | 60 s | Owner dashboard only |
| Social feed (reviews) | 60 min | Redis-cached server-side |
| Weather | 10 min | Redis-cached server-side |
| SSE (Soketi) | Persistent | Auto-reconnect |

---

## 22. Slide Generation Engine

### 22.1 Pipeline (9 Steps)

1. User submits prompt to `POST /deck/generate`
2. LLM (OpenRouter) returns structured deck JSON
3. Zod validation (`lib/validation/deckSchema.ts`)
4. Per-slide image search via active `ImageProvider`
5. Hard filter candidates (min dimensions, aspect ratio, tag quality)
6. LLM picks best from top 5 candidates
7. Deterministic attribution built by `lib/images/attribution.ts`
8. HTML rendered by `lib/render/renderDeckHtml.ts`
9. Persisted to `decks` table

### 22.2 Core Types

```typescript
type DeckSlide = {
  id: string; order: number; title: string; subtitle?: string;
  bodyHtml: string;
  layout: "hero"|"two-column"|"image-left"|"image-right"|"quote"|"grid";
  imageIntent?: SlideImageIntent;
  selectedImage?: SlideImage;
  attributionHtml?: string;
};

type SlideImageIntent = {
  query: string; visualStyle?: string;
  orientation?: "landscape"|"portrait"|"square";
  avoidTerms?: string[]; requiredConcepts?: string[];
};
```

### 22.3 Fallback Strategy

| Failure | Fallback |
|---|---|
| Provider search fails | Text-only slide |
| No images pass filter | Retry with simplified query |
| All retries fail | Render without image |
| LLM JSON malformed | Retry once, then deterministic template |
| LLM selection fails | Highest-scoring filtered candidate |

---

## 23. Image Provider System

### 23.1 Interface

```typescript
interface ImageProvider {
  name: "pexels" | "pixabay" | "openverse";
  searchImages(input: {
    query: string; perPage?: number;
    orientation?: "landscape"|"portrait"|"square"; locale?: string;
  }): Promise<SlideImage[]>;
}
```

### 23.2 Normalized Image Type

```typescript
type SlideImage = {
  provider: "pexels"|"pixabay"|"openverse"; providerId: string;
  imageUrl: string; previewUrl?: string; pageUrl?: string;
  width?: number; height?: number;
  author?: string; authorUrl?: string;
  licenseLabel?: string; licenseUrl?: string;
  attributionText: string; attributionHtml: string;
  tags?: string[]; score?: number; requiresReview?: boolean;
};
```

### 23.3 Provider Roadmap

| Phase | Provider | Limit |
|---|---|---|
| P1 | Pexels | 200 req/hr, 20k/month — free |
| P2 | Pixabay | Same interface, different adapter |
| P3 | Openverse | Open-license pool, `requiresReview: true` |

Results cached in `image_cache` table with 24-hour TTL.

---

## 24. AI Content Generation — OpenRouter

```typescript
// lib/ai.ts — single model-agnostic fetch
const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type":  "application/json",
    "HTTP-Referer":  process.env.NEXT_PUBLIC_APP_URL!,
  },
  body: JSON.stringify({
    model,
    response_format: { type: "json_object" },
    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
  }),
});
```

Endpoints: `POST /slides/generate`, `POST /announcements/generate`,
`POST /deck/generate`, `POST /schedule/suggest`.

The Admin Relay Studio editor has an **✨ Generate with AI** button beside
every text field. System prompt is built with the client's name, vertical
tone, and brand voice from `clients.config`.

---

## 25. Google Calendar — Availability Sync

Admin maps each `resourceId` to a Google Calendar ID in `resource_calendars`.
On save, a push notification channel is registered with Google. On push:

1. Verify `X-Goog-Channel-Token`.
2. Re-fetch changed events from Google Calendar API.
3. Upsert `availability` rows.
4. Broadcast `availability.changed` to Soketi.
5. Screens update instantly.

A daily cron renews channels expiring within 24 hours.

---

## 26. Google Reviews — Social Trust Widget

`PlaylistItem { itemType: "google_reviews", config: { placeId: "ChIJ..." } }`.

`GET /social-feed?type=google-reviews` fetches top 5 reviews by rating
from Google Places API, cached in Redis 1 hour. `<GoogleReviewSlide>`
renders star rating, reviewer name, excerpt.

---

## 27. Weather-Triggered Content — OpenWeatherMap

`lib/weather.ts` polls OWM every 10 minutes per client city, caches in Redis.
`ScheduleSlot.weatherCond` filters which slots are active under the current
conditions. Admin schedule builder gains a weather condition selector per
slot, and the zone layout preview shows a simulated condition toggle.

---

## 28. n8n Workflow Automation Hub

`lib/automation.ts` runs matching `WorkflowRule` rows on every inbound
webhook. Action types: `sse_broadcast`, `webhook_post`, `slack_post`, `sms`.
Pre-built rule templates are seeded as data rows with `name` labels.
Visual rule builder at `/admin/automations`: trigger selector, condition
builder, action config, test mode.

---

## 29. AI Content Library

`AiContentLibrary` table holds 200+ pre-generated templates tagged by
`vertical`, `category`, `targetScreen`, `monthRelevance`. Seeded via
`prisma/seed.ts` using OpenRouter batch generation. Nightly cron
(`lib/contentRefresh.ts` at `/api/cron/refresh-content`) refreshes content
for the upcoming month. When enabled for a client, the playlist editor
surfaces relevant items from the library filtered by vertical and month.

---

## 30. VPS Deployment (Self-Hosted)

### 30.1 Architecture

```
Internet (HTTPS 443)
    │
  Nginx
    ├── /         → Next.js app  :3000
    ├── /ws/      → Soketi       :6001
    └── /assets/  → MinIO        :9000

Docker bridge (internal)
    ├── app       Next.js
    ├── postgres  :5432
    ├── redis     :6379
    ├── soketi    :6001
    └── minio     :9000 / :9001 console
```

### 30.2 Docker Compose

```yaml
version: "3.9"
services:

  app:
    build: .
    env_file: .env.local
    depends_on: [postgres, redis, soketi, minio]
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB:       display_platform
      POSTGRES_USER:     postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data
    restart: unless-stopped

  soketi:
    image: quay.io/soketi/soketi:latest
    environment:
      SOKETI_DEFAULT_APP_ID:     "display-platform"
      SOKETI_DEFAULT_APP_KEY:    "${SOKETI_APP_KEY}"
      SOKETI_DEFAULT_APP_SECRET: "${SOKETI_APP_SECRET}"
      SOKETI_REDIS_HOST:         "redis"
      SOKETI_REDIS_PORT:         "6379"
    depends_on: [redis]
    restart: unless-stopped

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER:     ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - miniodata:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on: [app, soketi, minio]
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
  miniodata:
```

### 30.3 Nginx Configuration

```nginx
upstream nextjs { server app:3000; }
upstream soketi { server soketi:6001; }
upstream minio  { server minio:9000; }

server {
  listen 443 ssl;
  server_name your-domain.com;

  ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

  location /assets/ {
    proxy_pass         http://minio/display-platform-assets/;
    proxy_set_header   Host $host;
    expires            7d;
    add_header         Cache-Control "public";
  }

  location /ws/ {
    proxy_pass         http://soketi;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection "upgrade";
    proxy_read_timeout 3600s;
    proxy_buffering    off;
  }

  location / {
    proxy_pass         http://nextjs;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection "upgrade";
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;
  }
}

server {
  listen 80;
  server_name your-domain.com;
  return 301 https://$host$request_uri;
}
```

### 30.4 TV Browser Setup

TV screens connect over HTTPS. No special network config required.

```bash
# Raspberry Pi or Android TV in kiosk mode
chromium-browser \
  --kiosk --noerrdialogs --disable-infobars --no-first-run \
  "https://your-domain.com/pair"
# After pairing, token is saved in localStorage and TV redirects to its screen URL automatically
```

---

## 31. Prioritized Build Roadmap

### 🔴 Phase 1 — Core Platform (Weeks 1–4)

- Prisma schema + migrations + seed (including `Plan`, `Subscription`, `UsageRecord`, `GenerationLog`)
- Plan seed data (Free / Starter / Pro / Enterprise with all limits + feature flags)
- `lib/usage.ts` — `checkAndIncrement()`, `checkFeature()`, Redis caching layer
- Usage response headers (`X-Usage-*`) on all AI/generation endpoints
- `/admin/settings/billing` — plan overview, usage bars, generation log table
- Usage warning banners in Relay Studio and slide editor (80% / 100% thresholds)
- Locked UI states (grayed buttons, lock icons, upgrade tooltips) for feature flags

- Prisma schema + migrations + seed
- NextAuth.js admin auth
- `/admin/screens` — list, status badges, filters (Status/Tags/Locations/Spaces)
- `/pair` — TV pairing page (6-digit code + QR)
- Admin pairing modal + `lib/pairing.ts`
- `/admin/media` — MinIO upload, folder management, grid/list view, search
- `/admin/playlists` — create, edit, mixed content type items, publish, assign to screen
- `/admin/schedules` — weekly calendar grid, time slot assignment, zone layout picker modal
- Soketi Docker service + `lib/soketi.ts`
- TV screen renderer (`/screens/:clientId/:screenId`) — playlist loop + SSE subscription
- Screen heartbeat (Online/Offline/Sleeping detection)
- MinIO `lib/storage.ts` + Nginx `/assets/` proxy
- Docker Compose full stack
- Nginx SSL config

### 🟡 Phase 2 — Relay Studio + AI + Integrations (Weeks 5–10)

- Stripe checkout + customer portal + billing webhook handler
- Subscription lifecycle: upgrade, downgrade, cancellation, past-due handling
- Auto-reset of usage counters on new billing period (`invoice.payment_succeeded`)
- Usage enforcement on all AI generation routes

- `/admin/Relay-studio` — template library browser with orientation/group/category filters
- Template card grid + search
- Smooth Setup wizard (select 4 templates → playlist)
- `lib/ai.ts` — OpenRouter client
- `POST /slides/generate` + `POST /announcements/generate`
- **✨ Generate with AI** button in template editor
- Slide generation pipeline (§22) — deck spec → image search → LLM rank → HTML render
- `lib/images/pexels.ts` — Pexels adapter + normalize + attribution + cache
- `/admin/apps` — Web links, Dashboards (Salesforce/Zendesk/GitHub/Trello), Stream URLs stub
- `lib/weather.ts` + weather rule columns on `ScheduleSlot`
- Weather condition selector in schedule builder
- `ContentWeatherNewsZone` split-zone component
- `lib/gcal.ts` — Google Calendar push sync + `resource_calendars` table
- `lib/reviews.ts` + `<GoogleReviewSlide>` component
- `AI schedule suggest` endpoint + "AI Suggestions" panel

### 🟡 Phase 3 — Automation + AI Library (Weeks 11–16)

- `workflow_rules` table + `lib/automation.ts`
- `/admin/automations` — visual rule builder, pre-built templates, test mode
- `ai_content_library` table + batch seed (200+ templates via OpenRouter)
- Nightly content refresh cron
- AI Content Library browser in admin
- Pixabay image provider (Phase 2 of image system)
- `My Templates` tab in Relay Studio
- Screen operation hours + sleeping status logic
- Remote reboot/refresh via SSE `screen.command`

### 🔵 Phase 4 — Polish & Expansion (Month 4+)

- Drag-and-drop template editor (Relay Studio create mode)
- Video wall layout builder (`/admin/video-wall`)
- Live Streaming slide type (full implementation)
- Openverse image provider (license-review flag)
- Integration registry / app marketplace UI
- Portrait orientation support
- Multi-screen bulk actions
- PDF slide support

---

## 32. Local Development

### 32.1 Start Services

```bash
docker compose -f docker/docker-compose.yml up -d postgres redis soketi minio
```

### 32.2 Bootstrap

```bash
pnpm install
cp .env.example .env.local
# Fill: DATABASE_URL, REDIS_URL, SOKETI_*, MINIO_*, PEXELS_API_KEY, OPENROUTER_API_KEY

pnpm prisma migrate dev --name init
pnpm prisma db seed
pnpm dev
```

### 32.3 Useful Local URLs

| URL | Description |
|---|---|
| `http://localhost:3000/admin` | Admin dashboard |
| `http://localhost:3000/pair` | TV pairing page |
| `http://localhost:3000/screens/demo-client/lobby` | Example screen |
| `http://localhost:3000/api/v1/clients/demo-client/status` | Health check |
| `http://localhost:6001` | Soketi dashboard |
| `http://localhost:9001` | MinIO console |

### 32.4 Simulate Pairing

```bash
# Step 1 — TV requests a code
curl -X POST http://localhost:3000/api/v1/pair/request \
  -H "Content-Type: application/json" \
  -d '{ "fingerprint": "tv-device-abc123" }'
# → { "code": "482916" }

# Step 2 — Admin enters code (in real flow, done via UI)
curl -X POST http://localhost:3000/api/v1/clients/demo-client/screens/pair \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {admin-token}" \
  -d '{ "code": "482916", "name": "Lobby Screen" }'
# → { "screen": { "id": "...", "token": "tok_lobby_xxx" } }
```

### 32.5 Test AI Deck Generation

```bash
curl -X POST http://localhost:3000/api/v1/clients/demo-client/deck/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tok_xxx" \
  -d '{
    "prompt": "Create a 5-slide deck about preventive healthcare tips",
    "slideCount": 5,
    "theme": "warm-minimal"
  }'
```

---

*Last updated: March 2026 · Display Platform v1 · VPS deployment · All features planned — nothing built*
