# Display Platform AI Agent Instructions

You are helping build Display Platform, a self-hosted smart TV display system.

## 🛠 Tech Stack
- Next.js 14 App Router, TypeScript
- Prisma ORM, PostgreSQL
- Redis
- Soketi (real-time)
- MinIO (assets)
- OpenRouter (AI)
- Auth: NextAuth.js
- Package manager: pnpm

## 🥇 The Golden Rules
1. **Never hardcode prompt text.** Always resolve from PromptTemplate via `resolvePrompt(slug, clientId)`.
2. **Never hardcode model names.** They come from the resolved prompt's `defaultModel` field.
3. **Never hardcode plan limits.** Always call `checkAndIncrement()` from `lib/usage.ts`.
4. **Never hardcode feature gates.** Always call `checkFeature()` from `lib/usage.ts`.
5. **All tenant queries must be scoped.** Use `scopedPrisma(clientId)` from `lib/tenant.ts`. Never use the global prisma import in route handlers.
6. **Real-time means Soketi.** Never use polling for user-triggered updates.
7. **Redis Caching Hygiene:** Always call `redis.del(cacheKey)` after DB writes for settings or prompts.

## 📖 Project Phasing & Master Orchestrator
To avoid losing context, the build is strictly orchestrated:
- **Mandatory:** Before starting any work, you MUST read `docs/phases/ORCHESTRATOR.md` to know the current status, the active task, and the required context to load.
- **Mandatory:** After completing a task, you MUST update `docs/phases/ORCHESTRATOR.md` with the new status, mark the task as done, and stage the next task.
- **Mandatory:** After completing an entire phase, you MUST write a phase result document summarizing the architecture created, db changes, and validation results. Save this to `docs/phases/results/phase-{N}-result.md`.

## 🧭 Customization Split
- `AGENTS.md` contains the always-on global rules and workflow.
- `.github/instructions/` contains targeted coding rules for specific file families and recurring task types.
- `.github/agents/` contains role-based specialists for vibe coding.
- `docs/` remains the human reference layer for architecture, runbooks, and phase execution detail.

## 🤖 Available Custom Agents
Use the custom agents in the Copilot agent picker to adopt the correct specialist for the task at hand:
- `Infrastructure` - Prisma, Docker, DB setup
- `Auth` - NextAuth, multi-tenancy, middleware
- `Real-Time` - Soketi, SSE, websockets
- `AI` - OpenRouter, prompt resolution
- `Canvas` - editor state and rendering
- `UI` - Next.js RSCs, Tailwind, forms