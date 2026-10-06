-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vertical" TEXT,
    "city" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "brandVoice" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_branding" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#0f172a',
    "secondaryColor" TEXT NOT NULL DEFAULT '#ffffff',
    "accentColor" TEXT NOT NULL DEFAULT '#ea580c',
    "fontFamily" TEXT NOT NULL DEFAULT 'Segoe UI',
    "logoUrl" TEXT,
    "secondaryLogoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_branding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceMonthly" INTEGER NOT NULL,
    "limits" JSONB NOT NULL,
    "features" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "planSlug" TEXT NOT NULL DEFAULT 'essential',
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "stripeCustomerId" TEXT,
    "stripeSubId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_records" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_logs" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "aiModel" TEXT,
    "promptSlug" TEXT,
    "promptTokens" INTEGER,
    "outputTokens" INTEGER,
    "durationMs" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_settings" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_templates" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "userPromptTemplate" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "defaultModel" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 1000,
    "responseFormat" TEXT NOT NULL DEFAULT 'json',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_prompt_overrides" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "promptSlug" TEXT NOT NULL,
    "systemPrompt" TEXT,
    "userPromptTemplate" TEXT,
    "temperature" DOUBLE PRECISION,
    "maxTokens" INTEGER,
    "defaultModel" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_prompt_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flag_overrides" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_flag_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vertical_configs" (
    "id" TEXT NOT NULL,
    "vertical" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "promptContext" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vertical_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "screens" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ready_to_play',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "location" TEXT,
    "space" TEXT,
    "screenType" TEXT,
    "orientation" TEXT NOT NULL DEFAULT 'landscape',
    "pairingCode" TEXT,
    "pairingCodeExpiry" TIMESTAMP(3),
    "operationHours" JSONB,
    "lastHeartbeatAt" TIMESTAMP(3),
    "assignedPlaylistId" TEXT,
    "assignedScheduleId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "screens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_folders" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "folderId" TEXT,
    "name" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL DEFAULT 0,
    "width" INTEGER,
    "height" INTEGER,
    "durationSecs" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlists" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totalDurationSecs" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_items" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "resourceId" TEXT,
    "config" JSONB,
    "displayDurationSecs" INTEGER NOT NULL DEFAULT 8,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "timezone" TEXT,
    "zoneLayout" TEXT NOT NULL DEFAULT 'main',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_slots" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "playlistId" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "zoneLayout" TEXT NOT NULL DEFAULT 'main',
    "weatherCond" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "mainGroup" TEXT NOT NULL DEFAULT 'all',
    "orientation" TEXT NOT NULL DEFAULT 'horizontal',
    "vertical" TEXT,
    "thumbnailUrl" TEXT,
    "editorState" JSONB NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "cssContent" TEXT NOT NULL DEFAULT '',
    "isLibrary" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "forkedFromId" TEXT,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_versions" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "editorState" JSONB NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "cssContent" TEXT NOT NULL DEFAULT '',
    "thumbnailUrl" TEXT,
    "changeNote" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_tags" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "template_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_ratings" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_favourites" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_favourites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decks" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prompt" TEXT,
    "promptSlug" TEXT,
    "aiModel" TEXT,
    "theme" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "durationSecs" INTEGER NOT NULL DEFAULT 0,
    "tokensUsed" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slides" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "deckId" TEXT,
    "icon" TEXT,
    "tag" TEXT,
    "title" TEXT NOT NULL,
    "layout" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "imageIntent" JSONB,
    "htmlContent" TEXT,
    "jsonState" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_content_library" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "category" TEXT NOT NULL,
    "vertical" TEXT,
    "contentType" TEXT NOT NULL,
    "sourcePromptSlug" TEXT,
    "title" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_content_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_integrations" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "url" TEXT,
    "config" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "resourceType" TEXT,
    "externalEventId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'busy',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "metadata" JSONB,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_entries" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "screenId" TEXT,
    "playlistId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "zoneLayout" TEXT NOT NULL DEFAULT 'main',
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_calendars" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "googleCalendarId" TEXT NOT NULL,
    "syncChannelId" TEXT,
    "syncResourceToken" TEXT,
    "channelExpiresAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "idempotencyKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "retries" INTEGER NOT NULL DEFAULT 0,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_rules" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerEvent" TEXT NOT NULL,
    "condition" JSONB NOT NULL,
    "actionType" TEXT NOT NULL,
    "actionConfig" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_tokens" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "screenId" TEXT,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL DEFAULT 'api',
    "scopes" JSONB,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_cache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "clientId" TEXT,
    "provider" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "orientation" TEXT NOT NULL DEFAULT 'any',
    "results" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "image_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clients_status_idx" ON "clients"("status");

-- CreateIndex
CREATE INDEX "clients_vertical_idx" ON "clients"("vertical");

-- CreateIndex
CREATE UNIQUE INDEX "client_branding_clientId_key" ON "client_branding"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "plans_slug_key" ON "plans"("slug");

-- CreateIndex
CREATE INDEX "plans_isActive_idx" ON "plans"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_clientId_key" ON "subscriptions"("clientId");

-- CreateIndex
CREATE INDEX "subscriptions_planSlug_idx" ON "subscriptions"("planSlug");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "usage_records_clientId_idx" ON "usage_records"("clientId");

-- CreateIndex
CREATE INDEX "usage_records_metric_period_idx" ON "usage_records"("metric", "period");

-- CreateIndex
CREATE UNIQUE INDEX "usage_records_clientId_metric_period_key" ON "usage_records"("clientId", "metric", "period");

-- CreateIndex
CREATE INDEX "generation_logs_clientId_idx" ON "generation_logs"("clientId");

-- CreateIndex
CREATE INDEX "generation_logs_clientId_metric_idx" ON "generation_logs"("clientId", "metric");

-- CreateIndex
CREATE INDEX "generation_logs_promptSlug_idx" ON "generation_logs"("promptSlug");

-- CreateIndex
CREATE UNIQUE INDEX "app_settings_key_key" ON "app_settings"("key");

-- CreateIndex
CREATE INDEX "app_settings_category_idx" ON "app_settings"("category");

-- CreateIndex
CREATE INDEX "tenant_settings_clientId_idx" ON "tenant_settings"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_settings_clientId_key_key" ON "tenant_settings"("clientId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_templates_slug_key" ON "prompt_templates"("slug");

-- CreateIndex
CREATE INDEX "prompt_templates_category_idx" ON "prompt_templates"("category");

-- CreateIndex
CREATE INDEX "prompt_templates_isActive_idx" ON "prompt_templates"("isActive");

-- CreateIndex
CREATE INDEX "tenant_prompt_overrides_clientId_idx" ON "tenant_prompt_overrides"("clientId");

-- CreateIndex
CREATE INDEX "tenant_prompt_overrides_promptSlug_idx" ON "tenant_prompt_overrides"("promptSlug");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_prompt_overrides_clientId_promptSlug_key" ON "tenant_prompt_overrides"("clientId", "promptSlug");

-- CreateIndex
CREATE INDEX "feature_flag_overrides_clientId_idx" ON "feature_flag_overrides"("clientId");

-- CreateIndex
CREATE INDEX "feature_flag_overrides_expiresAt_idx" ON "feature_flag_overrides"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flag_overrides_clientId_feature_key" ON "feature_flag_overrides"("clientId", "feature");

-- CreateIndex
CREATE UNIQUE INDEX "vertical_configs_vertical_key" ON "vertical_configs"("vertical");

-- CreateIndex
CREATE INDEX "screens_clientId_idx" ON "screens"("clientId");

-- CreateIndex
CREATE INDEX "screens_clientId_status_idx" ON "screens"("clientId", "status");

-- CreateIndex
CREATE INDEX "screens_location_idx" ON "screens"("location");

-- CreateIndex
CREATE INDEX "screens_space_idx" ON "screens"("space");

-- CreateIndex
CREATE INDEX "screens_pairingCode_idx" ON "screens"("pairingCode");

-- CreateIndex
CREATE INDEX "media_folders_clientId_idx" ON "media_folders"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "media_folders_clientId_parentId_name_key" ON "media_folders"("clientId", "parentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_objectKey_key" ON "media_assets"("objectKey");

-- CreateIndex
CREATE INDEX "media_assets_clientId_idx" ON "media_assets"("clientId");

-- CreateIndex
CREATE INDEX "media_assets_folderId_idx" ON "media_assets"("folderId");

-- CreateIndex
CREATE INDEX "media_assets_mimeType_idx" ON "media_assets"("mimeType");

-- CreateIndex
CREATE INDEX "playlists_clientId_idx" ON "playlists"("clientId");

-- CreateIndex
CREATE INDEX "playlists_clientId_status_idx" ON "playlists"("clientId", "status");

-- CreateIndex
CREATE INDEX "playlist_items_clientId_idx" ON "playlist_items"("clientId");

-- CreateIndex
CREATE INDEX "playlist_items_playlistId_idx" ON "playlist_items"("playlistId");

-- CreateIndex
CREATE INDEX "playlist_items_itemType_idx" ON "playlist_items"("itemType");

-- CreateIndex
CREATE UNIQUE INDEX "playlist_items_playlistId_order_key" ON "playlist_items"("playlistId", "order");

-- CreateIndex
CREATE INDEX "schedules_clientId_idx" ON "schedules"("clientId");

-- CreateIndex
CREATE INDEX "schedules_clientId_status_idx" ON "schedules"("clientId", "status");

-- CreateIndex
CREATE INDEX "schedules_zoneLayout_idx" ON "schedules"("zoneLayout");

-- CreateIndex
CREATE INDEX "schedule_slots_clientId_idx" ON "schedule_slots"("clientId");

-- CreateIndex
CREATE INDEX "schedule_slots_scheduleId_dayOfWeek_idx" ON "schedule_slots"("scheduleId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "schedule_slots_weatherCond_idx" ON "schedule_slots"("weatherCond");

-- CreateIndex
CREATE INDEX "schedule_slots_zoneLayout_idx" ON "schedule_slots"("zoneLayout");

-- CreateIndex
CREATE INDEX "templates_clientId_idx" ON "templates"("clientId");

-- CreateIndex
CREATE INDEX "templates_category_idx" ON "templates"("category");

-- CreateIndex
CREATE INDEX "templates_vertical_idx" ON "templates"("vertical");

-- CreateIndex
CREATE INDEX "templates_isLibrary_isPublished_idx" ON "templates"("isLibrary", "isPublished");

-- CreateIndex
CREATE INDEX "template_versions_templateId_idx" ON "template_versions"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "template_versions_templateId_version_key" ON "template_versions"("templateId", "version");

-- CreateIndex
CREATE INDEX "template_tags_tag_idx" ON "template_tags"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "template_tags_templateId_tag_key" ON "template_tags"("templateId", "tag");

-- CreateIndex
CREATE INDEX "template_ratings_clientId_idx" ON "template_ratings"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "template_ratings_templateId_clientId_key" ON "template_ratings"("templateId", "clientId");

-- CreateIndex
CREATE INDEX "template_favourites_clientId_idx" ON "template_favourites"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "template_favourites_templateId_clientId_key" ON "template_favourites"("templateId", "clientId");

-- CreateIndex
CREATE INDEX "decks_clientId_idx" ON "decks"("clientId");

-- CreateIndex
CREATE INDEX "decks_clientId_status_idx" ON "decks"("clientId", "status");

-- CreateIndex
CREATE INDEX "slides_clientId_idx" ON "slides"("clientId");

-- CreateIndex
CREATE INDEX "slides_deckId_idx" ON "slides"("deckId");

-- CreateIndex
CREATE INDEX "ai_content_library_clientId_idx" ON "ai_content_library"("clientId");

-- CreateIndex
CREATE INDEX "ai_content_library_category_idx" ON "ai_content_library"("category");

-- CreateIndex
CREATE INDEX "ai_content_library_vertical_idx" ON "ai_content_library"("vertical");

-- CreateIndex
CREATE INDEX "app_integrations_clientId_idx" ON "app_integrations"("clientId");

-- CreateIndex
CREATE INDEX "app_integrations_type_idx" ON "app_integrations"("type");

-- CreateIndex
CREATE INDEX "availability_clientId_idx" ON "availability"("clientId");

-- CreateIndex
CREATE INDEX "availability_clientId_status_idx" ON "availability"("clientId", "status");

-- CreateIndex
CREATE INDEX "availability_resourceId_idx" ON "availability"("resourceId");

-- CreateIndex
CREATE INDEX "availability_startAt_idx" ON "availability"("startAt");

-- CreateIndex
CREATE UNIQUE INDEX "availability_clientId_resourceId_startAt_endAt_key" ON "availability"("clientId", "resourceId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "schedule_entries_clientId_idx" ON "schedule_entries"("clientId");

-- CreateIndex
CREATE INDEX "schedule_entries_clientId_status_idx" ON "schedule_entries"("clientId", "status");

-- CreateIndex
CREATE INDEX "schedule_entries_startsAt_idx" ON "schedule_entries"("startsAt");

-- CreateIndex
CREATE INDEX "resource_calendars_clientId_idx" ON "resource_calendars"("clientId");

-- CreateIndex
CREATE INDEX "resource_calendars_channelExpiresAt_idx" ON "resource_calendars"("channelExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "resource_calendars_clientId_resourceId_key" ON "resource_calendars"("clientId", "resourceId");

-- CreateIndex
CREATE INDEX "webhook_events_clientId_idx" ON "webhook_events"("clientId");

-- CreateIndex
CREATE INDEX "webhook_events_clientId_status_idx" ON "webhook_events"("clientId", "status");

-- CreateIndex
CREATE INDEX "webhook_events_eventType_idx" ON "webhook_events"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_clientId_idempotencyKey_key" ON "webhook_events"("clientId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "workflow_rules_clientId_idx" ON "workflow_rules"("clientId");

-- CreateIndex
CREATE INDEX "workflow_rules_clientId_isActive_idx" ON "workflow_rules"("clientId", "isActive");

-- CreateIndex
CREATE INDEX "workflow_rules_triggerEvent_idx" ON "workflow_rules"("triggerEvent");

-- CreateIndex
CREATE UNIQUE INDEX "api_tokens_tokenHash_key" ON "api_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "api_tokens_clientId_idx" ON "api_tokens"("clientId");

-- CreateIndex
CREATE INDEX "api_tokens_tokenType_idx" ON "api_tokens"("tokenType");

-- CreateIndex
CREATE INDEX "api_tokens_expiresAt_idx" ON "api_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "image_cache_cacheKey_key" ON "image_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "image_cache_clientId_idx" ON "image_cache"("clientId");

-- CreateIndex
CREATE INDEX "image_cache_provider_expiresAt_idx" ON "image_cache"("provider", "expiresAt");

-- CreateIndex
CREATE INDEX "image_cache_query_provider_idx" ON "image_cache"("query", "provider");

-- CreateIndex
CREATE INDEX "image_cache_expiresAt_idx" ON "image_cache"("expiresAt");

-- AddForeignKey
ALTER TABLE "client_branding" ADD CONSTRAINT "client_branding_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screens" ADD CONSTRAINT "screens_assignedPlaylistId_fkey" FOREIGN KEY ("assignedPlaylistId") REFERENCES "playlists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screens" ADD CONSTRAINT "screens_assignedScheduleId_fkey" FOREIGN KEY ("assignedScheduleId") REFERENCES "schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "playlists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_forkedFromId_fkey" FOREIGN KEY ("forkedFromId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_versions" ADD CONSTRAINT "template_versions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_tags" ADD CONSTRAINT "template_tags_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_ratings" ADD CONSTRAINT "template_ratings_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_favourites" ADD CONSTRAINT "template_favourites_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slides" ADD CONSTRAINT "slides_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "decks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
