import bcrypt from "bcrypt";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/db";

const UNLIMITED = -1;

async function seedPlans() {
  const plans: Array<{
    slug: string;
    name: string;
    priceMonthly: number;
    limits: Prisma.InputJsonValue;
    features: Prisma.InputJsonValue;
  }> = [
    {
      slug: "essential",
      name: "Essential",
      priceMonthly: 500,
      limits: {
        screens: 2,
        media_storage_mb: 500,
        playlists: 5,
        schedules: 2,
        ai_slides: 10,
        ai_decks: 2,
        ai_announcements: 5,
        ai_schedule_suggestions: 1,
        image_searches: 20,
        template_saves: 3,
        shared_template_publishes: 0,
        ai_content_library_items: 10,
        webhooks: 1,
        workflow_rules: 0,
      },
      features: {
        google_reviews: false,
        weather_rules: false,
        google_calendar: false,
        video_wall: false,
        all_zone_layouts: false,
      },
    },
    {
      slug: "professional",
      name: "Professional",
      priceMonthly: 1500,
      limits: {
        screens: 5,
        media_storage_mb: 5000,
        playlists: 25,
        schedules: 10,
        ai_slides: 100,
        ai_decks: 20,
        ai_announcements: 50,
        ai_schedule_suggestions: 10,
        image_searches: 200,
        template_saves: 20,
        shared_template_publishes: 0,
        ai_content_library_items: 100,
        webhooks: 5,
        workflow_rules: 3,
      },
      features: {
        google_reviews: true,
        weather_rules: true,
        google_calendar: false,
        video_wall: false,
        all_zone_layouts: true,
      },
    },
    {
      slug: "premium",
      name: "Premium",
      priceMonthly: 3000,
      limits: {
        screens: UNLIMITED,
        media_storage_mb: 25000,
        playlists: UNLIMITED,
        schedules: UNLIMITED,
        ai_slides: 500,
        ai_decks: 100,
        ai_announcements: 200,
        ai_schedule_suggestions: 50,
        image_searches: 1000,
        template_saves: UNLIMITED,
        shared_template_publishes: 10,
        ai_content_library_items: UNLIMITED,
        webhooks: UNLIMITED,
        workflow_rules: 25,
      },
      features: {
        google_reviews: true,
        weather_rules: true,
        google_calendar: true,
        video_wall: false,
        all_zone_layouts: true,
      },
    },
    {
      // Enterprise is custom-priced/contract-based — priceMonthly: 0 is a
      // documented sentinel here, not "free".
      slug: "enterprise",
      name: "Enterprise",
      priceMonthly: 0,
      limits: {
        screens: UNLIMITED,
        media_storage_mb: UNLIMITED,
        playlists: UNLIMITED,
        schedules: UNLIMITED,
        ai_slides: UNLIMITED,
        ai_decks: UNLIMITED,
        ai_announcements: UNLIMITED,
        ai_schedule_suggestions: UNLIMITED,
        image_searches: UNLIMITED,
        template_saves: UNLIMITED,
        shared_template_publishes: UNLIMITED,
        ai_content_library_items: UNLIMITED,
        webhooks: UNLIMITED,
        workflow_rules: UNLIMITED,
      },
      features: {
        google_reviews: true,
        weather_rules: true,
        google_calendar: true,
        video_wall: true,
        all_zone_layouts: true,
      },
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      create: plan,
      update: plan,
    });
  }
}

async function seedAppSettings() {
  const appSettings: Array<{
    key: string;
    value: Prisma.InputJsonValue;
    type: string;
    label: string;
    category: string;
    isSecret?: boolean;
  }> = [
    { key: "platform.name", value: "Display Platform", type: "string", category: "platform", label: "Platform name" },
    { key: "platform.support_email", value: "", type: "string", category: "platform", label: "Support email" },

    { key: "ai.default_model", value: "anthropic/claude-3.5-sonnet", type: "string", category: "ai", label: "Default AI model" },
    { key: "ai.fallback_model", value: "openai/gpt-4o-mini", type: "string", category: "ai", label: "Fallback AI model" },
    { key: "ai.image_provider", value: "pexels", type: "string", category: "ai", label: "Default image provider" },
    { key: "ai.enable_image_ranking", value: true, type: "boolean", category: "ai", label: "Use LLM to rank image candidates" },
    { key: "ai.max_candidates_per_slide", value: 5, type: "number", category: "ai", label: "Max image candidates sent to LLM" },

    { key: "media.max_upload_mb", value: 200, type: "number", category: "media", label: "Max upload size (MB)" },
    {
      key: "media.allowed_mime_types",
      value: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "video/mp4", "video/webm", "application/pdf"],
      type: "json",
      category: "media",
      label: "Allowed MIME types",
    },

    { key: "features.public_template_library", value: true, type: "boolean", category: "features", label: "Enable shared template library" },
    { key: "features.template_publishing", value: true, type: "boolean", category: "features", label: "Allow Pro+ tenants to publish templates" },
    { key: "features.smooth_setup_wizard", value: true, type: "boolean", category: "features", label: "Enable Smooth Setup wizard" },

    { key: "billing.stripe_enabled", value: true, type: "boolean", category: "billing", label: "Enable Stripe payments", isSecret: false },
    { key: "billing.trial_days", value: 14, type: "number", category: "billing", label: "Free trial duration (days)" },
  ];

  for (const setting of appSettings) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      create: setting,
      update: setting,
    });
  }
}

async function seedPromptTemplates() {
  const promptTemplates: Array<{
    slug: string;
    name: string;
    category: string;
    systemPrompt: string;
    userPromptTemplate: string;
    variables: Prisma.InputJsonValue;
    defaultModel: string;
    temperature: number;
    maxTokens: number;
  }> = [
    {
      slug: "slide.generate",
      name: "Single Slide Generation",
      category: "generation",
      systemPrompt:
        "You are a professional digital signage content writer for {{clientName}}, a {{vertical}} business.\n" +
        "Write concise, engaging content suited for a TV display. Tone: {{tone}}.\n" +
        "Brand voice: {{brandVoice}}.\n" +
        "Always respond with valid JSON only.",
      userPromptTemplate:
        'Create a single display slide for: "{{prompt}}"\n' +
        "Screen type: {{screenType}}. Season: {{season}}. Orientation: {{orientation}}.\n" +
        'Return JSON: { "icon": "emoji", "tag": "short tag", "title": "max 8 words", "body": "max 25 words", "suggestedLayout": "hero|two-column|quote", "tags": [] }',
      variables: {
        clientName: "string",
        vertical: "string",
        tone: "string",
        brandVoice: "string",
        prompt: "string",
        screenType: "string",
        season: "string",
        orientation: "string",
      },
      defaultModel: "anthropic/claude-3.5-sonnet",
      temperature: 0.75,
      maxTokens: 500,
    },
    {
      slug: "deck.generate",
      name: "Full Deck Generation",
      category: "generation",
      systemPrompt:
        "You are a professional presentation designer for {{clientName}}, a {{vertical}} business.\n" +
        "Create structured, visually-oriented slide decks for TV display.\n" +
        "Always respond with valid JSON only. Never include markdown.",
      userPromptTemplate:
        'Create a {{slideCount}}-slide deck about: "{{prompt}}"\n' +
        "Theme: {{theme}}. Vertical context: {{vertical}}.\n" +
        "Each slide must include an imageIntent with a specific Pexels search query.\n" +
        'Return JSON: { "title": "", "theme": "", "slides": [{ "title":"", "layout":"hero|two-column|image-left|image-right|quote|grid", "bodyHtml":"", "imageIntent": { "query":"", "orientation":"landscape", "visualStyle":"" } }] }',
      variables: { clientName: "string", vertical: "string", prompt: "string", slideCount: "number", theme: "string" },
      defaultModel: "anthropic/claude-3.5-sonnet",
      temperature: 0.7,
      maxTokens: 2000,
    },
    {
      slug: "announcement.generate",
      name: "Announcement Generation",
      category: "generation",
      systemPrompt:
        "You are a communications assistant for {{clientName}}, a {{vertical}} business.\n" +
        "Write clear, friendly announcements for digital display screens. Keep it brief and actionable.\n" +
        "Always respond with valid JSON only.",
      userPromptTemplate:
        'Write a display announcement for: "{{brief}}"\n' +
        'Return JSON: { "icon":"emoji", "title":"max 6 words", "body":"max 20 words", "urgency":"low|medium|high", "suggestedStartDate":"YYYY-MM-DD or null", "suggestedEndDate":"YYYY-MM-DD or null" }',
      variables: { clientName: "string", vertical: "string", brief: "string" },
      defaultModel: "anthropic/claude-3.5-sonnet",
      temperature: 0.6,
      maxTokens: 300,
    },
    {
      slug: "image.rank",
      name: "Image Candidate Ranking",
      category: "ranking",
      systemPrompt:
        "You are an art director selecting the best stock photo for a digital signage slide.\n" +
        "Evaluate based on: visual relevance to the slide content, professional quality, composition suitability for TV display, and brand appropriateness for a {{vertical}} business.\n" +
        "Always respond with valid JSON only.",
      userPromptTemplate:
        'Slide title: "{{slideTitle}}"\n' +
        'Slide body: "{{slideBody}}"\n' +
        "Image candidates (index 0-{{maxIndex}}):\n" +
        "{{candidateList}}\n" +
        'Select the best candidate. Return JSON: { "selected": <index>, "reason": "<one sentence>" }',
      variables: { vertical: "string", slideTitle: "string", slideBody: "string", maxIndex: "number", candidateList: "string" },
      defaultModel: "anthropic/claude-3.5-sonnet",
      temperature: 0.2,
      maxTokens: 100,
    },
    {
      slug: "schedule.suggest",
      name: "AI Schedule Dayparting Suggestions",
      category: "analysis",
      systemPrompt:
        "You are a digital signage strategist for {{clientName}}, a {{vertical}} business.\n" +
        "Analyse appointment/activity patterns and recommend optimal content time windows.\n" +
        "Always respond with valid JSON only.",
      userPromptTemplate:
        "Appointment pattern data (last 90 days, bucketed by day+hour):\n" +
        "{{patternData}}\n" +
        "Suggest content time windows for the waiting display screen.\n" +
        'Return JSON array: [{ "dayOfWeek": "mon|tue|...|all", "startHour": 9, "endHour": 12, "contentTypes": ["tip","promo"], "reason": "" }]',
      variables: { clientName: "string", vertical: "string", patternData: "string" },
      defaultModel: "anthropic/claude-3.5-sonnet",
      temperature: 0.3,
      maxTokens: 800,
    },
    {
      slug: "template.generate.batch",
      name: "AI Content Library Batch Generation",
      category: "generation",
      systemPrompt:
        "You are a professional content creator specialising in {{vertical}} digital signage.\n" +
        "Generate diverse, high-quality display slide content. Be specific, practical, and engaging.\n" +
        "Always respond with valid JSON only — no markdown, no preamble.",
      userPromptTemplate:
        'Generate {{count}} slides for category "{{category}}", targeting "{{targetScreen}}" screen in {{monthName}}.\n' +
        "Vertical: {{vertical}}.\n" +
        'Return JSON array: [{ "icon":"emoji", "tag":"", "title":"max 8 words", "body":"max 25 words" }]',
      variables: { vertical: "string", count: "number", category: "string", targetScreen: "string", monthName: "string" },
      defaultModel: "anthropic/claude-3.5-sonnet",
      temperature: 0.85,
      maxTokens: 1500,
    },
  ];

  for (const prompt of promptTemplates) {
    await prisma.promptTemplate.upsert({
      where: { slug: prompt.slug },
      create: prompt,
      update: prompt,
    });
  }
}

type LayoutPreset = {
  name: string;
  orientation: "horizontal" | "vertical" | "both";
  editorState: Prisma.InputJsonValue;
  htmlContent: string;
};

const CANVAS_META = { duration: 10, transition: "fade" as const };

function textBlock(id: string, x: number, y: number, width: number, height: number, zIndex: number, content: string, fontSize: number, align: "left" | "center" | "right" = "center") {
  return {
    id,
    type: "text" as const,
    x,
    y,
    width,
    height,
    zIndex,
    locked: false,
    visible: true,
    props: {
      content,
      fontSize,
      fontWeight: "600",
      fontFamily: "var(--brand-font)",
      color: "#ffffff",
      align,
      lineHeight: 1.2,
    },
  };
}

function imageBlock(id: string, x: number, y: number, width: number, height: number, zIndex: number) {
  return {
    id,
    type: "image" as const,
    x,
    y,
    width,
    height,
    zIndex,
    locked: false,
    visible: true,
    props: { src: "", objectFit: "cover" as const },
  };
}

function positionedDiv(x: number, y: number, width: number, height: number, style: string, inner: string) {
  return `<div style="position:absolute;left:${x}%;top:${y}%;width:${width}%;height:${height}%;${style}">${inner}</div>`;
}

function layoutHtml(background: string, children: string): string {
  return `<div style="position:relative;width:100%;height:100%;background:${background};overflow:hidden;">${children}</div>`;
}

const layoutPresets: LayoutPreset[] = [
  {
    name: "hero",
    orientation: "both",
    editorState: {
      version: 1,
      width: 1920,
      height: 1080,
      orientation: "landscape",
      background: { type: "color", value: "#0f172a" },
      blocks: [imageBlock("hero-image", 0, 0, 100, 100, 1), textBlock("hero-title", 5, 70, 90, 20, 2, "Headline goes here", 64)],
      meta: CANVAS_META,
    },
    htmlContent: layoutHtml(
      "#0f172a",
      positionedDiv(0, 0, 100, 100, "background-size:cover;background-position:center;", "") +
        positionedDiv(5, 70, 90, 20, "display:flex;align-items:center;justify-content:center;color:#fff;font-size:4vw;font-weight:600;text-align:center;", "Headline goes here"),
    ),
  },
  {
    name: "two-column",
    orientation: "both",
    editorState: {
      version: 1,
      width: 1920,
      height: 1080,
      orientation: "landscape",
      background: { type: "color", value: "#ffffff" },
      blocks: [textBlock("two-col-text", 5, 10, 45, 80, 1, "Body copy goes here", 32, "left"), imageBlock("two-col-image", 55, 0, 45, 100, 2)],
      meta: CANVAS_META,
    },
    htmlContent: layoutHtml(
      "#ffffff",
      positionedDiv(5, 10, 45, 80, "display:flex;align-items:center;color:#0f172a;font-size:2vw;text-align:left;", "Body copy goes here") +
        positionedDiv(55, 0, 45, 100, "background-size:cover;background-position:center;", ""),
    ),
  },
  {
    name: "image-left",
    orientation: "both",
    editorState: {
      version: 1,
      width: 1920,
      height: 1080,
      orientation: "landscape",
      background: { type: "color", value: "#ffffff" },
      blocks: [imageBlock("image-left-image", 0, 0, 40, 100, 1), textBlock("image-left-text", 45, 10, 50, 80, 2, "Body copy goes here", 32, "left")],
      meta: CANVAS_META,
    },
    htmlContent: layoutHtml(
      "#ffffff",
      positionedDiv(0, 0, 40, 100, "background-size:cover;background-position:center;", "") +
        positionedDiv(45, 10, 50, 80, "display:flex;align-items:center;color:#0f172a;font-size:2vw;text-align:left;", "Body copy goes here"),
    ),
  },
  {
    name: "image-right",
    orientation: "both",
    editorState: {
      version: 1,
      width: 1920,
      height: 1080,
      orientation: "landscape",
      background: { type: "color", value: "#ffffff" },
      blocks: [textBlock("image-right-text", 5, 10, 50, 80, 1, "Body copy goes here", 32, "left"), imageBlock("image-right-image", 60, 0, 40, 100, 2)],
      meta: CANVAS_META,
    },
    htmlContent: layoutHtml(
      "#ffffff",
      positionedDiv(5, 10, 50, 80, "display:flex;align-items:center;color:#0f172a;font-size:2vw;text-align:left;", "Body copy goes here") +
        positionedDiv(60, 0, 40, 100, "background-size:cover;background-position:center;", ""),
    ),
  },
  {
    name: "quote",
    orientation: "both",
    editorState: {
      version: 1,
      width: 1920,
      height: 1080,
      orientation: "landscape",
      background: { type: "color", value: "#111827" },
      blocks: [textBlock("quote-text", 10, 35, 80, 30, 1, "“Quote goes here”", 48)],
      meta: CANVAS_META,
    },
    htmlContent: layoutHtml(
      "#111827",
      positionedDiv(10, 35, 80, 30, "display:flex;align-items:center;justify-content:center;color:#fff;font-size:3vw;font-style:italic;text-align:center;", "&ldquo;Quote goes here&rdquo;"),
    ),
  },
  {
    name: "grid",
    orientation: "both",
    editorState: {
      version: 1,
      width: 1920,
      height: 1080,
      orientation: "landscape",
      background: { type: "color", value: "#ffffff" },
      blocks: [
        textBlock("grid-title", 5, 2, 90, 10, 1, "Title goes here", 40, "left"),
        imageBlock("grid-img-1", 5, 15, 42, 40, 2),
        imageBlock("grid-img-2", 53, 15, 42, 40, 3),
        imageBlock("grid-img-3", 5, 58, 42, 40, 4),
        imageBlock("grid-img-4", 53, 58, 42, 40, 5),
      ],
      meta: CANVAS_META,
    },
    htmlContent: layoutHtml(
      "#ffffff",
      positionedDiv(5, 2, 90, 10, "color:#0f172a;font-size:2.2vw;font-weight:600;", "Title goes here") +
        positionedDiv(5, 15, 42, 40, "background-size:cover;background-position:center;", "") +
        positionedDiv(53, 15, 42, 40, "background-size:cover;background-position:center;", "") +
        positionedDiv(5, 58, 42, 40, "background-size:cover;background-position:center;", "") +
        positionedDiv(53, 58, 42, 40, "background-size:cover;background-position:center;", ""),
    ),
  },
  {
    name: "lower-third",
    orientation: "both",
    editorState: {
      version: 1,
      width: 1920,
      height: 1080,
      orientation: "landscape",
      background: { type: "color", value: "#000000" },
      blocks: [
        imageBlock("lower-third-image", 0, 0, 100, 100, 1),
        textBlock("lower-third-text", 5, 78, 90, 18, 2, "Caption goes here", 40, "left"),
      ],
      meta: CANVAS_META,
    },
    htmlContent: layoutHtml(
      "#000000",
      positionedDiv(0, 0, 100, 100, "background-size:cover;background-position:center;", "") +
        positionedDiv(5, 78, 90, 18, "display:flex;align-items:center;color:#fff;font-size:2.2vw;background:linear-gradient(0deg,rgba(0,0,0,0.7),rgba(0,0,0,0));padding:0 2%;", "Caption goes here"),
    ),
  },
];

async function seedLayoutPresets() {
  await prisma.template.deleteMany({ where: { clientId: null, category: "layout-preset" } });
  await prisma.template.createMany({
    data: layoutPresets.map((preset) => ({
      clientId: null,
      name: preset.name,
      category: "layout-preset",
      orientation: preset.orientation,
      editorState: preset.editorState,
      htmlContent: preset.htmlContent,
      isLibrary: false,
    })),
  });
}

const DEV_SUPER_ADMIN_PASSWORD = "dev-password-change-me";

async function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  if (!email) return;

  const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);
  const passwordHash = await bcrypt.hash(DEV_SUPER_ADMIN_PASSWORD, rounds);

  await prisma.adminUser.upsert({
    where: { email },
    create: { email, passwordHash, clientId: null, name: "Super Admin" },
    update: {},
  });
}

async function main() {
  await seedPlans();
  await seedAppSettings();
  await seedPromptTemplates();
  await seedLayoutPresets();
  await seedSuperAdmin();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
