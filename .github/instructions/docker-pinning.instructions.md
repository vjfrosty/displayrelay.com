---
description: "Use when editing Docker Compose files, Dockerfiles, container image references, environment examples, or service-version pins for Display Relay."
name: "Docker Pinning Rules"
applyTo:
  - "docker/**"
  - "**/docker-compose*.yml"
  - "Dockerfile*"
  - ".env.example"
---

# Docker Pinning Rules

- Never use `latest` for application infrastructure images.
- Do not use major-only tags like `postgres:17` or `redis:7` in shared environments.
- Pin exact tags and add digest placeholders or final digests before deployment.
- Keep service images stable while debugging a task so version drift does not hide real issues.
- Validate rendered compose output before deploy and confirm there are no `latest` tags or unreviewed image upgrades.

Current baseline examples:

- `node:24.15.0-bookworm-slim@sha256:<fill-me>`
- `postgres:17.9-bookworm@sha256:<fill-me>`
- `redis:7.4.8-alpine@sha256:<fill-me>`
- `minio/minio:RELEASE.2025-09-07T16-13-09Z@sha256:<fill-me>`
- `nginx:1.30.0-alpine@sha256:<fill-me>`

For Soketi, keep the tested Quay tag plus a digest and do not switch to `latest`.
