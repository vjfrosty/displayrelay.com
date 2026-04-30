# Phase 6 — Settings UI, Billing & Polish (Weeks 14–16)

Phase 6 closes the loop on tenant controls and monetization. Finish settings and prompt editing before billing polish so the final admin experience reflects the same database-driven configuration model used everywhere else.

## Phase 6 Dependencies

- Phase 1 settings and prompts infrastructure complete.
- Usage and subscription tables available.
- Stripe keys configured for billing work.
- AI generation and usage summary flows available for prompt and dashboard verification.

## Recommended Packages And Versions

Keep the Phase 1 platform baseline pinned. Add only the packages and services below for Phase 6 work.

| Package or service | Recommended version | Used for |
|---|---|---|
| `stripe` | 22.1.0 | Checkout, webhook verification, and customer portal flows. |
| `next-auth` | 4.24.14 | Keep the Phase 1 auth baseline for settings permission boundaries. |
| Redis | 7.4.8 | Continue using Redis-backed settings and prompt cache invalidation. |

## Related Targeted Instructions

- `.github/instructions/multi-tenancy.instructions.md` for tenant-versus-global permission boundaries and route validation.
- `.github/instructions/realtime-cache.instructions.md` for Redis cache invalidation after settings and prompt writes.
- `.github/instructions/ai-generation.instructions.md` for prompt-template and model-resolution rules that the settings UI must preserve.

## Phase-Specific Notes

- Verify Stripe webhooks against the raw request body; do not parse the body before signature verification.

## TASK 6.1 Admin Settings — Prompts + General

**Copilot Agent:** `Auth` + `UI`  
**Context To Paste:** `Display Relay_Project Setup & Architecture.md` Section 5.6 (settings UI) and the `/admin/settings/prompts` and `/admin/settings/general` requirements.

**Inputs (what must exist first):**
- Phase 1 complete.
- Settings and prompts stored in the database.

**Outputs (what this task produces):**
- `/admin/settings/general`
- `/admin/settings/prompts`
- `PATCH /api/v1/clients/:clientId/settings/:key`
- `PATCH /api/v1/admin/prompts/:slug`

**Copilot prompts — paste these in sequence:**
1. Create `/admin/settings/general` with fields for tenant name, city, vertical, and timezone.
2. Create `/admin/settings/prompts` listing prompt templates with edit actions.
3. Build the prompt edit view with two textareas, temperature and maxTokens controls, and a model selector. Persist tenant edits to `TenantPromptOverride` and super-admin edits to `PromptTemplate`.
4. Create `PATCH /api/v1/clients/:clientId/settings/:key` validating overridable keys, writing `TenantSetting`, and invalidating Redis cache.
5. Create `PATCH /api/v1/admin/prompts/:slug` for super-admin use only, writing directly to `PromptTemplate`.

**Done when:**
- Editing a prompt temperature changes the next generation behavior immediately.
- Non-super-admin users can edit tenant overrides but not the global prompt template.
- Redis cache is cleared after settings save.

**Common pitfalls:**
- Add a Reset To Default action that deletes the `TenantPromptOverride` row.
- Variable names in prompt editing must stay aligned with the `variables` JSON field.
- Use temperature slider step `0.05`, not `0.1`.

**Validation before moving on:**
- Verify tenant users cannot write global prompt changes.
- Verify prompt and settings edits are visible on the next read without stale cache.

---

## TASK 6.2 Billing — Stripe + Usage Dashboard

**Copilot Agent:** `Infrastructure` + `UI`  
**Context To Paste:** `Display Relay_Project Setup & Architecture.md` Section 4.5 (Stripe events) and Section 5.6 billing settings page.

**Inputs (what must exist first):**
- Phase 1 complete.
- Stripe keys set in env.
- `Subscription` and `UsageRecord` tables exist.

**Outputs (what this task produces):**
- `POST /api/v1/billing/checkout`
- `POST /api/v1/billing/webhook`
- `GET /api/v1/clients/:clientId/usage`
- `/admin/settings/billing`

**Copilot prompts — paste these in sequence:**
1. Create `POST /api/v1/billing/checkout` to start a Stripe Checkout session using the selected plan `priceId` and attach `clientId` as metadata.
2. Create `POST /api/v1/billing/webhook` verifying the Stripe signature and handling the five events from Section 4.5. On `checkout.session.completed`, upsert `Subscription`. On `customer.subscription.deleted`, set `planSlug` to `free`.
3. Create `GET /api/v1/clients/:clientId/usage` returning current-period usage plus plan limits from `getClientPlan()`.
4. Create `/admin/settings/billing` showing usage bars, current plan, next billing date, and a Manage Billing button linking to the Stripe Customer Portal.

**Done when:**
- A Stripe test-mode checkout creates a `Subscription` row.
- Usage bars show correct percentages and turn yellow at 80 percent and red at 100 percent.
- `customer.subscription.deleted` downgrades the tenant to the free plan.

**Common pitfalls:**
- Stripe webhook verification requires the raw request body.
- Use the Stripe CLI for local webhook testing.
- Invalidate plan-related cache entries after subscription changes.

**Validation before closing the phase:**
- Verify tampered webhook payloads are rejected.
- Verify dashboard usage values match `getUsageSummary()`.

## Phase 6 Completion Gate

Do not close Phase 6 until all of the following are true:

- Prompt and settings editing respects tenant versus super-admin permission boundaries.
- Settings and prompt cache invalidation is confirmed after writes.
- Stripe checkout and webhook flows are verified in test mode.
- Usage dashboard thresholds and downgrade flow are validated.
- `docs/phases/results/phase-6-result.md` is generated with architecture, validation results, and follow-up notes.