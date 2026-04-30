# Display Relay

Display Relay is a self-hosted smart TV display platform built as a phased, Copilot-assisted implementation project.

This repository is currently the project control layer: architecture, runbooks, pinned stack decisions, and GitHub Copilot customization. It is not yet a fully generated Next.js application. The actual app files are expected to be created by working through the phase runbooks in order.

If you want to start "vibe coding" in this repo, do not begin by inventing folders or scaffolding from memory. Start from the orchestrator, use the correct custom agent, and implement only the currently staged task.

## What This Repo Contains Today

- The master build sequence in `docs/phases/ORCHESTRATOR.md`
- Six phase runbooks that define the implementation order and acceptance checks
- Copilot agent customizations in `.github/agents/`
- Targeted coding rules in `.github/instructions/`
- Architecture and vibe-coding source documents at the repo root
- Recommended concrete versions in `docs/recommended-tech-stack.md`

What does not exist yet:

- No `package.json`
- No `app/` directory
- No `prisma/` directory
- No `docker/` directory
- No generated runtime code

That is intentional. The repository is set up so those artifacts are created phase-by-phase instead of being hand-waved into existence.

## Source Of Truth

Use these files in this order:

1. `docs/phases/ORCHESTRATOR.md`
2. The currently active phase runbook in `docs/phases/`
3. `AGENTS.md`
4. The relevant files in `.github/instructions/`
5. The architecture document and vibe guide at the repo root

The orchestrator is the source of truth for:

- current phase
- current task
- dependencies
- validation gates
- which custom agent to use next

## Recommended Baseline

Use the pinned versions in `docs/recommended-tech-stack.md` when implementation starts.

Current baseline:

| Layer | Version |
|---|---|
| Node.js | 24.15.0 LTS |
| pnpm | 10.33.2 |
| Next.js | 16.2.4 |
| React | 19.2.5 |
| TypeScript | 6.0.3 |
| NextAuth.js | 4.24.14 |
| Prisma | 7.8.0 |
| PostgreSQL | 17.9 |
| Redis | 7.4.8 |
| Soketi | 1.6.1 |
| MinIO | `RELEASE.2025-09-07T16-13-09Z` |
| Nginx | 1.30.0 |

For Docker images, use exact tags and digests. Never use `latest`.

## Repository Structure

```text
displayrelay/
|-- .github/
|   |-- agents/
|   |   |-- ai.agent.md
|   |   |-- auth.agent.md
|   |   |-- canvas.agent.md
|   |   |-- infrastructure.agent.md
|   |   |-- real-time.agent.md
|   |   `-- ui.agent.md
|   `-- instructions/
|       |-- README.md
|       |-- ai-generation.instructions.md
|       |-- docker-pinning.instructions.md
|       |-- editor-contracts.instructions.md
|       |-- media-storage.instructions.md
|       |-- multi-tenancy.instructions.md
|       `-- realtime-cache.instructions.md
|-- docs/
|   |-- phases/
|   |   |-- ORCHESTRATOR.md
|   |   |-- phase-1-core.md
|   |   |-- phase-2-screens.md
|   |   |-- phase-3-editor.md
|   |   |-- phase-4-playlists-realtime.md
|   |   |-- phase-5-ai-pipeline.md
|   |   |-- phase-6-settings-billing.md
|   |   `-- results/
|   |       `-- README.md
|   |-- recommended-tech-stack.md
|   `-- tech-stack-assessment.md
|-- AGENTS.md
|-- Display Relay_Project Setup & Architecture.md
|-- display-platform-vibe-coding-guide.docx.md
`-- README.md
```

## What Each Area Does

| Path | Purpose |
|---|---|
| `AGENTS.md` | Global project rules that apply to the whole repo |
| `.github/agents/` | Role-based Copilot specialists for different kinds of work |
| `.github/instructions/` | Stable coding-rule files for recurring patterns |
| `docs/phases/ORCHESTRATOR.md` | Master execution hub for the whole build |
| `docs/phases/phase-*.md` | Step-by-step runbooks for each implementation phase |
| `docs/phases/results/README.md` | Template for required phase wrap-up reports |
| `docs/recommended-tech-stack.md` | Concrete package and service versions to pin |
| `docs/tech-stack-assessment.md` | Longer rationale behind stack and version choices |
| `Display Relay_Project Setup & Architecture.md` | Main architecture reference |
| `display-platform-vibe-coding-guide.docx.md` | Original AI-assisted build guide and task cards |

## The Copilot Split

This repo uses a strict split so Copilot has the right level of context:

- `AGENTS.md` = always-on project rules and workflow
- `.github/agents/` = who to be
- `.github/instructions/` = how to behave for specific code families
- `docs/` = what to build and in what order

Do not move phase runbooks into `.github/instructions/`. Phases are execution documents, not reusable coding rules.

## Available Custom Agents

Use the matching custom agent in VS Code before asking Copilot to implement a task:

| Agent | Use it for |
|---|---|
| `Infrastructure` | Docker, Prisma, seed data, settings utilities, prompt utilities, usage gates |
| `Auth` | NextAuth, middleware, multi-tenancy, bearer tokens, permission boundaries |
| `UI` | Admin pages, forms, dashboards, upload flows, lists, settings pages |
| `Canvas` | Slide editor, `EditorState`, rendering, drag/resize behavior, block controls |
| `Real-Time` | Soketi, SSE, playlist publishing, TV updates, heartbeat flows |
| `AI` | OpenRouter, prompt resolution, generation logging, image provider integrations |

## Targeted Instruction Files

These files exist so recurring rules are attached only when relevant:

| Instruction file | Covers |
|---|---|
| `multi-tenancy.instructions.md` | `clientId` scoping, route validation, cross-tenant safety |
| `ai-generation.instructions.md` | prompt resolution, model resolution, usage gating, generation logging |
| `realtime-cache.instructions.md` | Soketi, SSE behavior, publish-after-commit, cache invalidation |
| `media-storage.instructions.md` | MinIO key isolation, MIME validation, upload size enforcement |
| `editor-contracts.instructions.md` | `EditorState`, percentage positioning, sanitization, deterministic rendering |
| `docker-pinning.instructions.md` | exact image pins, digest discipline, no `latest` |

## Non-Negotiable Project Rules

These are the core constraints that shape every phase:

- prompts come from the database, not hardcoded strings
- model names come from prompt records, not constants
- plan limits and feature gates go through `lib/usage.ts`
- tenant queries must be scoped by `clientId`
- user-triggered real-time updates use Soketi, not polling
- settings and prompt writes must invalidate Redis cache
- Docker images must be pinned exactly

If Copilot generates code that violates one of these, reject it and correct the implementation.

## How To Start Vibe Coding In This Repo

This is the correct startup flow.

### 1. Open The Repo In VS Code

Open the `displayrelay` folder directly in VS Code.

Recommended tooling:

- VS Code
- GitHub Copilot and Copilot Chat
- Docker Desktop with Compose support
- Node.js 24.15.0 LTS
- pnpm 10.33.2

### 2. Read The Orchestrator First

Open `docs/phases/ORCHESTRATOR.md` before doing anything else.

That file tells you:

- what phase is active
- what task is active
- what must already exist
- which runbook to follow
- which custom agent to use
- what validation must pass before moving on

Do not skip this step.

### 3. Open The Active Runbook

After the orchestrator, open the active phase file in `docs/phases/`.

The runbook gives you:

- task inputs
- required outputs
- context sections to paste into Copilot
- ordered prompts
- common pitfalls
- done criteria
- validation checks before proceeding

### 4. Pick The Correct Agent In Copilot

Use the agent named by the orchestrator or the phase task. Do not stay on a generic agent if the task is clearly infrastructure, auth, AI, real-time, canvas, or UI work.

### 5. Load The Right Context

For each task, load only the context that task needs:

- the relevant section from `Display Relay_Project Setup & Architecture.md`
- the matching task card from `display-platform-vibe-coding-guide.docx.md`
- the active runbook from `docs/phases/`
- any relevant targeted instruction file from `.github/instructions/`

This keeps Copilot grounded and reduces incorrect scaffolding.

### 6. Implement Only The Current Task

Do not jump ahead and create future-phase files just because you know they will exist later.

Example:

- if the orchestrator says `Task 1.1`, build only Docker Compose, Nginx config, and env scaffolding
- do not start Prisma, auth, UI, editor, or AI files until their runbooks are active

This repo is designed around dependency order. Respect it.

### 7. Validate Before Advancing

Every task and phase has explicit acceptance checks. Run them before moving on.

Examples:

- `docker compose ps`
- `docker compose config`
- Prisma migration and seed checks
- route-level auth checks
- SSE connectivity checks
- AI usage-gate and logging checks

If validation fails, fix the current task first. Do not paper over it by proceeding.

### 8. Update The Orchestrator

When a task is truly done:

- check the task box in `docs/phases/ORCHESTRATOR.md`
- update the current state block
- rewrite the next-up block for the next staged task

When a full phase is done:

- create `docs/phases/results/phase-{N}-result.md`
- use `docs/phases/results/README.md` as the template
- record exactly what was validated and what still remains risky

## First Practical Starting Point

At the moment, the practical starting point is the orchestrated Phase 1 flow.

Start here:

1. Open `docs/phases/ORCHESTRATOR.md`
2. Open `docs/phases/phase-1-core.md`
3. Select the `Infrastructure` agent in Copilot
4. Use the architecture document sections requested by Task 1.1
5. Generate the initial runtime scaffolding for:
   - `docker/docker-compose.yml`
   - `docker/nginx/nginx.conf`
   - `.env.example`
6. Validate the stack with the runbook checks

That is the first real implementation step for this repo.

## What Will Be Created As You Progress

As you work through the runbooks, the repository is expected to grow into a normal application workspace with files such as:

- `docker/`
- `prisma/`
- `app/`
- `lib/`
- `types/`
- `components/`
- `public/`

Do not pre-create those directories without the matching phase task unless you are intentionally updating the runbook plan.

## Running The Project

Right now, there is no complete app to run because the implementation files have not been generated yet.

The correct interpretation is:

- this repo is ready to start building
- it is not yet ready for `pnpm install` or `pnpm dev`
- the first runnable milestone is created by Phase 1 Task 1.1 and later Phase 1 tasks

Once the actual app scaffold exists, the runbooks should be followed to add the real runtime commands and scripts.

## Working Style For This Repo

The intended working style is:

1. Read the orchestrator.
2. Open the active runbook.
3. Select the correct agent.
4. Load only the required context.
5. Implement the current task.
6. Validate it.
7. Update the orchestrator.
8. Move to the next task.

That is how this repo is meant to be vibe coded without losing architectural control.