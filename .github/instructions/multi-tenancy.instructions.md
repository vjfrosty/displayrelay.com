---
description: "Use when writing multi-tenant route handlers, auth helpers, tenant-scoped queries, or API validation for Display Relay. Covers scopedPrisma(clientId), client ownership checks, and cross-tenant safety."
name: "Multi-Tenancy Rules"
applyTo:
  - "app/api/**"
  - "app/**/route.ts"
  - "lib/tenant.ts"
  - "lib/auth.ts"
  - "app/middleware.ts"
  - "middleware.ts"
---

# Multi-Tenancy Rules

- Scope every tenant-owned read and write to `clientId`.
- In route handlers, use `scopedPrisma(clientId)` rather than a global tenant-unaware Prisma client.
- Validate that the authenticated session or bearer token belongs to the requested `clientId` before reading or mutating data.
- Reject cross-tenant assignment, lookup, and restore flows even when the IDs look valid.
- Use Zod for request validation.
- Source tenant identity from trusted route/session context, not from an arbitrary request body field alone.

Prefer this shape in tenant-aware handlers:

```ts
const prisma = scopedPrisma(clientId)
```
