---
description: "Use when implementing MinIO storage helpers, media upload routes, media delete flows, MIME validation, or tenant-isolated object keys for Display Relay."
name: "Media Storage Rules"
applyTo:
  - "lib/storage.ts"
  - "app/api/**/media/**"
---

# Media Storage Rules

- Store every object under a tenant-isolated prefix such as `clients/{clientId}/...`.
- Validate MIME type before upload starts.
- Validate upload size before the first byte is sent to MinIO.
- Read upload limits from settings or the database rather than hardcoded constants when that config exists.
- Keep object keys deterministic enough for cleanup, but unique enough to prevent collisions.
- Delete the storage object and the database row as one logical operation.
- Do not expose the MinIO console as part of normal application flows.
