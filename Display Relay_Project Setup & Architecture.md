# Display Relay — Project Setup & Architecture

> Self-hosted smart TV display platform. Screens are full-page web apps served
> directly to TV browsers, backed by a multi-tenant Next.js REST API with
> Server-Sent Events for real-time updates, an AI-powered slide generation
> engine, a canvas-based slide editor, and a smart template repository.
> **All configuration, prompts, and settings are stored in the database.**
> Fully self-hosted on a VPS. Nothing is built yet — this is the full specification.

---

## Table of Contents

- [Display Relay — Project Setup \& Architecture](#display-relay--project-setup--architecture)
  - [Table of Contents](#table-of-contents)
  - [1. Overview](#1-overview)
  - [2. Navigation \& Information Architecture](#2-navigation--information-architecture)
    - [2.1 Screen Status Model](#21-screen-status-model)
  - [3. Full Feature Roadmap](#3-full-feature-roadmap)
    - [3.1 Screen Management](#31-screen-management)
    - [3.2 Media Library](#32-media-library)
    - [3.3 Playlists](#33-playlists)
    - [3.4 Schedules](#34-schedules)
    - [3.5 Slide Editor](#35-slide-editor)
    - [3.6 Template Repository](#36-template-repository)
    - [3.7 Settings (all DB-driven)](#37-settings-all-db-driven)
    - [3.8 AI \& Integrations](#38-ai--integrations)
  - [4. Pricing Tiers \& Usage Limits](#4-pricing-tiers--usage-limits)
    - [4.1 Plans](#41-plans)
    - [4.2 Usage Tracking Schema](#42-usage-tracking-schema)
    - [4.3 `lib/usage.ts`](#43-libusagets)
    - [4.4 UI Enforcement](#44-ui-enforcement)
    - [4.5 Stripe Events Handled](#45-stripe-events-handled)
  - [5. Settings \& Configuration — Everything in the DB](#5-settings--configuration--everything-in-the-db)
    - [5.1 Schema](#51-schema)
    - [5.2 Default App Settings (seeded)](#52-default-app-settings-seeded)
    - [5.3 Default Prompt Templates (seeded)](#53-default-prompt-templates-seeded)
    - [5.4 `lib/settings.ts` — Runtime Config Resolution](#54-libsettingsts--runtime-config-resolution)
    - [5.5 `lib/prompts.ts` — Prompt Resolution](#55-libpromptsts--prompt-resolution)
    - [5.6 Settings UI (`/admin/settings`)](#56-settings-ui-adminsettings)
  - [6. Tech Stack](#6-tech-stack)
  - [7. Repository Structure](#7-repository-structure)
  - [8. Environment Variables](#8-environment-variables)
  - [9. Database Schema](#9-database-schema)
    - [9.1 Complete Table List](#91-complete-table-list)
    - [9.2 Template \& Editor Schema](#92-template--editor-schema)
    - [9.3 Editor State Type](#93-editor-state-type)
  - [14. Slide Editor](#14-slide-editor)
    - [14.1 Editor Layout](#141-editor-layout)
    - [14.2 Block Types](#142-block-types)
    - [14.3 Inline Image Search Panel](#143-inline-image-search-panel)
    - [14.4 AI Generate Panel](#144-ai-generate-panel)
    - [14.5 Layout Presets](#145-layout-presets)
    - [14.6 Save Flow](#146-save-flow)
    - [14.7 `lib/editor.ts`](#147-libeditorts)
  - [15. Template Repository](#15-template-repository)
    - [15.1 Architecture — Three Tiers](#151-architecture--three-tiers)
    - [15.2 Template Browser (`/admin/templates`)](#152-template-browser-admintemplates)
    - [15.3 Template Actions](#153-template-actions)
    - [15.4 Forking Flow](#154-forking-flow)
    - [15.5 Publishing Flow](#155-publishing-flow)
    - [15.6 Template API](#156-template-api)
    - [15.7 Smooth Setup Wizard](#157-smooth-setup-wizard)
  - [16. Apps, Stream URLs \& Dashboards](#16-apps-stream-urls--dashboards)
  - [17. API Routes](#17-api-routes)
  - [18. TV Screen Routes](#18-tv-screen-routes)
  - [19. Real-Time: Soketi SSE Gateway](#19-real-time-soketi-sse-gateway)
    - [Events](#events)
  - [20. Webhook Endpoints](#20-webhook-endpoints)
  - [21. Multi-Tenancy \& Auth](#21-multi-tenancy--auth)
  - [22. Vertical Packages \& Configuration](#22-vertical-packages--configuration)
  - [23. Branding \& Theming](#23-branding--theming)
  - [24. Screen Polling Strategy](#24-screen-polling-strategy)
  - [25. Slide Generation Engine](#25-slide-generation-engine)
  - [26. Image Provider System](#26-image-provider-system)
  - [27. AI Content Generation — OpenRouter](#27-ai-content-generation--openrouter)
  - [28. Google Calendar — Availability Sync](#28-google-calendar--availability-sync)
  - [29. Google Reviews — Social Trust Widget](#29-google-reviews--social-trust-widget)
  - [30. Weather-Triggered Content — OpenWeatherMap](#30-weather-triggered-content--openweathermap)
  - [31. n8n Workflow Automation Hub](#31-n8n-workflow-automation-hub)
  - [32. AI Content Library](#32-ai-content-library)
  - [33. VPS Deployment (Self-Hosted)](#33-vps-deployment-self-hosted)
    - [33.1 Architecture](#331-architecture)
    - [33.2 Docker Compose](#332-docker-compose)
    - [33.3 Nginx](#333-nginx)
    - [33.4 TV Kiosk](#334-tv-kiosk)
  - [34. Prioritized Build Roadmap](#34-prioritized-build-roadmap)
    - [🔴 Phase 1 — Core Platform (Weeks 1–4)](#-phase-1--core-platform-weeks-14)
    - [🔴 Phase 2 — Editor + Templates (Weeks 5–8)](#-phase-2--editor--templates-weeks-58)
    - [🔴 Phase 3 — Playlists + Schedules (Weeks 9–10)](#-phase-3--playlists--schedules-weeks-910)
    - [🟡 Phase 4 — AI + Image Search (Weeks 11–13)](#-phase-4--ai--image-search-weeks-1113)
    - [🟡 Phase 5 — Integrations + Automation (Weeks 14–18)](#-phase-5--integrations--automation-weeks-1418)
    - [🔵 Phase 6 — Polish + Expansion (Month 5+)](#-phase-6--polish--expansion-month-5)
  - [35. Local Development](#35-local-development)
    - [35.1 Start Services](#351-start-services)
    - [35.2 Bootstrap](#352-bootstrap)
    - [35.3 Useful URLs](#353-useful-urls)
    - [35.4 Test AI Generation (uses DB prompt)](#354-test-ai-generation-uses-db-prompt)

---

## 1. Overview

The Display Platform is a fully self-hosted smart TV display system. Each
tenant manages screens, media, playlists, schedules, and slide templates
through an admin dashboard. TV screens are paired using a 6-digit code,
then served content over HTTPS from a VPS.

**Core design principle:** everything that controls behaviour — AI prompts,
feature flags, UI copy, generation defaults, vertical field maps, plan limits
— lives in the database and is editable at runtime. No restarts required to
change platform behaviour.

All components run on a VPS behind Nginx. Media assets are stored on MinIO.

---

## 2. Navigation & Information Architecture

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

### 2.1 Screen Status Model

| Status | Colour | Meaning |
|---|---|---|
| Online | Green | Connected and actively playing |
| Offline | Red | Not reachable |
| Sleeping | Blue | Connected but in off-hours power-save |
| Ready to Play | Yellow | Paired, awaiting content assignment |

---

## 3. Full Feature Roadmap

### 3.1 Screen Management

| Feature | Priority |
|---|---|
| Screen list with status badges | 🔴 P1 |
| 6-digit pairing code + QR on `/pair` | 🔴 P1 |
| Screen detail: name, tags, location, space, type | 🔴 P1 |
| Filter by status / tags / locations / spaces | 🟡 P2 |
| Operation hours per screen | 🟡 P2 |
| Remote reboot / refresh via SSE | 🟡 P2 |
| Portrait / landscape orientation flag | 🟡 P2 |
| Video wall builder | 🔵 P4 |

### 3.2 Media Library

| Feature | Priority |
|---|---|
| Upload (image, video, PDF) to MinIO | 🔴 P1 |
| Folder organisation, search, sort | 🔴 P1 |
| Grid and list view | 🟡 P2 |
| Bulk select / delete | 🟡 P2 |

### 3.3 Playlists

| Feature | Priority |
|---|---|
| Mixed content types (Media + App + Template) | 🔴 P1 |
| Published / Draft status | 🔴 P1 |
| Assign to screen | 🔴 P1 |

### 3.4 Schedules

| Feature | Priority |
|---|---|
| Visual weekly calendar grid | 🔴 P1 |
| Zone layout picker (Main / split) | 🔴 P1 |
| Time-of-day content windows | 🔴 P1 |
| Weather-triggered rules | 🟡 P2 |
| AI schedule recommendations | 🟡 P2 |

### 3.5 Slide Editor

| Feature | Priority |
|---|---|
| Canvas-based editor (drag, resize, layer) | 🔴 P1 |
| Text blocks (rich text, font, size, color) | 🔴 P1 |
| Image blocks (upload or Pexels search inline) | 🔴 P1 |
| Shape / background blocks | 🔴 P1 |
| Logo / branding block (auto from client theme) | 🔴 P1 |
| Layout presets (hero, two-column, quote, grid) | 🔴 P1 |
| Undo / redo | 🟡 P2 |
| Layer panel (z-index management) | 🟡 P2 |
| Animation / transition per block | 🟡 P2 |
| Preview in TV aspect ratio | 🔴 P1 |
| Save as personal template | 🔴 P1 |
| Save as shared template (admin only) | 🟡 P2 |
| AI generate content into editor | 🟡 P2 |
| Export as HTML / PNG | 🟡 P2 |

### 3.6 Template Repository

| Feature | Priority |
|---|---|
| Shared global library (seeded + AI-generated) | 🔴 P1 |
| Per-client "My Templates" | 🔴 P1 |
| Browse by orientation / category / vertical | 🔴 P1 |
| Full-text + tag search | 🔴 P1 |
| Fork a shared template to My Templates | 🔴 P1 |
| Version history per template | 🟡 P2 |
| Template rating / favourite | 🟡 P2 |
| Publish my template to shared library | 🟡 P2 |
| Smooth Setup wizard (pick 4 → instant playlist) | 🟡 P2 |
| AI-generated thumbnails | 🟡 P2 |

### 3.7 Settings (all DB-driven)

| Feature | Priority |
|---|---|
| AI prompt management UI (CRUD for all prompt types) | 🔴 P1 |
| Per-tenant prompt overrides | 🔴 P1 |
| App settings (global platform config) | 🔴 P1 |
| Tenant settings (per-client overrides) | 🔴 P1 |
| AI model selector per generation type | 🟡 P2 |
| Generation parameter tuning (temperature, max tokens) | 🟡 P2 |
| Feature flag overrides (admin-granted) | 🟡 P2 |

### 3.8 AI & Integrations

| Feature | Priority |
|---|---|
| OpenRouter AI (model-agnostic) | 🟡 P2 |
| Slide + announcement + deck generation | 🟡 P2 |
| AI image candidate ranking | 🟡 P2 |
| AI schedule recommendations | 🟡 P2 |
| Google Calendar sync | 🟡 P2 |
| Google Reviews widget | 🟡 P2 |
| OpenWeatherMap weather rules | 🟡 P2 |
| n8n workflow rule engine | 🟡 P2 |
| AI content library (200+ items) | 🟡 P2 |

---

## 4. Pricing Tiers & Usage Limits

### 4.1 Plans

| Feature | Essential  | Professional  | Premium | Enterprise |
|---|---|---|---|---|
| **Price** | €5 / mo | €15 / mo | €30 / mo | Custom |
| Screens | 2 | 5 | Unlimited | Unlimited |
| Media storage | 500 MB | 5 GB | 25 GB | Custom |
| Playlists | 5 | 25 | Unlimited | Unlimited |
| Schedules | 2 | 10 | Unlimited | Unlimited |
| **AI slide generations** | 10 / mo | 100 / mo | 500 / mo | Unlimited |
| **AI deck generations** | 2 / mo | 20 / mo | 100 / mo | Unlimited |
| **AI announcement generations** | 5 / mo | 50 / mo | 200 / mo | Unlimited |
| **AI schedule suggestions** | 1 / mo | 10 / mo | 50 / mo | Unlimited |
| **Image searches** | 20 / mo | 200 / mo | 1,000 / mo | Unlimited |
| **My Templates saves** | 3 | 20 | Unlimited | Unlimited |
| **Shared template publishes** | ❌ | ❌ | 10 / mo | Unlimited |
| **AI content library items** | 10 / mo | 100 / mo | Unlimited | Unlimited |
| Webhooks | 1 | 5 | Unlimited | Unlimited |
| Workflow rules | 0 | 3 | 25 | Unlimited |
| Zone layouts | Main only | All | All | All |
| Google Reviews | ❌ | ✅ | ✅ | ✅ |
| Weather rules | ❌ | ✅ | ✅ | ✅ |
| Google Calendar | ❌ | ❌ | ✅ | ✅ |
| Video wall | ❌ | ❌ | ❌ | ✅ |

### 4.2 Usage Tracking Schema

```prisma
model Plan {
  id           String  @id @default(uuid())
  slug         String  @unique
  name         String
  priceMonthly Int     // cents
  limits       Json    // { ai_slides: 10, ai_decks: 2, ... }
  features     Json    // { google_reviews: false, weather_rules: false, ... }
  isActive     Boolean @default(true)
}

model Subscription {
  id                 String   @id @default(uuid())
  clientId           String   @unique
  planSlug           String   @default("free")
  status             String   @default("active")
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd  Boolean  @default(false)
  stripeCustomerId   String?
  stripeSubId        String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

model UsageRecord {
  id        String   @id @default(uuid())
  clientId  String
  metric    String
  period    String   // "2026-03"
  count     Int      @default(0)
  updatedAt DateTime @updatedAt
  @@unique([clientId, metric, period])
}

model GenerationLog {
  id           String   @id @default(uuid())
  clientId     String
  metric       String
  aiModel      String?
  promptSlug   String?  // which prompt template was used
  promptTokens Int?
  outputTokens Int?
  durationMs   Int?
  success      Boolean  @default(true)
  error        String?
  createdAt    DateTime @default(now())
}
```

### 4.3 `lib/usage.ts`

```typescript
export async function checkAndIncrement(clientId: string, metric: UsageLimitKey) {
  const period = currentPeriod();
  const plan   = await getClientPlan(clientId); // Redis-cached 5 min
  const limit  = plan.limits[metric] as number;
  if (limit === -1) { await increment(clientId, metric, period); return { allowed: true }; }
  const current = await getCount(clientId, metric, period);
  if (current >= limit) return { allowed: false, current, limit, upgradeUrl: BILLING_URL };
  await increment(clientId, metric, period);
  return { allowed: true, current: current + 1, limit };
}

export async function checkFeature(clientId: string, feature: string): Promise<boolean> {
  const plan = await getClientPlan(clientId);
  return plan.features[feature] === true;
}
```

### 4.4 UI Enforcement

| Threshold | Behaviour |
|---|---|
| ≥ 80% of AI limit | Yellow warning banner in editor / template browser |
| 100% reached | Generate button disabled + upgrade tooltip |
| Feature not in plan | Grayed out + lock icon + "Available on Starter+" |
| Storage > 90% | Warning in media library header |
| Screens at limit | Add screen button disabled + upgrade prompt |

### 4.5 Stripe Events Handled

| Event | Action |
|---|---|
| `checkout.session.completed` | Create/update `Subscription` |
| `invoice.payment_succeeded` | Advance period (counters auto-reset via YYYY-MM key) |
| `invoice.payment_failed` | Set `status: past_due`, send warning |
| `customer.subscription.deleted` | Downgrade to Free |
| `customer.subscription.updated` | Update `planSlug` immediately |

---

## 5. Settings & Configuration — Everything in the DB

**Core principle:** no platform behaviour should require a code change or
deployment to modify. Prompts, AI parameters, feature flags, UI copy,
vertical mappings, default values, and integration settings all live in
the database. Admins edit them through `/admin/settings`.

### 5.1 Schema

```prisma
// Global platform settings — one row per key, super-admin only
model AppSetting {
  id          String   @id @default(uuid())
  key         String   @unique   // e.g. "platform.name", "ai.default_model"
  value       Json                // string | number | boolean | object
  type        String              // "string"|"number"|"boolean"|"json"|"secret"
  label       String              // human-readable label for settings UI
  description String?
  category    String              // "ai"|"platform"|"media"|"billing"|"features"
  isSecret    Boolean @default(false)  // masked in UI, never returned in API
  updatedAt   DateTime @updatedAt
  updatedBy   String?
}

// Per-tenant settings — overrides AppSetting defaults
model TenantSetting {
  id        String   @id @default(uuid())
  clientId  String
  key       String   // must match an AppSetting.key that allows tenant override
  value     Json
  updatedAt DateTime @updatedAt
  @@unique([clientId, key])
}

// AI prompt templates — all prompts stored here, none hardcoded
model PromptTemplate {
  id            String   @id @default(uuid())
  slug          String   @unique   // "slide.generate" | "deck.generate" | "announcement.generate" | "image.rank" | "schedule.suggest" | "tone.dental" | ...
  name          String
  description   String?
  category      String              // "generation"|"ranking"|"analysis"|"system"
  systemPrompt  String              // the system prompt text
  userPromptTemplate String         // handlebars-style template with {{variables}}
  variables     Json                // { "vertical": "string", "clientName": "string", ... }
  defaultModel  String              // "anthropic/claude-3.5-sonnet"
  temperature   Float   @default(0.7)
  maxTokens     Int     @default(1000)
  responseFormat String @default("json")  // "json"|"text"
  isActive      Boolean @default(true)
  version       Int     @default(1)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// Per-tenant prompt overrides — tenant can customise their own prompts
model TenantPromptOverride {
  id             String   @id @default(uuid())
  clientId       String
  promptSlug     String   // FK to PromptTemplate.slug
  systemPrompt   String?  // null = use default
  userPromptTemplate String?
  temperature    Float?
  maxTokens      Int?
  defaultModel   String?  // tenant can choose a different OpenRouter model
  isActive       Boolean  @default(true)
  updatedAt      DateTime @updatedAt
  @@unique([clientId, promptSlug])
}

// Feature flag overrides — admin can grant features outside of plan
model FeatureFlagOverride {
  id        String   @id @default(uuid())
  clientId  String
  feature   String
  enabled   Boolean  @default(true)
  reason    String?  // audit note
  expiresAt DateTime?
  createdAt DateTime @default(now())
  @@unique([clientId, feature])
}

// Vertical configuration — all vertical-specific settings in DB
model VerticalConfig {
  id            String @id @default(uuid())
  vertical      String @unique  // "dental-clinic"|"cloud-hosting"|"retail"
  label         String
  config        Json   // full vertical config object (field maps, defaults, etc.)
  promptContext String // injected into AI prompts for this vertical
  updatedAt     DateTime @updatedAt
}
```

### 5.2 Default App Settings (seeded)

```typescript
// prisma/seed.ts — app settings
const appSettings = [
  // Platform
  { key: "platform.name",               value: "Display Platform", type: "string",  category: "platform", label: "Platform name" },
  { key: "platform.support_email",      value: "",                 type: "string",  category: "platform", label: "Support email" },

  // AI
  { key: "ai.default_model",            value: "anthropic/claude-3.5-sonnet", type: "string", category: "ai", label: "Default AI model" },
  { key: "ai.fallback_model",           value: "openai/gpt-4o-mini",          type: "string", category: "ai", label: "Fallback AI model" },
  { key: "ai.image_provider",           value: "pexels",                      type: "string", category: "ai", label: "Default image provider" },
  { key: "ai.enable_image_ranking",     value: true,                          type: "boolean",category: "ai", label: "Use LLM to rank image candidates" },
  { key: "ai.max_candidates_per_slide", value: 5,                             type: "number", category: "ai", label: "Max image candidates sent to LLM" },

  // Media
  { key: "media.max_upload_mb",         value: 200,   type: "number",  category: "media",   label: "Max upload size (MB)" },
  { key: "media.allowed_mime_types",    value: ["image/jpeg","image/png","image/webp","image/gif","image/svg+xml","video/mp4","video/webm","application/pdf"], type: "json", category: "media", label: "Allowed MIME types" },

  // Features
  { key: "features.public_template_library", value: true,  type: "boolean", category: "features", label: "Enable shared template library" },
  { key: "features.template_publishing",     value: true,  type: "boolean", category: "features", label: "Allow Pro+ tenants to publish templates" },
  { key: "features.smooth_setup_wizard",     value: true,  type: "boolean", category: "features", label: "Enable Smooth Setup wizard" },

  // Billing
  { key: "billing.stripe_enabled",      value: true,  type: "boolean", category: "billing", label: "Enable Stripe payments", isSecret: false },
  { key: "billing.trial_days",          value: 14,    type: "number",  category: "billing", label: "Free trial duration (days)" },
];
```

### 5.3 Default Prompt Templates (seeded)

All prompts are seeded into `PromptTemplate`. The AI layer resolves the
active prompt at runtime: it checks `TenantPromptOverride` first, then falls
back to the global `PromptTemplate`. No prompt string exists in source code.

```typescript
const promptTemplates = [
  {
    slug: "slide.generate",
    name: "Single Slide Generation",
    category: "generation",
    systemPrompt: `You are a professional digital signage content writer for {{clientName}}, a {{vertical}} business.
Write concise, engaging content suited for a TV display. Tone: {{tone}}.
Brand voice: {{brandVoice}}.
Always respond with valid JSON only.`,
    userPromptTemplate: `Create a single display slide for: "{{prompt}}"
Screen type: {{screenType}}. Season: {{season}}. Orientation: {{orientation}}.
Return JSON: { "icon": "emoji", "tag": "short tag", "title": "max 8 words", "body": "max 25 words", "suggestedLayout": "hero|two-column|quote", "tags": [] }`,
    variables: { clientName:"string", vertical:"string", tone:"string", brandVoice:"string", prompt:"string", screenType:"string", season:"string", orientation:"string" },
    defaultModel: "anthropic/claude-3.5-sonnet",
    temperature: 0.75,
    maxTokens: 500,
  },
  {
    slug: "deck.generate",
    name: "Full Deck Generation",
    category: "generation",
    systemPrompt: `You are a professional presentation designer for {{clientName}}, a {{vertical}} business.
Create structured, visually-oriented slide decks for TV display.
Always respond with valid JSON only. Never include markdown.`,
    userPromptTemplate: `Create a {{slideCount}}-slide deck about: "{{prompt}}"
Theme: {{theme}}. Vertical context: {{vertical}}.
Each slide must include an imageIntent with a specific Pexels search query.
Return JSON: { "title": "", "theme": "", "slides": [{ "title":"", "layout":"hero|two-column|image-left|image-right|quote|grid", "bodyHtml":"", "imageIntent": { "query":"", "orientation":"landscape", "visualStyle":"" } }] }`,
    variables: { clientName:"string", vertical:"string", prompt:"string", slideCount:"number", theme:"string" },
    defaultModel: "anthropic/claude-3.5-sonnet",
    temperature: 0.7,
    maxTokens: 2000,
  },
  {
    slug: "announcement.generate",
    name: "Announcement Generation",
    category: "generation",
    systemPrompt: `You are a communications assistant for {{clientName}}, a {{vertical}} business.
Write clear, friendly announcements for digital display screens. Keep it brief and actionable.
Always respond with valid JSON only.`,
    userPromptTemplate: `Write a display announcement for: "{{brief}}"
Return JSON: { "icon":"emoji", "title":"max 6 words", "body":"max 20 words", "urgency":"low|medium|high", "suggestedStartDate":"YYYY-MM-DD or null", "suggestedEndDate":"YYYY-MM-DD or null" }`,
    variables: { clientName:"string", vertical:"string", brief:"string" },
    defaultModel: "anthropic/claude-3.5-sonnet",
    temperature: 0.6,
    maxTokens: 300,
  },
  {
    slug: "image.rank",
    name: "Image Candidate Ranking",
    category: "ranking",
    systemPrompt: `You are an art director selecting the best stock photo for a digital signage slide.
Evaluate based on: visual relevance to the slide content, professional quality, composition suitability for TV display, and brand appropriateness for a {{vertical}} business.
Always respond with valid JSON only.`,
    userPromptTemplate: `Slide title: "{{slideTitle}}"
Slide body: "{{slideBody}}"
Image candidates (index 0-{{maxIndex}}):
{{candidateList}}
Select the best candidate. Return JSON: { "selected": <index>, "reason": "<one sentence>" }`,
    variables: { vertical:"string", slideTitle:"string", slideBody:"string", maxIndex:"number", candidateList:"string" },
    defaultModel: "anthropic/claude-3.5-sonnet",
    temperature: 0.2,
    maxTokens: 100,
  },
  {
    slug: "schedule.suggest",
    name: "AI Schedule Dayparting Suggestions",
    category: "analysis",
    systemPrompt: `You are a digital signage strategist for {{clientName}}, a {{vertical}} business.
Analyse appointment/activity patterns and recommend optimal content time windows.
Always respond with valid JSON only.`,
    userPromptTemplate: `Appointment pattern data (last 90 days, bucketed by day+hour):
{{patternData}}
Suggest content time windows for the waiting display screen.
Return JSON array: [{ "dayOfWeek": "mon|tue|...|all", "startHour": 9, "endHour": 12, "contentTypes": ["tip","promo"], "reason": "" }]`,
    variables: { clientName:"string", vertical:"string", patternData:"string" },
    defaultModel: "anthropic/claude-3.5-sonnet",
    temperature: 0.3,
    maxTokens: 800,
  },
  {
    slug: "template.generate.batch",
    name: "AI Content Library Batch Generation",
    category: "generation",
    systemPrompt: `You are a professional content creator specialising in {{vertical}} digital signage.
Generate diverse, high-quality display slide content. Be specific, practical, and engaging.
Always respond with valid JSON only — no markdown, no preamble.`,
    userPromptTemplate: `Generate {{count}} slides for category "{{category}}", targeting "{{targetScreen}}" screen in {{monthName}}.
Vertical: {{vertical}}.
Return JSON array: [{ "icon":"emoji", "tag":"", "title":"max 8 words", "body":"max 25 words" }]`,
    variables: { vertical:"string", count:"number", category:"string", targetScreen:"string", monthName:"string" },
    defaultModel: "anthropic/claude-3.5-sonnet",
    temperature: 0.85,
    maxTokens: 1500,
  },
];
```

### 5.4 `lib/settings.ts` — Runtime Config Resolution

```typescript
// lib/settings.ts

// Get a setting value — tenant override wins over global default
export async function getSetting(key: string, clientId?: string): Promise<any> {
  const cacheKey = clientId ? `setting:${clientId}:${key}` : `setting:global:${key}`;
  const cached   = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  if (clientId) {
    const override = await prisma.tenantSetting.findUnique({
      where: { clientId_key: { clientId, key } },
    });
    if (override) {
      await redis.setex(cacheKey, 300, JSON.stringify(override.value));
      return override.value;
    }
  }

  const global = await prisma.appSetting.findUnique({ where: { key } });
  const value  = global?.value ?? null;
  await redis.setex(cacheKey, 300, JSON.stringify(value));
  return value;
}

// Invalidate cache when a setting is saved
export async function setSetting(key: string, value: any, clientId?: string) {
  if (clientId) {
    await prisma.tenantSetting.upsert({
      where:  { clientId_key: { clientId, key } },
      create: { clientId, key, value },
      update: { value, updatedAt: new Date() },
    });
    await redis.del(`setting:${clientId}:${key}`);
  } else {
    await prisma.appSetting.update({ where: { key }, data: { value } });
    await redis.del(`setting:global:${key}`);
  }
}
```

### 5.5 `lib/prompts.ts` — Prompt Resolution

```typescript
// lib/prompts.ts

export async function resolvePrompt(slug: string, clientId?: string) {
  const cacheKey = clientId ? `prompt:${clientId}:${slug}` : `prompt:global:${slug}`;
  const cached   = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const base = await prisma.promptTemplate.findUnique({ where: { slug } });
  if (!base) throw new Error(`Prompt template not found: ${slug}`);

  let resolved = { ...base };

  if (clientId) {
    const override = await prisma.tenantPromptOverride.findUnique({
      where: { clientId_promptSlug: { clientId, promptSlug: slug } },
    });
    if (override) {
      resolved = {
        ...resolved,
        systemPrompt:       override.systemPrompt       ?? resolved.systemPrompt,
        userPromptTemplate: override.userPromptTemplate ?? resolved.userPromptTemplate,
        temperature:        override.temperature        ?? resolved.temperature,
        maxTokens:          override.maxTokens          ?? resolved.maxTokens,
        defaultModel:       override.defaultModel       ?? resolved.defaultModel,
      };
    }
  }

  await redis.setex(cacheKey, 300, JSON.stringify(resolved));
  return resolved;
}

// Render a prompt template with variables (handlebars-style)
export function renderPrompt(template: string, vars: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}
```

### 5.6 Settings UI (`/admin/settings`)

All settings sections below are fully editable in the admin UI.
Changes write to the DB and invalidate Redis cache immediately.

| Path | Section | Editable by |
|---|---|---|
| `/admin/settings/general` | Name, city, vertical, timezone, brand voice | Tenant admin |
| `/admin/settings/branding` | Logo, colors, font | Tenant admin |
| `/admin/settings/prompts` | View / edit all prompt templates, per-tenant overrides | Tenant admin |
| `/admin/settings/integrations` | API tokens, webhook URLs, Google credentials | Tenant admin |
| `/admin/settings/billing` | Plan, usage bars, generation log, Stripe portal | Tenant admin |
| `/admin/settings/features` | Feature flag overrides (view only for tenant) | Super admin |
| `/admin/settings/app` | Global platform settings, plan definitions | Super admin only |

---

## 6. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS custom properties |
| Slide Editor | Fabric.js (canvas) or custom React canvas |
| Database | PostgreSQL 15 |
| ORM | Prisma |
| Cache | Redis 7 |
| Real-time Gateway | Soketi (self-hosted Pusher-compatible) |
| AI Generation | OpenRouter (`openrouter.ai/api/v1`) |
| Image Provider v1 | Pexels REST API |
| Image Provider v2 | Pixabay REST API |
| Image Provider v3 | Openverse API |
| Google | Calendar API, Places API |
| Weather | OpenWeatherMap |
| Automation | Custom n8n-compatible rule engine |
| Auth (API) | Bearer token |
| Auth (Admin) | NextAuth.js |
| Asset Storage | MinIO (self-hosted S3-compatible) |
| Reverse Proxy | Nginx |
| Container | Docker + Docker Compose |
| Package manager | pnpm |

---

## 7. Repository Structure

```
display-platform/
├── app/
│   ├── api/v1/
│   │   ├── clients/[clientId]/
│   │   │   ├── screens/            route.ts + pair/route.ts
│   │   │   ├── media/              route.ts + folders/route.ts
│   │   │   ├── playlists/          route.ts + [id]/route.ts + [id]/items/route.ts
│   │   │   ├── schedules/          route.ts + [id]/route.ts + [id]/slots/route.ts
│   │   │   ├── templates/          route.ts + [id]/route.ts + [id]/fork/route.ts + [id]/publish/route.ts
│   │   │   ├── editor/
│   │   │   │   └── save/           route.ts   save editor state as template/slide
│   │   │   ├── slides/
│   │   │   │   ├── route.ts
│   │   │   │   └── generate/       route.ts
│   │   │   ├── announcements/      route.ts + generate/route.ts
│   │   │   ├── deck/generate/      route.ts
│   │   │   ├── image/search/       route.ts
│   │   │   ├── kpi/                route.ts
│   │   │   ├── availability/       route.ts
│   │   │   ├── schedule-data/      route.ts
│   │   │   ├── social-feed/        route.ts
│   │   │   ├── schedule/suggest/   route.ts
│   │   │   ├── events/             route.ts   SSE
│   │   │   ├── usage/              route.ts + log/route.ts
│   │   │   └── settings/           route.ts   tenant settings CRUD
│   │   ├── hooks/[clientId]/       data-updated/ alert/ calendar-sync/ ...
│   │   ├── billing/                checkout/ portal/ webhook/
│   │   ├── admin/
│   │   │   ├── settings/           route.ts   global app settings (super-admin)
│   │   │   ├── prompts/            route.ts   global prompt templates CRUD
│   │   │   └── plans/              route.ts   plan management
│   │   └── pair/request/           route.ts
│   │
│   ├── pair/                        page.tsx   TV pairing screen
│   ├── screens/[clientId]/[screenId]/ page.tsx
│   │
│   └── admin/
│       ├── page.tsx                 welcome
│       ├── screens/                 page.tsx
│       ├── media/                   page.tsx
│       ├── playlists/               page.tsx + [id]/page.tsx
│       ├── schedules/               page.tsx + [id]/page.tsx
│       ├── editor/                  page.tsx   slide editor
│       │   └── [templateId]/        page.tsx   edit existing template
│       ├── templates/               page.tsx   template repository
│       ├── apps/                    page.tsx
│       ├── stream-urls/             page.tsx
│       ├── video-wall/              page.tsx
│       └── settings/
│           ├── general/             page.tsx
│           ├── branding/            page.tsx
│           ├── prompts/             page.tsx
│           ├── integrations/        page.tsx
│           ├── billing/             page.tsx
│           ├── features/            page.tsx
│           └── app/                 page.tsx   super-admin only
│
├── components/
│   ├── editor/
│   │   ├── EditorCanvas.tsx         Main canvas area
│   │   ├── EditorToolbar.tsx        Top toolbar: undo/redo, zoom, export
│   │   ├── EditorSidebar.tsx        Left: block palette + layer panel
│   │   ├── EditorProperties.tsx     Right: selected block properties
│   │   ├── EditorPreview.tsx        TV-ratio preview modal
│   │   ├── blocks/
│   │   │   ├── TextBlock.tsx
│   │   │   ├── ImageBlock.tsx
│   │   │   ├── ShapeBlock.tsx
│   │   │   ├── LogoBlock.tsx        Auto-loads client branding
│   │   │   ├── QrBlock.tsx
│   │   │   └── VideoBlock.tsx
│   │   └── panels/
│   │       ├── LayerPanel.tsx
│   │       ├── ImageSearchPanel.tsx  Inline Pexels search
│   │       └── AiGeneratePanel.tsx   AI content into selected block
│   ├── templates/
│   │   ├── TemplateGrid.tsx
│   │   ├── TemplateCard.tsx
│   │   ├── TemplateBrowser.tsx      Full browser with filters
│   │   ├── TemplateFilters.tsx      Sidebar filters
│   │   └── SmoothSetupWizard.tsx
│   ├── screens/                     (as before)
│   ├── settings/
│   │   ├── PromptEditor.tsx         Edit prompt templates
│   │   ├── SettingsForm.tsx         Generic key-value settings form
│   │   ├── UsageDashboard.tsx
│   │   └── FeatureFlagPanel.tsx
│   └── ui/                          (as before)
│
├── lib/
│   ├── db.ts
│   ├── redis.ts
│   ├── soketi.ts
│   ├── auth.ts
│   ├── tenant.ts
│   ├── settings.ts           getSetting() / setSetting()
│   ├── prompts.ts            resolvePrompt() / renderPrompt()
│   ├── usage.ts              checkAndIncrement() / checkFeature()
│   ├── pairing.ts
│   ├── storage.ts
│   ├── ai.ts
│   ├── editor.ts             Editor state serialization helpers
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
│   └── seed.ts              seeds plans, app settings, prompt templates,
│                            vertical configs, template library
├── hooks/
│   ├── useEditorState.ts
│   ├── useSSE.ts
│   └── useScreenStatus.ts
│
├── types/
│   ├── screen.ts
│   ├── media.ts
│   ├── playlist.ts
│   ├── schedule.ts
│   ├── editor.ts
│   ├── template.ts
│   ├── deck.ts
│   ├── image.ts
│   ├── settings.ts
│   └── index.ts
│
├── docker/
├── tailwind.config.ts
├── next.config.ts
└── .env.local
```

---

## 8. Environment Variables

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
SUPER_ADMIN_EMAIL="admin@your-domain.com"

# ── AI — OpenRouter ───────────────────────────────────────────
# NOTE: model selection and prompts are stored in DB, not here.
# Only the API key is an env var.
OPENROUTER_API_KEY="sk-or-v1-..."

# ── Image Providers ───────────────────────────────────────────
PEXELS_API_KEY="your-pexels-key"
PIXABAY_API_KEY="your-pixabay-key"
OPENVERSE_API_KEY=""

# ── Google ────────────────────────────────────────────────────
GOOGLE_SERVICE_ACCOUNT_EMAIL="service@project.iam.gserviceaccount.com"
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_CALENDAR_WEBHOOK_SECRET="random-token"
GOOGLE_PLACES_API_KEY="AIza..."

# ── Weather ───────────────────────────────────────────────────
OPENWEATHERMAP_API_KEY="your-owm-key"

# ── MinIO ─────────────────────────────────────────────────────
MINIO_ENDPOINT="http://minio:9000"
MINIO_ACCESS_KEY="..."
MINIO_SECRET_KEY="..."
MINIO_BUCKET="display-platform-assets"
MINIO_PUBLIC_URL="https://your-domain.com/assets"

# ── App ───────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_PUBLIC_SOKETI_HOST="your-domain.com"
NEXT_PUBLIC_SOKETI_KEY="your-app-key"

# ── Stripe ────────────────────────────────────────────────────
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_STARTER_PRICE_ID="price_..."
STRIPE_PRO_PRICE_ID="price_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# ── Pairing ───────────────────────────────────────────────────
PAIRING_CODE_TTL_SECONDS=300
```

> **Note:** Only secrets (API keys, signing keys) live in `.env`.
> All model names, feature flags, prompt text, limits, and platform
> configuration are stored in the database and editable at runtime.

---

## 9. Database Schema

### 9.1 Complete Table List

| Table | Domain |
|---|---|
| `clients` | Tenancy |
| `client_branding` | Tenancy |
| `screens` | Tenancy |
| `subscriptions` | Billing |
| `plans` | Billing |
| `usage_records` | Billing |
| `generation_logs` | Billing |
| `app_settings` | Config |
| `tenant_settings` | Config |
| `prompt_templates` | Config |
| `tenant_prompt_overrides` | Config |
| `feature_flag_overrides` | Config |
| `vertical_configs` | Config |
| `media_assets` | Content |
| `media_folders` | Content |
| `playlists` | Content |
| `playlist_items` | Content |
| `schedules` | Content |
| `schedule_slots` | Content |
| `templates` | Content |
| `template_versions` | Content |
| `template_tags` | Content |
| `slides` | Content |
| `decks` | Content |
| `ai_content_library` | Content |
| `app_integrations` | Content |
| `availability` | Scheduling |
| `schedule_entries` | Scheduling |
| `resource_calendars` | Scheduling |
| `webhook_events` | Events |
| `workflow_rules` | Automation |
| `api_tokens` | Auth |
| `image_cache` | Cache |

### 9.2 Template & Editor Schema

```prisma
// Template — the core content unit for the editor and repository
model Template {
  id            String    @id @default(uuid())
  clientId      String?   // null = global shared library
  name          String
  description   String?
  category      String    // "healthcare"|"corporate"|"food"|"retail"|...
  mainGroup     String    @default("all")
  orientation   String    @default("horizontal")   // horizontal|vertical|both
  vertical      String?   // null = universal; "dental-clinic" = vertical-specific
  thumbnailUrl  String?
  editorState   Json      // full editor canvas state (blocks, layers, dimensions)
  htmlContent   String    // rendered HTML from editor state
  cssContent    String    @default("")
  isLibrary     Boolean   @default(false)  // true = visible in shared library
  isPublished   Boolean   @default(false)
  publishedAt   DateTime?
  publishedBy   String?   // clientId that published to shared library
  forkedFromId  String?   // if forked from another template
  currentVersion Int      @default(1)
  aiGenerated   Boolean   @default(false)
  rating        Float?    // average rating (library templates)
  useCount      Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  versions      TemplateVersion[]
  tags          TemplateTag[]
}

// Full version history for every template
model TemplateVersion {
  id           String   @id @default(uuid())
  templateId   String
  version      Int
  editorState  Json
  htmlContent  String
  cssContent   String   @default("")
  thumbnailUrl String?
  changeNote   String?
  createdBy    String?
  createdAt    DateTime @default(now())
  template     Template @relation(fields: [templateId], references: [id], onDelete: Cascade)
  @@unique([templateId, version])
}

// Tags for search and filtering
model TemplateTag {
  id         String   @id @default(uuid())
  templateId String
  tag        String
  template   Template @relation(fields: [templateId], references: [id], onDelete: Cascade)
  @@unique([templateId, tag])
  @@index([tag])
}

// Template rating by client
model TemplateRating {
  id         String   @id @default(uuid())
  templateId String
  clientId   String
  rating     Int      // 1-5
  createdAt  DateTime @default(now())
  @@unique([templateId, clientId])
}

// Template favourites
model TemplateFavourite {
  id         String   @id @default(uuid())
  templateId String
  clientId   String
  createdAt  DateTime @default(now())
  @@unique([templateId, clientId])
}
```

### 9.3 Editor State Type

The `editorState` JSON column stores the full canvas state:

```typescript
// types/editor.ts

type EditorState = {
  version:     number;          // schema version for migrations
  width:       number;          // canvas width in px (base: 1920)
  height:      number;          // canvas height in px (base: 1080)
  orientation: "landscape" | "portrait";
  background:  BackgroundConfig;
  blocks:      EditorBlock[];
  meta: {
    duration:  number;          // display duration in seconds
    transition: "none" | "fade" | "slide";
  };
};

type EditorBlock = {
  id:        string;
  type:      "text" | "image" | "shape" | "logo" | "qr" | "video";
  x:         number;   // left offset %
  y:         number;   // top offset %
  width:     number;   // % of canvas width
  height:    number;   // % of canvas height
  zIndex:    number;
  locked:    boolean;
  visible:   boolean;
  props:     TextBlockProps | ImageBlockProps | ShapeBlockProps | LogoBlockProps;
};

type TextBlockProps = {
  content:    string;   // plain text or simple HTML
  fontSize:   number;
  fontWeight: string;
  fontFamily: string;   // resolved from theme var or explicit
  color:      string;
  align:      "left" | "center" | "right";
  lineHeight: number;
};

type ImageBlockProps = {
  src:          string;   // MinIO URL or Pexels URL
  objectFit:   "cover" | "contain" | "fill";
  attribution?: string;   // rendered for Pexels/Pixabay images
  pexelsId?:   string;
  provider?:   "pexels" | "pixabay" | "openverse" | "upload";
};

type BackgroundConfig = {
  type:   "color" | "gradient" | "image";
  value:  string;   // hex | "linear-gradient(...)" | MinIO URL
};
```

---

## 14. Slide Editor

Located at `/admin/editor` (new slide) or `/admin/editor/:templateId` (edit
existing). The editor is a canvas-based drag-and-drop tool that serialises
to `EditorState` JSON (stored in `templates.editorState`) and renders to
HTML (stored in `templates.htmlContent`).

### 14.1 Editor Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [← Back]  [Template name]  [Undo] [Redo]  [Preview] [Save]│  ← Toolbar
├───────────┬─────────────────────────────────────┬───────────┤
│  BLOCKS   │                                     │ PROPERTIES│
│           │                                     │           │
│ □ Text    │         CANVAS (16:9)               │ (selected │
│ □ Image   │                                     │  block    │
│ □ Shape   │   ┌─────────────────────────────┐   │  props)   │
│ □ Logo    │   │                             │   │           │
│ □ QR Code │   │   drag blocks here          │   │ x: 10%    │
│ □ Video   │   │                             │   │ y: 20%    │
│           │   └─────────────────────────────┘   │ w: 80%    │
│ ──────── │                                     │ h: 30%    │
│  LAYERS   │                                     │ z: 2      │
│           │                                     │           │
│ 3 □ Text  │                                     │ [Font]    │
│ 2 □ Image │                                     │ [Color]   │
│ 1 □ Shape │                                     │ [Align]   │
└───────────┴─────────────────────────────────────┴───────────┘
│  [Duration: 8s]  [Transition: Fade]  [1920 × 1080]         │  ← Footer
└─────────────────────────────────────────────────────────────┘
```

### 14.2 Block Types

| Block | Description | Props |
|---|---|---|
| Text | Rich text with font/size/color/align | content, fontSize, color, fontFamily, align |
| Image | Upload or inline Pexels search | src, objectFit, attribution, provider |
| Shape | Rectangle/circle/line with fill/stroke | shape, fill, stroke, radius |
| Logo | Auto-loads client primary logo from branding | scale, position |
| QR Code | Generates QR from any URL | url, size, color |
| Video | Looping video from MinIO | src, loop, muted |

### 14.3 Inline Image Search Panel

When an Image block is selected, a side panel allows searching Pexels
(and later Pixabay) directly inside the editor. Selecting an image:
1. Checks and increments `image_searches` usage counter.
2. Sets the block `src` to the Pexels image URL.
3. Stores `pexelsId` and `provider` on the block for attribution rendering.
4. Attribution text is auto-added as a locked Text block at the bottom.

### 14.4 AI Generate Panel

When a Text block is selected, a panel allows entering a one-line prompt.
The AI `slide.generate` prompt template is resolved from the DB
(`resolvePrompt("slide.generate", clientId)`), rendered with the client's
vertical and brand voice, and the generated `title` + `body` are injected
into the selected text block.

Usage counter `ai_slides` is checked and incremented before the API call.

### 14.5 Layout Presets

Layout presets are stored in the DB as `Template` rows with
`clientId: null`, `isLibrary: false`, `category: "layout-preset"`.
Applying a preset resets the canvas to that `editorState`.

```
hero           — full-bleed image + centered headline
two-column     — left text, right image
image-left     — image left 40%, text right 60%
image-right    — text left 60%, image right 40%
quote          — large centered quote text with subtle background
grid           — 2×2 image grid with title
lower-third    — text overlay at bottom, image fills canvas
```

### 14.6 Save Flow

```
Editor Save
    ├── Render editorState → htmlContent (lib/editor.ts → renderEditorHtml())
    ├── Generate thumbnail (headless screenshot → MinIO)
    ├── Increment template version (TemplateVersion row)
    └── Save Template row (editorState, htmlContent, thumbnailUrl, currentVersion)
```

### 14.7 `lib/editor.ts`

```typescript
export function renderEditorHtml(state: EditorState): string {
  const blocks = [...state.blocks].sort((a, b) => a.zIndex - b.zIndex);
  return `
    <div class="slide-canvas" style="
      position:relative; width:100%; padding-top:56.25%;
      background:${renderBackground(state.background)};
      overflow:hidden; font-family:var(--font-family);
    ">
      ${blocks.filter(b => b.visible).map(renderBlock).join("\n")}
    </div>
  `;
}

function renderBlock(block: EditorBlock): string {
  const pos = `position:absolute; left:${block.x}%; top:${block.y}%;
               width:${block.width}%; height:${block.height}%;
               z-index:${block.zIndex};`;
  switch (block.type) {
    case "text":  return `<div style="${pos} ${textCss(block.props as TextBlockProps)}">${sanitizeHtml((block.props as TextBlockProps).content)}</div>`;
    case "image": return `<img style="${pos} object-fit:${(block.props as ImageBlockProps).objectFit};" src="${(block.props as ImageBlockProps).src}" alt="" />`;
    case "logo":  return `<img style="${pos}" src="{{LOGO_URL}}" alt="logo" />`;
    // ... other types
  }
}
```

---

## 15. Template Repository

### 15.1 Architecture — Three Tiers

```
Shared Global Library  (isLibrary: true, clientId: null)
    │  seeded by platform (AI-generated, curated)
    │  Pro+ clients can publish their templates here
    │  browseable by all tenants
    │
    ├── Fork → My Templates  (isLibrary: false, clientId: X, forkedFromId: Y)
    │              tenant's copy — fully editable
    │              version history maintained independently
    │
    └── Create from Scratch → My Templates
                   (isLibrary: false, clientId: X, forkedFromId: null)
                   blank canvas or layout preset as starting point
```

### 15.2 Template Browser (`/admin/templates`)

Two tabs, matching the reference UI:

**Template Library tab** — browses `isLibrary: true` templates.

**My Templates tab** — browses `clientId = {current}` templates.

**Filters (sidebar):**

```
Orientation
  ○ Both
  ○ Vertical
  ○ Horizontal

Main Group
  ○ All
  ○ Digital Menu Boards
  ○ Corporate
  ○ Healthcare
  ○ Retail
  ○ ...

Categories
  ○ All Templates
  ○ Coffee & Tea
  ○ Healthcare
  ○ Vintage
  ○ Food & Beverage
  ○ Corporate
  ○ Seasonal
  ○ ...

Vertical
  ○ Universal
  ○ Dental
  ○ Cloud / IT
  ○ Retail
```

**Sort:** Most Used · Newest · Rating · A–Z

### 15.3 Template Actions

| Action | Who | Result |
|---|---|---|
| **Use** | Any | Adds template as a `PlaylistItem` |
| **Edit** | Owner or forked copy | Opens `/admin/editor/:templateId` |
| **Fork** | Any (within plan limits) | Creates a copy in My Templates with `forkedFromId` set |
| **Publish** | Pro+ client | Sets `isLibrary: true`, `isPublished: true` — visible to all |
| **Unpublish** | Owner | Sets `isLibrary: false` — removed from shared library |
| **Version History** | Owner | Lists all `TemplateVersion` rows with revert button |
| **Delete** | Owner | Soft-delete — removed from views but version history kept |
| **Rate** | Any (library templates) | Creates `TemplateRating` row, updates `template.rating` avg |
| **Favourite** | Any | Creates `TemplateFavourite` row |

### 15.4 Forking Flow

```
Client B forks Template A (isLibrary: true)
    ├── New Template row: clientId=B, forkedFromId=A.id
    ├── editorState copied from A
    ├── htmlContent copied from A
    ├── thumbnailUrl copied from A
    ├── version reset to 1
    ├── TemplateVersion row created for v1
    └── A.useCount incremented
```

### 15.5 Publishing Flow

```
Client B publishes My Template X to Shared Library
    ├── checkFeature(clientId, "template_publishing") — Pro+ only
    ├── checkAndIncrement(clientId, "shared_template_publishes")
    ├── Template.isLibrary = true
    ├── Template.isPublished = true
    ├── Template.publishedAt = now()
    ├── Template.publishedBy = clientId
    └── Soketi broadcast: "template.published" (refreshes library cache)
```

### 15.6 Template API

```
GET    /api/v1/clients/:clientId/templates
       ?library=true|false
       &category=&orientation=&vertical=&search=
       &sort=newest|rating|uses
       &tags=healthcare,dental

GET    /api/v1/clients/:clientId/templates/:id
POST   /api/v1/clients/:clientId/templates          { name, category, editorState }
PATCH  /api/v1/clients/:clientId/templates/:id
DELETE /api/v1/clients/:clientId/templates/:id
POST   /api/v1/clients/:clientId/templates/:id/fork
POST   /api/v1/clients/:clientId/templates/:id/publish
POST   /api/v1/clients/:clientId/templates/:id/unpublish
GET    /api/v1/clients/:clientId/templates/:id/versions
POST   /api/v1/clients/:clientId/templates/:id/versions/:v/restore
POST   /api/v1/clients/:clientId/templates/:id/rate   { rating: 1-5 }
POST   /api/v1/clients/:clientId/templates/:id/favourite
DELETE /api/v1/clients/:clientId/templates/:id/favourite

# Save from editor
POST   /api/v1/clients/:clientId/editor/save
       { templateId?, name, editorState, changeNote? }
       → { template, version }
```

### 15.7 Smooth Setup Wizard

Multi-step modal when creating first schedule:

1. **Context step** — vertical auto-detected from `clients.vertical`; user
   picks primary category.
2. **Template step** — filtered grid shows 8 templates matching vertical +
   category. User selects 4.
3. **Zone step** — zone layout picker (Main vs split).
4. **Finish** — schedule + playlist auto-created from selections.

The wizard reads `app_settings` key `features.smooth_setup_wizard` before
showing the option.

---

## 16. Apps, Stream URLs & Dashboards

Located at `/admin/apps`. Three sections:

**Web Links** — embed any URL as a `PlaylistItem { itemType: "web_link" }`.
Rendered via sandboxed `<iframe>` in `<WebLinkSlide>`.

**Dashboards** — pre-configured iframes for Salesforce, Zendesk, GitHub,
Trello, and custom URLs. Stored as `AppIntegration { type: "dashboard" }`.

**Live Streaming** — `itemType: "stream_url"`. HTML5 `<video>` or embedded
player. P3 implementation.

---

## 17. API Routes

```
# Billing
POST   /api/v1/billing/checkout
POST   /api/v1/billing/portal
POST   /api/v1/billing/webhook

# Usage
GET    /api/v1/clients/:clientId/usage
GET    /api/v1/clients/:clientId/usage/log

# Settings (tenant)
GET    /api/v1/clients/:clientId/settings          all tenant settings
PATCH  /api/v1/clients/:clientId/settings/:key     update one key
GET    /api/v1/clients/:clientId/settings/prompts  all prompt overrides for tenant
PATCH  /api/v1/clients/:clientId/settings/prompts/:slug

# Settings (super-admin)
GET    /api/v1/admin/settings
PATCH  /api/v1/admin/settings/:key
GET    /api/v1/admin/prompts
POST   /api/v1/admin/prompts
PATCH  /api/v1/admin/prompts/:slug
DELETE /api/v1/admin/prompts/:slug
GET    /api/v1/admin/plans
PATCH  /api/v1/admin/plans/:slug

# Screens
GET    /api/v1/clients/:clientId/screens
POST   /api/v1/clients/:clientId/screens
GET    /api/v1/clients/:clientId/screens/:id
PATCH  /api/v1/clients/:clientId/screens/:id
DELETE /api/v1/clients/:clientId/screens/:id
POST   /api/v1/clients/:clientId/screens/pair

# Media
GET    /api/v1/clients/:clientId/media
POST   /api/v1/clients/:clientId/media
DELETE /api/v1/clients/:clientId/media/:id
GET    /api/v1/clients/:clientId/media/folders
POST   /api/v1/clients/:clientId/media/folders

# Playlists
GET|POST       /api/v1/clients/:clientId/playlists
GET|PATCH|DEL  /api/v1/clients/:clientId/playlists/:id
POST           /api/v1/clients/:clientId/playlists/:id/publish
POST           /api/v1/clients/:clientId/playlists/:id/items
PATCH|DEL      /api/v1/clients/:clientId/playlists/:id/items/:itemId
POST           /api/v1/clients/:clientId/playlists/:id/assign

# Schedules
GET|POST       /api/v1/clients/:clientId/schedules
GET|PATCH|DEL  /api/v1/clients/:clientId/schedules/:id
POST           /api/v1/clients/:clientId/schedules/:id/slots
PATCH|DEL      /api/v1/clients/:clientId/schedules/:id/slots/:slotId
POST           /api/v1/clients/:clientId/schedules/:id/assign

# Templates
GET    /api/v1/clients/:clientId/templates
POST   /api/v1/clients/:clientId/templates
GET|PATCH|DEL  /api/v1/clients/:clientId/templates/:id
POST   /api/v1/clients/:clientId/templates/:id/fork
POST   /api/v1/clients/:clientId/templates/:id/publish
POST   /api/v1/clients/:clientId/templates/:id/unpublish
GET    /api/v1/clients/:clientId/templates/:id/versions
POST   /api/v1/clients/:clientId/templates/:id/versions/:v/restore
POST   /api/v1/clients/:clientId/templates/:id/rate
POST|DEL /api/v1/clients/:clientId/templates/:id/favourite
POST   /api/v1/clients/:clientId/editor/save

# Apps
GET|POST  /api/v1/clients/:clientId/apps
DELETE    /api/v1/clients/:clientId/apps/:id

# AI Generation
POST   /api/v1/clients/:clientId/slides/generate
POST   /api/v1/clients/:clientId/announcements/generate
POST   /api/v1/clients/:clientId/deck/generate
POST   /api/v1/clients/:clientId/image/search
POST   /api/v1/clients/:clientId/schedule/suggest

# Screen data (TV)
GET    /api/v1/clients/:clientId/status
GET    /api/v1/clients/:clientId/schedule-data
GET    /api/v1/clients/:clientId/availability
GET    /api/v1/clients/:clientId/kpi
GET    /api/v1/clients/:clientId/social-feed
GET    /api/v1/clients/:clientId/events           SSE

# Webhooks
POST   /api/v1/hooks/:clientId/data-updated
POST   /api/v1/hooks/:clientId/alert
POST   /api/v1/hooks/:clientId/metric-updated
POST   /api/v1/hooks/:clientId/record-created
POST   /api/v1/hooks/:clientId/calendar-sync

# Pairing
POST   /api/v1/pair/request
```

---

## 18. TV Screen Routes

```
/pair                          Pairing screen (pre-auth)
/screens/:clientId/:screenId   Config-driven screen renderer
```

Screens resolve their assigned playlist/schedule, pick the zone layout
from `schedule.zoneLayout`, and begin the content loop.

---

## 19. Real-Time: Soketi SSE Gateway

```yaml
soketi:
  image: quay.io/soketi/soketi:latest
  environment:
    SOKETI_DEFAULT_APP_ID:     "display-platform"
    SOKETI_DEFAULT_APP_KEY:    "${SOKETI_APP_KEY}"
    SOKETI_DEFAULT_APP_SECRET: "${SOKETI_APP_SECRET}"
    SOKETI_REDIS_HOST:         "redis"
```

### Events

| Event | Payload | Triggered by |
|---|---|---|
| `playlist.updated` | `{ playlistId }` | Admin saves playlist |
| `schedule.updated` | `{ scheduleId }` | Admin saves schedule |
| `template.published` | `{ templateId }` | Pro+ client publishes template |
| `screen.command` | `{ command }` | Admin remote control |
| `availability.changed` | `{ resourceId, status }` | Calendar sync / webhook |
| `alert.raised` | `{ level, message }` | Alert webhook / rule |
| `heartbeat` | `{ ts }` | Every 30 s |

---

## 20. Webhook Endpoints

Idempotent pipeline: validate → idempotency check → upsert data →
run `workflow_rules` → broadcast to Soketi → mark processed.

---

## 21. Multi-Tenancy & Auth

All Prisma queries wrapped in `lib/tenant.ts` `scopedPrisma(clientId)`.
Admin sessions via NextAuth.js. Screen auth via per-screen bearer tokens.
Super-admin role checked via `SUPER_ADMIN_EMAIL` env var matched against
session user.

---

## 22. Vertical Packages & Configuration

Vertical configs are stored in `vertical_configs` table and loaded via
`getSetting()`. The `config` JSON field contains all field maps, default
package lists, template category preferences, and the `promptContext` string
injected into all AI prompts for that vertical. No vertical-specific logic
exists in component code.

---

## 23. Branding & Theming

```typescript
// CSS vars injected at screen layout level
const cssVars = `
  --color-primary:   ${branding.primaryColor};
  --color-secondary: ${branding.secondaryColor};
  --color-accent:    ${branding.accentColor};
  --font-family:     ${branding.fontFamily};
`;
```

Editor blocks can reference `var(--color-primary)` etc. so all branded
templates automatically adopt the client's colors.

---

## 24. Screen Polling Strategy

| Data | Interval |
|---|---|
| Status check | On mount only |
| Active playlist items | 60 s (+ SSE) |
| Schedule data | At slot boundary |
| Availability | 60 s (+ SSE via GCal) |
| KPI | 60 s |
| Social feed | 60 min (Redis cached) |
| Weather | 10 min (Redis cached) |
| SSE (Soketi) | Persistent |

---

## 25. Slide Generation Engine

9-step pipeline: prompt → LLM deck spec (resolved from `PromptTemplate` DB row)
→ Zod validation → image search → hard filter → LLM ranking → attribution →
HTML render → persist to `decks` table.

All prompt strings come from `resolvePrompt(slug, clientId)` — never
hardcoded. Model selection comes from the resolved prompt's `defaultModel`
field (overridable per tenant in `TenantPromptOverride`).

---

## 26. Image Provider System

```typescript
interface ImageProvider {
  name: "pexels" | "pixabay" | "openverse";
  searchImages(input: { query: string; perPage?: number; orientation?: string; }): Promise<SlideImage[]>;
}
```

Results cached in `image_cache` (24-hour TTL). Active provider read from
`getSetting("ai.image_provider", clientId)`.

---

## 27. AI Content Generation — OpenRouter

```typescript
// lib/ai.ts
export async function generateWithPrompt(
  slug: string,
  variables: Record<string, any>,
  clientId?: string
) {
  const prompt   = await resolvePrompt(slug, clientId);          // from DB
  const system   = renderPrompt(prompt.systemPrompt, variables);
  const user     = renderPrompt(prompt.userPromptTemplate, variables);
  const model    = prompt.defaultModel;                          // from DB
  const temp     = prompt.temperature;                           // from DB
  const maxToks  = prompt.maxTokens;                             // from DB

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, temperature: temp, max_tokens: maxToks,
      response_format: { type: prompt.responseFormat === "json" ? "json_object" : "text" },
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
  });
  const data = await res.json();
  return prompt.responseFormat === "json"
    ? JSON.parse(data.choices[0].message.content)
    : data.choices[0].message.content;
}
```

---

## 28. Google Calendar — Availability Sync

Admin maps `resourceId` → Google Calendar ID in `resource_calendars`.
On save, push channel registered. On push notification: verify token →
re-fetch events → upsert `availability` → broadcast `availability.changed`.
Daily cron renews expiring channels.

---

## 29. Google Reviews — Social Trust Widget

`PlaylistItem { itemType: "google_reviews", config: { placeId } }`.
`GET /social-feed?type=google-reviews` → Places API → Redis cache 1 hr.

---

## 30. Weather-Triggered Content — OpenWeatherMap

`lib/weather.ts` polls OWM every 10 min per client city, Redis cached.
`ScheduleSlot.weatherCond` filters active slots. Weather rule UI in schedule
builder; rule preview with simulated condition toggle.

---

## 31. n8n Workflow Automation Hub

`workflow_rules` table. `lib/automation.ts` runs rules on every webhook.
Action types: `sse_broadcast`, `webhook_post`, `slack_post`, `sms`.
Pre-built rule templates seeded as DB rows. Visual rule builder at
`/admin/automations`.

---

## 32. AI Content Library

`ai_content_library` table. Seeded via OpenRouter batch generation using
the `template.generate.batch` prompt (from DB). Nightly refresh cron at
`/api/cron/refresh-content`. Enabled per client via package toggle.

---

## 33. VPS Deployment (Self-Hosted)

### 33.1 Architecture

```
Internet (HTTPS 443)
    │
  Nginx
    ├── /         → Next.js  :3000
    ├── /ws/      → Soketi   :6001
    └── /assets/  → MinIO    :9000
```

### 33.2 Docker Compose

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
    environment: { POSTGRES_DB: display_platform, POSTGRES_USER: postgres, POSTGRES_PASSWORD: "${POSTGRES_PASSWORD}" }
    volumes: [pgdata:/var/lib/postgresql/data]
    restart: unless-stopped
  redis:
    image: redis:7-alpine
    volumes: [redisdata:/data]
    restart: unless-stopped
  soketi:
    image: quay.io/soketi/soketi:latest
    environment: { SOKETI_DEFAULT_APP_ID: "display-platform", SOKETI_DEFAULT_APP_KEY: "${SOKETI_APP_KEY}", SOKETI_DEFAULT_APP_SECRET: "${SOKETI_APP_SECRET}", SOKETI_REDIS_HOST: "redis" }
    depends_on: [redis]
    restart: unless-stopped
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment: { MINIO_ROOT_USER: "${MINIO_ACCESS_KEY}", MINIO_ROOT_PASSWORD: "${MINIO_SECRET_KEY}" }
    volumes: [miniodata:/data]
    restart: unless-stopped
  nginx:
    image: nginx:alpine
    volumes: ["./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro"]
    ports: ["80:80","443:443"]
    depends_on: [app, soketi, minio]
    restart: unless-stopped
volumes:
  pgdata:
  redisdata:
  miniodata:
```

### 33.3 Nginx

```nginx
upstream nextjs { server app:3000; }
upstream soketi { server soketi:6001; }
upstream minio  { server minio:9000; }

server {
  listen 443 ssl;
  server_name your-domain.com;
  ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

  location /assets/ { proxy_pass http://minio/display-platform-assets/; expires 7d; }
  location /ws/     { proxy_pass http://soketi; proxy_http_version 1.1;
                      proxy_set_header Upgrade $http_upgrade;
                      proxy_set_header Connection "upgrade";
                      proxy_read_timeout 3600s; proxy_buffering off; }
  location /        { proxy_pass http://nextjs; proxy_http_version 1.1;
                      proxy_set_header Upgrade $http_upgrade;
                      proxy_set_header Connection "upgrade";
                      proxy_set_header Host $host;
                      proxy_set_header X-Real-IP $remote_addr; }
}
server { listen 80; server_name your-domain.com; return 301 https://$host$request_uri; }
```

### 33.4 TV Kiosk

```bash
chromium-browser --kiosk --noerrdialogs --disable-infobars \
  "https://your-domain.com/pair"
# After pairing, token saved in localStorage, TV auto-redirects to screen URL
```

---

## 34. Prioritized Build Roadmap

### 🔴 Phase 1 — Core Platform (Weeks 1–4)

**Infrastructure**
- Docker Compose full stack (Postgres, Redis, Soketi, MinIO, Nginx)
- Prisma schema + migrations
- `prisma/seed.ts` — plans, app settings, prompt templates (all 6), vertical configs, layout preset templates

**Config & Settings layer (build first — everything else depends on it)**
- `AppSetting`, `TenantSetting`, `PromptTemplate`, `TenantPromptOverride`, `VerticalConfig` tables
- `lib/settings.ts` — `getSetting()` / `setSetting()` with Redis cache
- `lib/prompts.ts` — `resolvePrompt()` / `renderPrompt()`
- `/admin/settings/general` — tenant name, city, vertical, timezone
- `/admin/settings/prompts` — view and edit all prompt templates + per-tenant overrides
- `/admin/settings/app` — super-admin global platform settings

**Auth**
- NextAuth.js admin auth
- Per-screen bearer tokens
- Super-admin role check

**Screens**
- `/admin/screens` — list, status badges, filters
- `/pair` — 6-digit code + QR on TV
- `lib/pairing.ts` — generate + consume pairing code
- Soketi heartbeat → screen Online/Offline detection

**Media**
- `lib/storage.ts` — MinIO upload/delete/URL
- `/admin/media` — upload, folders, grid/list, search

**Billing**
- `Plan`, `Subscription`, `UsageRecord`, `GenerationLog` tables
- `lib/usage.ts` — `checkAndIncrement()`, `checkFeature()`
- `/admin/settings/billing` — usage bars, plan display
- Usage warning UI (80% / 100% thresholds, lock icons)

### 🔴 Phase 2 — Editor + Templates (Weeks 5–8)

- `Template`, `TemplateVersion`, `TemplateTag`, `TemplateRating`, `TemplateFavourite` tables
- `/admin/editor` — canvas editor (EditorCanvas, blocks, toolbar, properties panel)
- `EditorState` type + `lib/editor.ts` — `renderEditorHtml()`
- All 7 block types (Text, Image, Shape, Logo, QR, Video)
- Layer panel, undo/redo
- TV-ratio preview modal
- Layout presets (7 presets seeded as DB templates)
- `/admin/templates` — Template Repository browser (Library tab + My Templates tab)
- All filter options (orientation, group, category, vertical, search, sort)
- Fork, rate, favourite, version history, restore
- Save-from-editor flow with auto-thumbnail generation

### 🔴 Phase 3 — Playlists + Schedules (Weeks 9–10)

- `/admin/playlists` — create, mixed-type items, publish, assign to screen
- `/admin/schedules` — weekly calendar grid, time slot assignment
- Zone layout picker modal (Main / Content+Weather+News)
- TV screen renderer (`/screens/:clientId/:screenId`) — playlist loop + SSE

### 🟡 Phase 4 — AI + Image Search (Weeks 11–13)

- `lib/ai.ts` — `generateWithPrompt()` using `lib/prompts.ts` (all prompts from DB)
- `POST /slides/generate` + `POST /announcements/generate` + `POST /deck/generate`
- Inline image search panel in editor (Pexels + usage gate)
- AI generate panel in editor (injects into Text block)
- **✨ Generate with AI** button in slide editor
- Slide generation pipeline (§25)
- `lib/images/pexels.ts` + normalize + attribution + `image_cache`
- Stripe checkout + portal + webhook handler
- Smooth Setup wizard

### 🟡 Phase 5 — Integrations + Automation (Weeks 14–18)

- `lib/weather.ts` + weather columns on `ScheduleSlot`
- `ContentWeatherNewsZone` split-zone component
- `lib/gcal.ts` — Google Calendar push sync
- `lib/reviews.ts` + `<GoogleReviewSlide>`
- `POST /schedule/suggest` + AI Suggestions panel
- `workflow_rules` + `lib/automation.ts`
- `/admin/automations` — visual rule builder
- `/admin/apps` — Web links, Dashboards, Stream URL stubs
- Pixabay image provider adapter

### 🔵 Phase 6 — Polish + Expansion (Month 5+)

- Template publishing to shared library (Pro+ gate)
- `ai_content_library` batch seed + nightly refresh
- AI Content Library browser in admin
- Block animation / transitions in editor
- Export template as PNG/PDF
- Video wall builder
- Openverse image provider
- Integration marketplace UI

---

## 35. Local Development

### 35.1 Start Services

```bash
docker compose -f docker/docker-compose.yml up -d postgres redis soketi minio
```

### 35.2 Bootstrap

```bash
pnpm install
cp .env.example .env.local
# Required: DATABASE_URL, REDIS_URL, SOKETI_*, MINIO_*, PEXELS_API_KEY, OPENROUTER_API_KEY

pnpm prisma migrate dev --name init
pnpm prisma db seed
# Seed creates: plans, app settings, all prompt templates,
#               vertical configs, layout preset templates, demo tenant
pnpm dev
```

### 35.3 Useful URLs

| URL | Description |
|---|---|
| `http://localhost:3000/admin` | Admin dashboard |
| `http://localhost:3000/admin/editor` | Slide editor (new) |
| `http://localhost:3000/admin/templates` | Template repository |
| `http://localhost:3000/admin/settings/prompts` | Prompt template editor |
| `http://localhost:3000/admin/settings/billing` | Usage dashboard |
| `http://localhost:3000/pair` | TV pairing screen |
| `http://localhost:3000/screens/demo-client/lobby` | Example TV screen |
| `http://localhost:6001` | Soketi dashboard |
| `http://localhost:9001` | MinIO console |

### 35.4 Test AI Generation (uses DB prompt)

```bash
# Slide generation — prompt resolved from DB, model from DB
curl -X POST http://localhost:3000/api/v1/clients/demo-client/slides/generate \
  -H "Authorization: Bearer tok_xxx" \
  -H "Content-Type: application/json" \
  -d '{ "prompt": "Remind patients about our summer whitening promo", "context": { "screenType": "waiting-display", "season": "summer" } }'

# Edit the prompt used — no redeployment needed
curl -X PATCH http://localhost:3000/api/v1/admin/prompts/slide.generate \
  -H "Authorization: Bearer {super-admin-token}" \
  -H "Content-Type: application/json" \
  -d '{ "temperature": 0.9, "defaultModel": "openai/gpt-4o" }'
```

---

*Last updated: March 2026 · Display Platform v1 · VPS deployment · All features planned — nothing built*
