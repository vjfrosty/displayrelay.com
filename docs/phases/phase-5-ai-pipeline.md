# Phase 5 — AI Generation Pipeline (Weeks 11–13)

Phase 5 adds the production AI path. Every generation must resolve prompts from the database, enforce usage gates, and log the outcome. Do these tasks in order so the lower-level AI client exists before you build generation endpoints and the image provider layer.

## Phase 5 Dependencies

- `lib/prompts.ts` from Task 1.4 working.
- `lib/usage.ts` from Task 1.6 working.
- Seed data from Task 1.3 present for prompt templates.
- OpenRouter and Pexels keys available where required.

## Recommended Packages And Integrations

Keep the Phase 1 platform baseline pinned. Add or pin only the integrations below for Phase 5 work.

| Package or integration | Recommended version | Used for |
|---|---|---|
| OpenRouter API | `v1` | AI generation calls in `lib/ai.ts`. |
| Pexels API | current REST API | Image search provider in Task 5.3. |

## Related Targeted Instructions

- `.github/instructions/ai-generation.instructions.md` for prompt resolution, usage gating, generation logging, retry, provider calls, and cached image search rules.
- `.github/instructions/multi-tenancy.instructions.md` for tenant-safe generation and image-search routes.

## Phase-Specific Notes

- Use direct `fetch` calls for OpenRouter and Pexels unless a later SDK adds a clear operational advantage.

## TASK 5.1 `lib/ai.ts` — OpenRouter Integration

**Copilot Agent:** `AI`  
**Context To Paste:** `Display Relay_Project Setup & Architecture.md` Section 27 (OpenRouter) and Section 5.5 (prompt resolution). This is the core AI generation function.

**Inputs (what must exist first):**
- Tasks 1.4 and 1.6 complete.
- `OPENROUTER_API_KEY` set.

**Outputs (what this task produces):**
- `lib/ai.ts`
- `generateWithPrompt(slug, variables, clientId?)`
- `GenerationLog` written for every call
- Usage rollback on failure

**Copilot prompts — paste these in sequence:**
1. Create `lib/ai.ts` exactly matching Section 27. The function must: resolve the prompt, render system and user prompts, call OpenRouter, and parse the response based on `responseFormat`.
2. Add a `GenerationLog` row after every call with `model`, `promptSlug`, `promptTokens`, `outputTokens`, `durationMs`, `success`, and `error`.
3. If `checkAndIncrement()` succeeds but the OpenRouter call throws, call `decrementUsage()` in the catch block.
4. For `responseFormat === "json"`, wrap `JSON.parse` in a try/catch and return `{ error: "invalid_json", raw: content }` on parse failure.
5. Add retry logic for `429` rate limits: wait 2 seconds and retry once.

**Done when:**
- Calling `generateWithPrompt("slide.generate", vars, clientId)` returns parsed JSON.
- A `GenerationLog` row is written after every call.
- If the API key is wrong, an error value is returned and usage is rolled back.

**Common pitfalls:**
- OpenRouter returns `choices[0].message.content` as a string even for JSON output. Parse the string.
- Set `response_format: { type: "json_object" }` when you expect JSON or models may return markdown-wrapped output.
- `data.usage` may be absent, so guard token access.

**Validation before moving on:**
- Delete or break the API key and confirm usage rollback still happens.
- Verify a missing prompt does not fall back to a hardcoded string.

---

## TASK 5.2 Slide + Announcement Generation APIs

**Copilot Agent:** `AI`  
**Context To Paste:** `Display Relay_Project Setup & Architecture.md` Section 25 (slide generation) and Section 17 (API routes). This is the first user-facing AI feature set.

**Inputs (what must exist first):**
- Task 5.1 complete.
- Seed data includes `slide.generate` and `announcement.generate` prompts from Task 1.3.

**Outputs (what this task produces):**
- `POST /api/v1/clients/:clientId/slides/generate`
- `POST /api/v1/clients/:clientId/announcements/generate`
- Usage gating before generation

**Copilot prompts — paste these in sequence:**
1. Create `POST /api/v1/clients/:clientId/slides/generate` using `checkAndIncrement(clientId, "ai_slides")`, tenant settings, and `generateWithPrompt("slide.generate", vars, clientId)`.
2. Create `POST /api/v1/clients/:clientId/announcements/generate` using the same pattern with `announcement.generate` and `ai_announcements`.
3. If usage is blocked, return `429` with `{ error: "usage_limit_reached", upgradeUrl }`.
4. Write an integration test with mocked OpenRouter fetch and verify `GenerationLog` is written.

**Done when:**
- `POST /slides/generate` returns structured slide JSON.
- The 11th Essential-plan slide generation call returns `429`.
- `GenerationLog` rows are created after successful generation.

**Common pitfalls:**
- Variables must include every key required by the prompt template's `variables` JSON field.
- `clientName` and `vertical` must come from the database, not directly from the request body.
- Usage check and increment must be atomic for concurrent requests.

**Validation before moving on:**
- Verify blocked usage returns `429` instead of partially generating content.
- Verify removing the prompt row causes a prompt-not-found error rather than a hardcoded fallback.

---

## TASK 5.3 Image Search + Pexels Provider

**Copilot Agent:** `AI`  
**Context To Paste:** `Display Relay_Project Setup & Architecture.md` Section 26 (image provider system) and Section 14.3 (inline image search). Pexels is the first provider.

**Inputs (what must exist first):**
- Task 1.4 complete.
- `PEXELS_API_KEY` set.
- `image_cache` table exists from Task 1.2.

**Outputs (what this task produces):**
- `types/image.ts`
- `lib/images/pexels.ts`
- `lib/images/normalize.ts`
- `POST /api/v1/clients/:clientId/image/search`
- 24-hour cached provider search with attribution

**Copilot prompts — paste these in sequence:**
1. Define `SlideImage` in `types/image.ts` with `id`, `url`, `thumbnailUrl`, `width`, `height`, `photographer`, `photographerUrl`, `provider`, and `attributionText`.
2. Create `lib/images/pexels.ts` to call Pexels and map the response into `SlideImage[]`.
3. Create `lib/images/normalize.ts` implementing `normalizeProviderResult(raw, provider)`.
4. Create `POST /api/v1/clients/:clientId/image/search` that checks `checkAndIncrement("image_searches")`, checks `image_cache`, calls Pexels on cache miss, and stores the result with 24-hour TTL.
5. Respect `getSetting("ai.image_provider", clientId)` and route only to the implemented provider.

**Done when:**
- Searching `mountain sunrise` returns 10 `SlideImage` results with attribution.
- Repeating the same search within 24 hours hits the cache.
- The 21st Essential-plan search returns `429`.

**Common pitfalls:**
- Always check cache before calling Pexels or rate limits will hurt quickly.
- Attribution is required for Pexels images and must be available to the renderer.
- `normalizeProviderResult()` must stay provider-agnostic enough for future providers.

**Validation before closing the phase:**
- Verify attribution text is present in the normalized output.
- Verify image-search usage is gated before the provider call.

## Phase 5 Completion Gate

Do not move to Phase 6 until all of the following are true:

- `generateWithPrompt()` resolves prompts from DB, parses output, and logs every call.
- Usage rollback is verified for failed AI calls.
- Slide and announcement endpoints enforce `429` limits correctly.
- Image search is usage-gated, cached, and returns attribution.
- `docs/phases/results/phase-5-result.md` is generated with architecture, validation results, and follow-up notes.