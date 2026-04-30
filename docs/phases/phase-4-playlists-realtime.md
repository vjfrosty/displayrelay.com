# Phase 4 — Playlists, Schedules & Real-Time (Weeks 9–10)

Phase 4 connects authored content to live screens. Do the tasks in order shown: playlists first, then the SSE gateway, then the TV renderer. The real-time path depends on Soketi and on the SSE-safe Nginx configuration from Task 1.1.

## Phase 4 Dependencies

- Screen management from Task 2.1 working.
- Media assets from Task 2.2 available.
- `renderEditorHtml()` from Task 3.1 working for template playback.
- Soketi available from Task 1.1.

## Recommended Packages And Versions

Keep the Phase 1 platform baseline pinned. Add only the packages and services below for Phase 4 work.

| Package or service | Recommended version | Used for |
|---|---|---|
| `pusher` | 5.3.3 | Server-side Soketi publishing and subscription handling. |
| Soketi | 1.6.1 | Keep the Phase 1 pinned real-time service version. |
| Nginx | 1.30.0 | Keep the Phase 1 pinned proxy version with SSE-safe config. |

## Related Targeted Instructions

- `.github/instructions/realtime-cache.instructions.md` for Soketi, SSE keep-alives, publish-after-commit, and Redis invalidation rules.
- `.github/instructions/multi-tenancy.instructions.md` for tenant-safe playlist and screen ownership checks.

Keep the runbook focused on playlist flow, SSE implementation steps, and TV renderer validation. The reusable real-time policy now lives in the targeted instruction files.

## TASK 4.1 Playlists — CRUD + Assignment

**Copilot Agent:** `UI` + `Real-Time`  
**Context To Paste:** `Display Relay_Project Setup & Architecture.md` Section 12 (playlists) and Section 17 (playlist API routes).

**Inputs (what must exist first):**
- Phase 1 complete.
- Screen management working from Task 2.1.

**Outputs (what this task produces):**
- Full playlist CRUD API
- `POST /api/v1/clients/:clientId/playlists/:id/items`
- `POST /api/v1/clients/:clientId/playlists/:id/assign`
- `POST /api/v1/clients/:clientId/playlists/:id/publish`
- `/admin/playlists`

**Copilot prompts — paste these in sequence:**
1. Create all playlist API routes from Section 17. `PlaylistItem` has an `order` field, so implement a reorder endpoint.
2. Validate `PlaylistItem.itemType` against the enum: `media_asset`, `template`, `web_link`, `stream_url`, `google_reviews`.
3. Create `POST .../playlists/:id/publish` to set `status = "published"` and broadcast Soketi event `playlist.updated`.
4. Create `/admin/playlists` with Published and Draft badges and click-through to the playlist editor.
5. Create the playlist editor with drag-to-reorder, per-item duration, and preview thumbnails.

**Done when:**
- Create a playlist and add 3 items of different types, and all appear with correct thumbnails.
- Reorder items and verify the `order` field updates in the database.
- Assign a playlist to a screen and verify the screen detail view shows the playlist name.
- Publish a playlist and verify the Soketi event is broadcast.

**Common pitfalls:**
- Manage `PlaylistItem.order` with a gap strategy such as 10, 20, 30 so insertions do not require full renumbering.
- Assignment must validate that the playlist and screen belong to the same `clientId`.
- Broadcast the Soketi event only after the database commit succeeds.

**Validation before moving on:**
- Verify cross-tenant playlist assignment is rejected.
- Verify publishing emits `playlist.updated` only for the correct tenant channel.

---

## TASK 4.2 SSE Gateway — TV Real-Time Connection

**Copilot Agent:** `Real-Time`  
**Context To Paste:** `Display Relay_Project Setup & Architecture.md` Section 19 (Soketi SSE gateway) and Section 24 (screen polling strategy). This is the most technically tricky task in the phase.

**Inputs (what must exist first):**
- Task 4.1 complete.
- Soketi working.
- `lib/soketi.ts` exists.

**Outputs (what this task produces):**
- `GET /api/v1/clients/:clientId/events`
- SSE stream forwarding `playlist.updated`
- Keep-alive comment every 25 seconds

**Copilot prompts — paste these in sequence:**
1. Create `GET /api/v1/clients/:clientId/events` as a streaming route using a Next.js `ReadableStream` response.
2. Return `new Response(new ReadableStream({ start(controller) { ... } }), { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" } })`.
3. Subscribe inside the stream to Soketi channel `client-{clientId}` using the Pusher server library and forward events to the SSE stream as `data: {JSON}\n\n`.
4. Add a keep-alive timer sending `: keep-alive\n\n` every 25 seconds.
5. On client disconnect, unsubscribe from Soketi and clear the timer.
6. Test by opening the URL in a browser and verifying a persistent connection in the Network tab.

**Done when:**
- `curl -N http://localhost:3000/api/v1/clients/demo/events` keeps the connection open.
- Triggering a playlist update causes an event to appear in the SSE stream within 1 second.
- Killing the curl process leaves no leaking Soketi subscription.

**Common pitfalls:**
- Next.js App Router cannot use node-style `res.write()` for this flow. Use `ReadableStream`.
- The Nginx `proxy_buffering off` change from Task 1.1 is required or SSE never reaches the client.
- Use the `pusher` npm package for Soketi server publishing, not the browser `pusher-js` client package.

**Validation before moving on:**
- Verify the keep-alive comment prevents proxy idle timeout.
- Verify disconnect cleanup unsubscribes from the tenant channel.

---

## TASK 4.3 TV Screen Renderer

**Copilot Agent:** `Real-Time` + `UI`  
**Context To Paste:** `Display Relay_Project Setup & Architecture.md` Section 18 (TV screen routes) and Section 24 (polling strategy). This is the `/screens/:clientId/:screenId` display surface.

**Inputs (what must exist first):**
- Tasks 4.1 and 4.2 complete.
- Playlist system working.
- `renderEditorHtml()` from Task 3.1 working.

**Outputs (what this task produces):**
- `app/screens/[clientId]/[screenId]/page.tsx`
- Playlist loop with configurable durations
- SSE subscription reacting to live updates
- Screen heartbeat path updating `last_seen_at`

**Copilot prompts — paste these in sequence:**
1. Create `app/screens/[clientId]/[screenId]/page.tsx` as a Client Component that fetches the assigned playlist on mount.
2. Implement the content loop so `PlaylistItems` are shown for their configured duration and then loop back to the beginning.
3. Connect to SSE so `playlist.updated` re-fetches the playlist and restarts the loop.
4. Add a heartbeat every 30 seconds calling `PATCH /api/v1/clients/:clientId/screens/:screenId` with `{ lastSeenAt: new Date() }`.
5. Render template items with `srcdoc` iframes, media items with `img` or `video`, and `web_link` items with an iframe.

**Done when:**
- A TV at `/screens/demo/lobby` shows playlist content cycling correctly.
- Editing and publishing a playlist in admin updates the TV within 2 seconds.
- The screen status in admin shows Online after heartbeat activity.

**Common pitfalls:**
- Template `htmlContent` belongs in `srcdoc`, not `src`, to avoid same-origin issues.
- Use a ref to reset the loop index on SSE update.
- Heartbeats can create too many DB writes. Buffer through Redis and flush on a schedule if needed.

**Validation before closing the phase:**
- Verify a publish event updates the live screen without manual reload.
- Verify heartbeat changes status visibility in admin.

## Phase 4 Completion Gate

Do not move to Phase 5 until all of the following are true:

- Playlist CRUD, reorder, assignment, and publish flows are verified.
- `playlist.updated` broadcasts are emitted after publish.
- SSE connections stay open, deliver updates, and clean up on disconnect.
- The TV renderer updates within 2 seconds of publish and heartbeat visibility is confirmed.
- `docs/phases/results/phase-4-result.md` is generated with architecture, validation results, and follow-up notes.