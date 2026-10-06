import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "./db";
import { redis } from "./redis";
import { resolvePrompt } from "./prompts";

const TEST_CLIENT_ID = "test-client-prompts-integration";

afterAll(async () => {
  await prisma.tenantPromptOverride.deleteMany({ where: { clientId: TEST_CLIENT_ID } });
  await prisma.$disconnect();
  await redis.quit();
});

describe("resolvePrompt", () => {
  it("resolves a seeded global prompt template", async () => {
    const prompt = await resolvePrompt("slide.generate");
    expect(prompt.systemPrompt.length).toBeGreaterThan(0);
    expect(prompt.defaultModel).toBe("anthropic/claude-3.5-sonnet");
  });

  it("merges a partial tenant override with ?? so unset fields keep the base value", async () => {
    await prisma.tenantPromptOverride.create({
      data: { clientId: TEST_CLIENT_ID, promptSlug: "slide.generate", temperature: 0.05 },
    });

    const base = await resolvePrompt("slide.generate");
    const overridden = await resolvePrompt("slide.generate", TEST_CLIENT_ID);

    expect(overridden.temperature).toBe(0.05);
    expect(overridden.systemPrompt).toBe(base.systemPrompt);
    expect(overridden.userPromptTemplate).toBe(base.userPromptTemplate);
  });
});
