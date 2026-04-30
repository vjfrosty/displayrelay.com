---
description: "Use when implementing AI generation, prompt resolution, model selection, usage gating, generation logging, image provider calls, or cached provider searches for Display Relay."
name: "AI Generation Rules"
applyTo:
  - "lib/ai.ts"
  - "lib/prompts.ts"
  - "lib/usage.ts"
  - "lib/images/**"
---

# AI Generation Rules

- Never hardcode prompt text, model names, plan limits, or feature gates.
- Resolve prompts from the database with `resolvePrompt(slug, clientId)`.
- Use the resolved prompt's `defaultModel` rather than embedding a model name in code.
- Call `checkAndIncrement()` before outbound AI generation or image-provider calls.
- If usage was incremented and the outbound call fails, roll usage back with `decrementUsage()`.
- Write a `GenerationLog` row for every generation attempt.
- For JSON responses, parse safely and return a structured invalid JSON result instead of throwing raw parsing errors.
- For provider-backed image search, check cache before the outbound request and keep provider normalization provider-agnostic.
- Pull tenant variables such as `clientName` and `vertical` from the database, not directly from request input.
