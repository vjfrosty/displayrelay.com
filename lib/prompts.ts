import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { redis } from "./redis";

const PROMPT_CACHE_TTL_SECONDS = 300;

export type ResolvedPrompt = {
  slug: string;
  name: string;
  category: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: Prisma.JsonValue;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  responseFormat: string;
};

function promptCacheKey(slug: string, clientId?: string): string {
  return clientId ? `prompt:${clientId}:${slug}` : `prompt:global:${slug}`;
}

export async function resolvePrompt(slug: string, clientId?: string): Promise<ResolvedPrompt> {
  const cacheKey = promptCacheKey(slug, clientId);
  const cached = await redis.get(cacheKey);
  if (cached !== null) return JSON.parse(cached) as ResolvedPrompt;

  const base = await prisma.promptTemplate.findUnique({ where: { slug } });
  if (!base) throw new Error(`Prompt template not found: ${slug}`);

  let resolved: ResolvedPrompt = {
    slug: base.slug,
    name: base.name,
    category: base.category,
    systemPrompt: base.systemPrompt,
    userPromptTemplate: base.userPromptTemplate,
    variables: base.variables,
    defaultModel: base.defaultModel,
    temperature: base.temperature,
    maxTokens: base.maxTokens,
    responseFormat: base.responseFormat,
  };

  if (clientId) {
    const override = await prisma.tenantPromptOverride.findUnique({
      where: { clientId_promptSlug: { clientId, promptSlug: slug } },
    });
    if (override) {
      resolved = {
        ...resolved,
        systemPrompt: override.systemPrompt ?? resolved.systemPrompt,
        userPromptTemplate: override.userPromptTemplate ?? resolved.userPromptTemplate,
        temperature: override.temperature ?? resolved.temperature,
        maxTokens: override.maxTokens ?? resolved.maxTokens,
        defaultModel: override.defaultModel ?? resolved.defaultModel,
      };
    }
  }

  await redis.setex(cacheKey, PROMPT_CACHE_TTL_SECONDS, JSON.stringify(resolved));
  return resolved;
}

// Handlebars-style {{var}} substitution. Missing variables render as "" rather than throwing.
export function renderPrompt(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ""));
}
