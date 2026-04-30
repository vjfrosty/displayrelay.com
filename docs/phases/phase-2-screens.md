# Phase 2 — Screens, Media & Basic Admin UI (Week 3–4)

Phase 2 depends on Phase 1 being complete. Do Task 2.1 before Task 2.2 so the screen-management flow is stable before you build the media workflows that feed later phases. Do not move to Phase 3 until the Phase 2 completion gate passes.

## Phase 2 Dependencies

- Phase 1 complete.
- Auth and tenant scoping from Task 1.5 working.
- Redis available for pairing codes.
- MinIO from Task 1.1 and runtime settings from Task 1.4 available.

## Recommended Packages And Versions

Keep the Phase 1 platform baseline pinned. Add only the packages and services below for Phase 2 work.

| Package or service | Recommended version | Used for |
|---|---|---|
| `@aws-sdk/client-s3` | 3.1039.0 | S3-compatible MinIO upload, delete, list, and URL helpers in `lib/storage.ts`. |
| `qrcode.react` | 4.2.0 | Pairing QR code rendering on `/pair`. |
| MinIO | `RELEASE.2025-09-07T16-13-09Z` | Keep the Phase 1 pinned object-storage version for uploads and file serving. |
| Redis | 7.4.8 | Keep using Redis for single-use pairing codes. |

## Related Targeted Instructions

- `.github/instructions/media-storage.instructions.md` for MinIO key structure, MIME validation, and upload-size rules.
- `.github/instructions/multi-tenancy.instructions.md` for tenant-safe route handling and resource ownership checks.

Keep the runbook focused on pairing flow, upload flow, UI outputs, and validation steps. The reusable storage and tenancy rules now live in the targeted instruction files.

## TASK 2.1 Screen Management — Pairing + List

**Copilot Agent:** `Auth` + `UI`  
**Context To Paste:** `Display Relay_Project Setup & Architecture.md` Section 10 (screen management), Section 2.1 (screen status model), and Section 3.1 (feature list). Focus on P1 features only.

**Inputs (what must exist first):**
- Phase 1 complete.
- Auth working from Task 1.5.

**Outputs (what this task produces):**
- `lib/pairing.ts`
- `GET /api/v1/clients/:clientId/screens`
- `POST /api/v1/clients/:clientId/screens`
- `PATCH /api/v1/clients/:clientId/screens/:screenId`
- `DELETE /api/v1/clients/:clientId/screens/:screenId`
- `POST /api/v1/pair/request`
- `/pair` page
- `/admin/screens` page

**Copilot prompts — paste these in sequence:**
1. Create `lib/pairing.ts`: `generateCode()` creates a 6-digit code, stores `{ clientId, screenId }` in Redis with `PAIRING_CODE_TTL_SECONDS` TTL, and `consumeCode(code)` validates and deletes it.
2. Create `GET /api/v1/clients/:clientId/screens` returning all screens for the client. Add `PATCH` and `DELETE` for individual screens.
3. Create `POST /api/v1/pair/request` so the TV calls this with a code and receives back a `clientId` and a bearer token.
4. Create `/pair` page (`app/pair/page.tsx`) that shows a 6-digit code, a QR code, and polls every 3 seconds for pairing completion.
5. Create `/admin/screens` showing the screen list with status badges: Online = green, Offline = red, Sleeping = blue, Ready = yellow.

**Done when:**
- TV visits `/pair` and sees a 6-digit code.
- Admin generates a code, the TV enters it, and the screen appears in `/admin/screens`.
- Screen status is calculated correctly from the last heartbeat timestamp.

**Common pitfalls:**
- QR code rendering needs browser canvas. Use `qrcode.react` and keep the `/pair` page as a Client Component.
- Pairing codes must be deleted from Redis after consumption. They are single-use only.
- Screen status is derived from `last_seen_at`; do not store a separate status column and trust it.

**Validation before moving on:**
- Pairing code cannot be reused after a successful pairing.
- Create clients A and B, add a screen to A, and verify B's list is empty.

---

## TASK 2.2 Media Library — Upload to MinIO

**Copilot Agent:** `Infrastructure` + `UI`  
**Context To Paste:** `Display Relay_Project Setup & Architecture.md` Section 11 and the `lib/storage.ts` pattern. MinIO is S3-compatible, so use the AWS SDK.

**Inputs (what must exist first):**
- Phase 1 complete.
- MinIO running from Task 1.1.
- `MINIO_*` environment variables set.

**Carry-forward Docker image pin:**

Keep using the exact MinIO image pin from Task 1.1 while building this task:

- `minio/minio:RELEASE.2025-09-07T16-13-09Z@sha256:<fill-me>`

Do not switch this task to `minio/minio:latest` or a major-only tag.

**Outputs (what this task produces):**
- `lib/storage.ts` with `upload`, `deleteFile`, `listFiles`, and `getPublicUrl`
- `POST /api/v1/clients/:clientId/media`
- `GET /api/v1/clients/:clientId/media`
- `DELETE /api/v1/clients/:clientId/media/:assetId`
- `/admin/media` page

**Copilot prompts — paste these in sequence:**
1. Create `lib/storage.ts` using `@aws-sdk/client-s3`. Implement `upload(buffer, mimeType, key)`, `deleteFile(key)`, `listFiles(prefix)`, and `getPublicUrl(key)`.
2. Create `POST /api/v1/clients/:clientId/media` to accept `multipart/form-data`, validate MIME type against `media.allowed_mime_types`, check storage quota and upload size, and upload to `clients/{clientId}/{folder}/{uuid}.{ext}`.
3. Create `GET /api/v1/clients/:clientId/media` with `folder`, `search`, and `sort` query params, and return paginated results.
4. Create `DELETE /api/v1/clients/:clientId/media/:assetId` to remove both the MinIO object and the database row.
5. Create `/admin/media` with drag-and-drop upload, folder tree sidebar, grid view with thumbnails, and a file details panel.

**Done when:**
- Upload a 1MB PNG and it appears in the grid with a thumbnail.
- Upload a file type not in `allowed_mime_types` and receive a `415` response.
- Delete a file and verify it is removed from both MinIO and the database.

**Common pitfalls:**
- MinIO paths must include `clientId` or tenants can overwrite each other's files.
- Check file size against `media.max_upload_mb` before uploading, not after.
- Video thumbnails need `ffmpeg`; use a placeholder thumbnail initially.
- Changing the MinIO image tag during media-work debugging can create false positives. Keep the Task 1.1 image pin stable while validating uploads.

**Validation before Phase 3:**
- Create clients A and B, upload media to A, and verify B cannot see it.
- MIME validation returns `415` for unsupported files.
- Oversized files are rejected before upload begins.

## Phase 2 Completion Gate

Do not move to Phase 3 until all of the following are true:

- Cross-tenant screens isolation is verified.
- Cross-tenant media isolation is verified.
- Pairing codes expire correctly and cannot be reused.
- Media MIME validation is enforced.
- Media file size validation is enforced before upload.
- `docs/phases/results/phase-2-result.md` is generated with architecture, validation results, and follow-up notes.