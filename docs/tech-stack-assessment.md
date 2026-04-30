# Display Relay Tech Stack Assessment

Assessment date: 2026-04-30

## Scope

This is a design-time stack assessment based on the declared architecture in `Display Relay_Project Setup & Architecture.md`. It is not a full software composition analysis of a built application because this workspace does not currently contain a `package.json`, lockfile, image digest inventory, or container manifests for the actual implementation.

That limitation matters:

- public advisories can be confirmed online,
- but affectedness cannot be confirmed precisely until exact versions and image tags are pinned.

## Declared Stack In Scope

Based on the architecture spec, the primary stack is:

| Component | Declared version or role |
|---|---|
| Next.js | 14 (App Router) |
| TypeScript | language layer |
| Tailwind CSS | styling |
| Fabric.js or custom React canvas | editor layer |
| PostgreSQL | 15 |
| Prisma | ORM |
| Redis | 7 |
| Soketi | self-hosted Pusher-compatible real-time gateway |
| OpenRouter | AI generation service |
| NextAuth.js | admin auth |
| MinIO | self-hosted S3-compatible asset storage |
| Nginx | reverse proxy |
| Docker + Docker Compose | container/runtime layer |
| pnpm | package manager |

## Method

Online checks performed before writing this assessment:

1. OSV API checks for npm packages used or planned at the application layer.
2. NVD API keyword checks for major application and infrastructure components.

Interpretation rules used:

- OSV package hits are more relevant for npm libraries.
- NVD keyword counts only prove public vulnerability records exist for a term; they do not prove this project is affected.
- Without exact versions, the correct conclusion is risk presence, not vulnerability confirmation.

## Online Vulnerability Signal Summary

### OSV Package Advisory Checks

The following public package-advisory signals were found during the online check:

| Package | Public advisory signal | Notes |
|---|---|---|
| `next` | 42 OSV advisories returned | Examples included middleware identifier leakage, directory traversal, dev-server information exposure, server crash, and unbounded image cache growth. |
| `next-auth` | 10 OSV advisories returned | Examples included missing OAuth state/nonce/PKCE checks, open redirect issues, email misdelivery, and excessive information in logs. |
| `fabric` | 1 OSV advisory returned | `GHSA-hfvx-25r5-qc3w` — stored XSS via SVG export. |
| `prisma` | No concrete OSV result returned at query time | No package-level advisory was confirmed from the live query. |
| `@prisma/client` | No concrete OSV result returned at query time | No package-level advisory was confirmed from the live query. |
| `tailwindcss` | No concrete OSV result returned at query time | No package-level advisory was confirmed from the live query. |

### NVD Keyword Check Counts

The NVD JSON API returned the following broad keyword-result counts:

| Keyword | Public result count |
|---|---|
| `next.js` | 78 |
| `next-auth` | 3 |
| `prisma` | 77 |
| `redis` | 178 |
| `postgresql` | 370 |
| `minio` | 106 |
| `soketi` | 1 |
| `nginx` | 302 |

These NVD counts are intentionally broad and noisy. They should be read as “this ecosystem has public vulnerability history,” not as “this project is affected by these counts.”

## Assessment By Component

### Next.js 14

Risk level: High

Why:

- The package has a meaningful public advisory history in OSV.
- The declared version is only specified as `Next.js 14`, not a pinned patch version.
- By April 2026, using a major-only declaration instead of a currently supported pinned release should be treated as a security gap.

Assessment:

- Do not implement against a vague `14.x` target.
- Either move to the current supported major before implementation starts or pin the latest secure `14.x` release if there is a compatibility reason to stay there.

### NextAuth.js

Risk level: High

Why:

- Public advisories exist for redirect handling, OAuth state/nonce/PKCE validation, email flow behavior, and logging exposure.
- This project depends on tenant-aware admin auth, which raises the blast radius of auth mistakes.

Assessment:

- Use the latest maintained release line.
- Explicitly harden callback URL allowlists, OAuth state/nonce/PKCE handling, and logging.
- Treat auth configuration review as a blocking security milestone, not a routine setup step.

### Prisma

Risk level: Medium

Why:

- The live OSV package query did not return a concrete advisory for `prisma` or `@prisma/client`.
- The dominant Prisma risk in this architecture is misuse, not confirmed package-level CVE evidence.
- The system is multi-tenant, so query scoping errors are security-critical even if the ORM package itself is current.

Assessment:

- The real Prisma security control here is enforced tenant scoping through `scopedPrisma(clientId)`.
- Treat accidental global queries as a higher-probability risk than a package CVE.

### PostgreSQL 15

Risk level: Medium

Why:

- PostgreSQL has a large public vulnerability history overall.
- The architecture only pins the major version, not the minor patch level.
- Database exposure and patch lag matter more than framework-level bugs here.

Assessment:

- Use the latest supported 15.x patch if staying on 15.
- Keep PostgreSQL private to the VPS or internal network.
- Enforce backups, credential rotation, and least-privilege DB roles from day one.

### Redis 7

Risk level: Medium

Why:

- Redis has broad public vulnerability history.
- Redis is used for settings, prompt caching, pairing codes, and likely heartbeat buffering, so compromise or exposure is operationally significant.

Assessment:

- Do not expose Redis publicly.
- Require authentication, network isolation, and TLS where feasible.
- Review which commands are available in production and avoid treating Redis as a trusted public service.

### Soketi

Risk level: Medium

Why:

- The NVD keyword check found little formal CVE visibility, but that is not the same as low risk.
- The architecture currently uses `quay.io/soketi/soketi:latest`, which is a supply-chain and reproducibility risk by itself.
- It sits on the real-time event path for tenant updates.

Assessment:

- Replace `latest` with a pinned version or digest before implementation.
- Keep Soketi private behind the reverse proxy and restrict its network surface.
- Treat tenant-channel authorization and secret management as the key risks here.

### MinIO

Risk level: Medium

Why:

- Public vulnerability history exists broadly.
- It stores tenant assets and possibly generated thumbnails, making it a high-value data surface.
- The design currently does not pin an image version in the workspace.

Assessment:

- Pin MinIO to a known release or image digest.
- Do not expose the console broadly.
- Use scoped object paths, strong credentials, and explicit bucket policy review.

### Nginx

Risk level: Medium

Why:

- Nginx is internet-facing and has extensive public vulnerability history over time.
- This platform relies on Nginx for SSE-safe proxying and public ingress.

Assessment:

- Use a maintained stable branch and patch aggressively.
- Add strict TLS, proxy hardening, and request-size/rate controls.
- Treat Nginx misconfiguration as likely before code CVEs in early phases.

### Fabric.js

Risk level: Medium

Why:

- A public OSV advisory was returned: `GHSA-hfvx-25r5-qc3w` for stored XSS via SVG export.
- This matters because the product includes a slide editor and renders user-authored content.

Assessment:

- If SVG import/export or SVG-based block flows are enabled, sanitize aggressively.
- Treat editor HTML, SVG, and template rendering as untrusted content paths.

### Tailwind CSS

Risk level: Low

Why:

- No concrete package-level advisory was confirmed by the live OSV query.
- Tailwind is not the primary security driver in this architecture.

Assessment:

- Keep current, but prioritize server-side and auth-adjacent dependencies first.

### OpenRouter And External APIs

Risk level: Medium

Why:

- These integrations do not map cleanly to the same CVE workflow as self-hosted packages and containers.
- The real risk is key handling, prompt leakage, sensitive-data egress, provider policy variation, and abuse cost.

Assessment:

- Treat API keys, request logging, provider failover behavior, and prompt/data minimization as the core security controls.
- Do not send secrets or cross-tenant data to model providers.

## Key Security Observations

### 1. The main security gap is version ambiguity

The project spec defines a stack, but not an exact bill of materials. Today the biggest blocker to a precise vulnerability statement is not lack of public advisories. It is lack of exact versions and image digests.

### 2. `latest` container tags are a security and operability risk

The architecture explicitly references `quay.io/soketi/soketi:latest`. That should be treated as a hardening issue and changed before implementation begins.

### 3. Multi-tenancy mistakes are likely more dangerous than package CVEs

For this platform, the highest-probability severe failure is tenant data exposure via an unscoped query, unsafe media pathing, or a broken auth boundary.

### 4. The editor and template pipeline need XSS discipline from the start

The combination of template HTML, SVG/editor content, iframe rendering, and AI-generated output creates a stored-content risk surface that must be treated as hostile input.

### 5. Self-hosted infra is viable, but only with strict network hygiene

PostgreSQL, Redis, Soketi, and MinIO should all be treated as private services, not public internet endpoints.

## Recommended Security Baseline Before Implementation

1. Pin exact versions and image digests for every major component.
2. Prefer currently supported releases over vague major-version targets, especially for Next.js and auth dependencies.
3. Add automated scanning once manifests exist: `pnpm audit`, OSV scanning, and image scanning with Trivy or Grype.
4. Keep PostgreSQL, Redis, Soketi, and MinIO off the public internet.
5. Harden NextAuth.js callback handling, OAuth checks, and tenant-bound session validation.
6. Sanitize editor HTML and SVG content aggressively and define CSP rules early.
7. Define a patching policy for framework, container, and infrastructure components before deployment.

## Overall Verdict

The chosen stack is viable for this product, but it is not yet security-ready as specified.

The issue is not that the stack is unusually weak. The issue is that several key components have public advisory history and the current design does not yet pin exact versions or container digests. Until that is corrected, the right security posture is:

- assume patching matters,
- assume some declared components have relevant public advisories,
- do not claim the stack is clean,
- and require version pinning plus hardening before implementation proceeds.

## Confidence And Limitations

Confidence level: Medium

Reason:

- The declared stack is explicit enough for a design review.
- Public advisory presence was confirmed online for several core components.
- Exact affectedness cannot be determined without actual dependency manifests, lockfiles, and image tags.