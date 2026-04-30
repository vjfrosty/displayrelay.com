# Recommended Tech Stack

Updated: 2026-04-30

Use this as the implementation baseline if development starts now. These are advised concrete versions, chosen after a public advisory check and current-release lookup.

## Recommended Versions

| Layer | Recommended version |
|---|---|
| Node.js | 24.15.0 LTS |
| pnpm | 10.33.2 |
| Next.js | 16.2.4 |
| React | 19.2.5 |
| TypeScript | 6.0.3 |
| NextAuth.js | 4.24.14 |
| Prisma CLI | 7.8.0 |
| `@prisma/client` | 7.8.0 |
| Tailwind CSS | 4.2.4 |
| Fabric.js | 7.3.1 |
| PostgreSQL | 17.9 |
| Redis | 7.4.8 |
| Soketi | 1.6.1 |
| MinIO | `RELEASE.2025-09-07T16-13-09Z` |
| Nginx | 1.30.0 |
| OpenRouter API | `v1` |
| Pexels API | current REST API |
| Docker image policy | pin exact tag and digest, never `latest` |

## Short Notes

- Prefer Next.js 16 over the older Next.js 14 target in the architecture spec.
- Prefer PostgreSQL 17.9 over PostgreSQL 15 for a fresh build.
- Keep Redis on the stable 7.4.x line unless you explicitly validate Redis 8 behavior.
- Do not use `quay.io/soketi/soketi:latest` or any other `latest` tag in production.
- Treat Fabric.js content as untrusted and sanitize SVG/HTML flows aggressively.

## Implementation Rule

When you create the actual project files, pin these exact package versions in `package.json` and pin exact image tags plus digests in Docker Compose.