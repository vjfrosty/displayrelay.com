# Targeted Instructions

This folder is the targeted coding-rules layer for GitHub Copilot in this workspace.

Use the workspace split below:

- `AGENTS.md` = global project rules and workflow
- `.github/instructions` = focused coding rules for specific file families or recurring tasks
- `.github/agents` = role-based specialists for vibe coding
- `docs/` = human reference, runbooks, and architecture notes

## Files

| File | Covers | Attachment strategy |
|---|---|---|
| `multi-tenancy.instructions.md` | tenant scoping, route validation, cross-tenant safety | auto-attach for API/auth entry points plus description discovery |
| `ai-generation.instructions.md` | prompt resolution, usage gating, generation logging, provider rules | stable AI library files plus description discovery |
| `realtime-cache.instructions.md` | Soketi, SSE, publish-after-commit, Redis invalidation | stable real-time/cache files plus description discovery |
| `media-storage.instructions.md` | MinIO path isolation, MIME checks, upload-size rules | media/storage files |
| `editor-contracts.instructions.md` | EditorState invariants, purity, sanitization, percentages | editor files |
| `docker-pinning.instructions.md` | exact image pins, no `latest`, digest discipline | Docker and compose files |

## Rules For This Folder

- Keep each instruction file focused on one rule cluster.
- Prefer selective `applyTo` patterns over broad attachment.
- Do not use `applyTo: "**"` here.
- Keep architecture explanation in `docs/`, not in instruction files.
- Do not mirror `docs/phases/phase-*.md` one-for-one in this folder. Phases remain execution runbooks in `docs/`; instruction files are only for stable reusable coding rules.
