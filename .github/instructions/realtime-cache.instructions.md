---
description: "Use when implementing Soketi, SSE routes, publish events, heartbeats, settings writes, prompt writes, or Redis cache invalidation in Display Relay."
name: "Real-Time And Cache Rules"
applyTo:
  - "lib/soketi.ts"
  - "lib/settings.ts"
  - "lib/prompts.ts"
---

# Real-Time And Cache Rules

- Real-time user-triggered updates must use Soketi, not polling.
- On the server, use the `pusher` package for Soketi-compatible publishing and subscriptions, not `pusher-js`.
- Emit publish/update events only after the database commit succeeds.
- SSE responses must set `Content-Type: text/event-stream`, `Cache-Control: no-cache`, and `Connection: keep-alive`.
- Send a keep-alive comment regularly so proxies do not close the stream.
- On disconnect, unsubscribe and clean up timers/subscriptions.
- After DB writes to settings or prompts, invalidate Redis cache keys immediately with `redis.del(cacheKey)`.
- Keep Nginx `proxy_buffering off` for SSE paths.
