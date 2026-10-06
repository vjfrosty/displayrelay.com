# Display Relay — Program Overview

What this project *is*, distilled from [Display Relay_Project Setup & Architecture.md](Display%20Relay_Project%20Setup%20%26%20Architecture.md) (the 1,957-line master spec). This file is descriptive only — it does not track status (see [PROGRESS.md](PROGRESS.md)) or next steps (see [PLANS.md](PLANS.md)).

## What It Is

Display Relay is a **self-hosted, multi-tenant smart TV display platform**
(digital signage). Tenants manage screens, media, playlists, schedules, and
slide templates through an admin dashboard. TVs pair via a 6-digit code and
receive content over HTTPS from a single VPS.

**Core design principle:** everything that controls behavior — AI prompts,
feature flags, UI copy, generation defaults, vertical field maps, plan limits
— lives in the database and is editable at runtime, with no redeploy. This is
enforced by the golden rules in [AGENTS.md](AGENTS.md).

## Information Architecture

```
/admin
├── /welcome              Onboarding + quick actions
├── /screens              Screen list, pairing, status
├── /media                Media library — folders, upload, search
├── /playlists            Playlist list + editor
├── /schedules            Schedule builder — calendar grid, zone picker
├── /editor               Slide editor — canvas, layers, components
├── /templates            Template repository — shared + my templates
├── /apps                 Web links, Dashboards, Live Streaming
├── /stream-urls          Stream URL management
├── /video-wall           Video wall layout builder (future)
└── /settings
    ├── /billing          Plan, usage, Stripe portal
    ├── /prompts          AI prompt management (all stored in DB)
    ├── /integrations     API keys, webhook endpoints
    ├── /branding         Logo, colors, font
    └── /general          Tenant name, city, vertical, timezone
```

Screen statuses: **Online** (green), **Offline** (red), **Sleeping** (blue,
off-hours power-save), **Ready to Play** (yellow, paired but no content).

## Feature Roadmap (by priority)

🔴 P1 = must-have for launch · 🟡 P2 = fast-follow · 🔵 P4 = future

| Area | P1 | P2 / later |
|---|---|---|
| **Screens** | List + status badges, 6-digit pairing + QR, detail (name/tags/location/type) | Filters, operation hours, remote reboot via SSE, orientation flag, video wall (🔵) |
| **Media** | Upload to MinIO (image/video/PDF), folders, search, sort | Grid/list toggle, bulk select/delete |
| **Playlists** | Mixed content (Media + App + Template), Published/Draft, screen assignment | — |
| **Schedules** | Weekly calendar grid, zone picker, time-of-day windows | Weather-triggered rules, AI recommendations |
| **Slide Editor** | Canvas drag/resize/layer, text/image/shape/logo blocks, layout presets, TV-ratio preview, save as personal template | Undo/redo, layer panel, animations, AI-generate-into-editor, save as shared template, HTML/PNG export |
| **Templates** | Shared library, "My Templates", browse/search, fork | Version history, ratings/favourites, publish-to-shared, Smooth Setup wizard, AI thumbnails |
| **Settings** | Prompt CRUD, tenant overrides, app/tenant settings | Per-generation model selector, temperature/token tuning, feature-flag overrides |
| **AI & Integrations** | — | OpenRouter generation (slide/deck/announcement), image ranking, schedule suggestions, Google Calendar, Google Reviews, OpenWeatherMap, n8n, AI content library (200+ items) |

## Pricing Tiers

| | Essential | Professional | Premium | Enterprise |
|---|---|---|---|---|
| Price | €5/mo | €15/mo | €30/mo | Custom |
| Screens | 2 | 5 | Unlimited | Unlimited |
| Media storage | 500 MB | 5 GB | 25 GB | Custom |
| Playlists / Schedules | 5 / 2 | 25 / 10 | Unlimited | Unlimited |
| AI slide / deck / announcement gens per mo | 10 / 2 / 5 | 100 / 20 / 50 | 500 / 100 / 200 | Unlimited |
| Image searches per mo | 20 | 200 | 1,000 | Unlimited |
| Google Reviews, Weather rules | ❌ | ✅ | ✅ | ✅ |
| Google Calendar | ❌ | ❌ | ✅ | ✅ |
| Video wall | ❌ | ❌ | ❌ | ✅ |

Enforcement lives in `lib/usage.ts` (`checkAndIncrement`, `checkFeature`),
backed by `Plan`, `Subscription`, `UsageRecord`, `GenerationLog` — see
[SETTINGS.md](SETTINGS.md) for the settings/config side of the same DB-driven
philosophy.

## Tech Stack

| Layer | Choice | Pinned version |
|---|---|---|
| Framework | Next.js (App Router), React, TypeScript | 16.2.4 / 19.2.5 / 6.0.3 |
| Package manager | pnpm | 10.33.2 |
| Runtime | Node.js | 24.15.0 LTS |
| ORM / DB | Prisma / PostgreSQL | 7.8.0 / 17.9 |
| Cache | Redis | 7.4.8 |
| Real-time | Soketi (Pusher-protocol, self-hosted) | 1.6.1 |
| Object storage | MinIO | RELEASE.2025-09-07 |
| Reverse proxy | Nginx | 1.30.0 |
| Auth | NextAuth.js | 4.24.14 |
| AI | OpenRouter (model-agnostic, model comes from DB prompt record) | — |
| Image search | Pexels (default), Pixabay, Openverse | — |
| Billing | Stripe | — |
| Deployment | Docker Compose on a single VPS | — |

## Multi-Tenancy & Data Model

36 Prisma models cover tenancy (`Client`, `ClientBranding`), auth
(`AdminUser` — added in Task 1.5, `clientId` nullable for platform
super-admins), billing (`Plan`, `Subscription`, `UsageRecord`,
`GenerationLog`), settings (`AppSetting`, `TenantSetting`, `PromptTemplate`,
`TenantPromptOverride`, `FeatureFlagOverride`, `VerticalConfig`),
screens/media (`Screen`, `MediaFolder`, `MediaAsset`), content (`Playlist`,
`PlaylistItem`, `Schedule`, `ScheduleSlot`, `Template`, `TemplateVersion`,
`Deck`, `Slide`), and integrations (`AppIntegration`, `Availability`,
`ScheduleEntry`, `ResourceCalendar`, `WebhookEvent`, `WorkflowRule`,
`ApiToken`, `ImageCache`).
Full schema: [prisma/schema.prisma](prisma/schema.prisma).

Every tenant-scoped query must go through `scopedPrisma(clientId)` — see the
multi-tenancy rule in [AGENTS.md](AGENTS.md) and
[.github/instructions/multi-tenancy.instructions.md](.github/instructions/multi-tenancy.instructions.md).
