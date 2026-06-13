# Production release checklist

Operator-facing steps to deploy the professor website safely and verify the editorial / DOCX import workflow before going live or starting Phase 10 work.

**Audience:** site operator, deploy maintainer.

**Related docs:**

- [Admin DOCX import workflow](./admin-import-workflow.md) — day-to-day import, merge, and publish operations
- [README.md](../README.md) — setup, architecture, env overview
- [SECURITY.md](../SECURITY.md) — vulnerability reporting

**Stack assumptions:** Vercel (Next.js App Router), PostgreSQL (`DATABASE_URL`), private Vercel Blob for DOCX bytes (`BLOB_READ_WRITE_TOKEN` when `VERCEL=1`).

---

## A. Pre-release local gates

Run on the release commit before deploying:

```bash
npm run lint
npm run tsc
npm run test:run
npm run build
```

All four must pass. Fix regressions before promoting to production.

---

## B. Required production environment variables

Set these in the Vercel project (or your host’s secret manager). Names must match [`.env.example`](../.env.example).

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string for Prisma (editorial workflow, imports, sessions, devices) |
| `ADMIN_SECRET` | **Yes** | Strong random secret for session HMAC and device tokens (see [Security notes](#c-security-notes)) |
| `ADMIN_PASSWORD` | **Yes** | Bootstrap / verify the single admin user password |
| `ADMIN_EMAIL` | Recommended | Admin user email (defaults to `admin@localhost` if unset) |
| `BLOB_READ_WRITE_TOKEN` | **Yes on Vercel** | Private Blob store for DOCX upload bytes when `VERCEL=1` |

**Optional (contact form only):**

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` | Public contact form via Web3Forms; not required for admin or import |

Other optional vars (`ADMIN_UPLOAD_HISTORY_PRISMA_TAKE`, `NEXT_PUBLIC_ENABLE_CUSTOM_CURSOR`, GitHub mirror vars) are documented in `.env.example` and are not required for a minimal production deploy.

**Optional — AI import review assistant (disabled by default):**

| Variable | Purpose |
|----------|---------|
| `AI_PROVIDER` | `none` (default), `ollama`, `openrouter`, `groq`, or `openai` |
| `AI_IMPORT_REVIEW_TIMEOUT_MS` | Server timeout for provider calls (default 15000) |
| `AI_IMPORT_REVIEW_MAX_INPUT_CHARS` | Cap on minimized review context size |
| `AI_IMPORT_REVIEW_RATE_LIMIT_PER_HOUR` | Per-admin-session rate limit (default 10); best-effort in-memory only, not shared across serverless instances |
| `OLLAMA_*` | Self-hosted Ollama base URL, model, allowlist |
| `OPENROUTER_*` / `GROQ_*` / `OPENAI_*` | Hosted provider API keys and allowlisted models (server-only) |

Leave `AI_PROVIDER=none` (AI disabled) unless the operator wants advisory AI enabled via a non-`none` env default before the professor saves preferences in `/admin/ai`. After the first save, database runtime settings control on/off, provider, and model. API keys and URLs remain env-only. Changing credentials or model allowlists still requires environment configuration and usually redeployment. External providers receive minimized review context only - not DOCX bytes or full raw document text. Do not enable for private CV data unless you accept provider privacy and logging terms. See [Admin import workflow - AI review](./admin-import-workflow.md#6b-optional---ai-review-assistant-advisory-only).

---

## C. Security notes

- **`ADMIN_SECRET` must be strong and non-placeholder.** Do not use the documented placeholder `default-secret-change-in-production`.
- **Weak or missing `ADMIN_SECRET` blocks production admin login.** The API returns `503` with code `ADMIN_SECRET_REQUIRED` until a real secret is set (`src/server/admin/adminSecurityConfig.ts`).
- **Private Blob is required for production DOCX uploads on Vercel.** With `VERCEL=1` and no `BLOB_READ_WRITE_TOKEN`, uploads are not durably stored and the admin UI surfaces an operator hint.
- **Do not rely on `public/uploads/` for production CV storage.** On non-Blob paths, files may be written under `public/uploads/` and could be reachable at `/uploads/…`. Production CVs must use private Blob + admin-only download (`/api/admin/uploaded-files/[id]/file`).
- **Keep `ALLOW_LEGACY_ADMIN_JWT` off** in production unless you are intentionally recovering a legacy JWT session cookie. Default production behavior rejects legacy JWT-shaped `admin_session` cookies.

Never commit `.env` files. Use the host secret manager only.

---

## D. Database migration

Before first production use (and after any schema migration in a release):

```bash
npx prisma migrate deploy
```

Run this against the **production** `DATABASE_URL` (CI step, one-off shell, or Vercel build hook with DB access).

- **Do not** run `prisma migrate dev` against production.
- **Do not** use `prisma db push` for production unless you explicitly accept non-migration history (not recommended for this project).

Confirm migrations exist under `prisma/migrations/` and match the deployed app version.

---

## E. First admin setup

After deploy and migrations:

- [ ] Open the production URL; confirm the public homepage loads.
- [ ] Go to **Admin** and **log in** with `ADMIN_PASSWORD`.
- [ ] **Register a trusted device** when prompted (required for merge, publish, draft edit, and private DOCX download).
- [ ] Open **Admin → Site content** (`/admin/content`); confirm the page loads with session + device.
- [ ] Confirm **no draft is published automatically** — visitors must not see a working draft until you explicitly publish.

Upload alone may work with session only; merge and publish require a registered device.

---

## F. First publish workflow

Until a valid **published** `ContentVersion` exists, the public site may serve **canonical in-repo seed** content (`src/content/defaults.ts`) when the DB is empty or unavailable.

- [ ] Understand that pre-publish visitors see canonical fallback, not your draft.
- [ ] Create or restore a **working draft** (manual edit, import merge, or restore from a published version).
- [ ] Review the draft in **Admin → Site content**.
- [ ] **Publish intentionally** from the content workflow UI.
- [ ] Reload the public homepage and confirm copy/lists match the published DB payload (not stale canonical seed).

See [Admin DOCX import workflow — Draft safety model](./admin-import-workflow.md#draft-safety-model).

---

## G. DOCX import smoke test

Use a **real CV** or a **safe redacted test DOCX** — never publish poison/test content to the live site.

### Upload and parse

- [ ] **Admin → Upload** — upload a `.docx` (max 10MB).
- [ ] Confirm the HTTP response returns quickly with status `UPLOADED` (parse runs after the response via `after()`).
- [ ] Poll the UI or open **Admin → CV imports** until status is **`PARSED`** or **`NEEDS_REVIEW`**.
- [ ] If stuck in **`UPLOADED`**, wait briefly, then use the manual process fallback: **`POST /api/admin/imports/[id]/process`** (admin session + registered device). See [Troubleshooting](./admin-import-workflow.md#import-stuck-in-uploaded).

### Review panels (import detail page)

- [ ] **Count validation** — e.g. `PATENT_COUNT_MISMATCH` if heading count ≠ extracted rows.
- [ ] **Parser warnings** — envelope and DB warnings; errors often block safe merge for affected sections.
- [ ] **Raw / unmapped sections** — content the parser could not route confidently.
- [ ] **Merge safety table** — per-section risk, `includeInSafeMerge`, `fullReplaceRequiresAck`.

### Merge and draft hygiene

- [ ] Merge with **`safe_update`** first (default).
- [ ] Inspect the **working draft** before any publish.
- [ ] **Never publish** smoke/test DOCX content to production visitors.
- [ ] **Discard** the working draft if the merge was only a test (`POST /api/admin/content/draft/discard` or UI).

Full operational detail: [Admin DOCX import workflow](./admin-import-workflow.md).

---

## H. Merge safety checklist

Server-side policy is enforced in `mergeImportCandidateToWorkingDraft` — UI warnings alone are not sufficient.

### `safe_update` should protect (baseline preserved when risky)

- [ ] **Patents** — especially with `PATENT_COUNT_MISMATCH`
- [ ] **Publications** — parser errors or high list churn
- [ ] **Academic journey**
- [ ] **Professional experience**
- [ ] **Awards**
- [ ] **Research projects**
- [ ] **Teaching**
- [ ] **Supervision**
- [ ] **Service** — CV narrative (`cv-nar-`) blocks not applied in safe update

### `full_replace`

- [ ] Requires **`acknowledgeHighRisk: true`** when any section is not `safe_to_merge` (API `MERGE_ACK_REQUIRED` / HTTP 422 otherwise).
- [ ] Use only after deliberate review of patents, publications, and long narrative blocks.

### Visitor safety

- [ ] **Import candidates** and **working drafts** must **not** serve public visitors until **publish**.
- [ ] Public site reads latest valid **published** `ContentVersion`, else canonical fallback.

Reference: [What `safe_update` protects](./admin-import-workflow.md#what-safe_update-protects).

---

## I. Post-deploy verification

- [ ] **Public homepage** loads over HTTPS.
- [ ] **Admin login** works with production `ADMIN_SECRET` and password.
- [ ] **Content draft / discard** works (create or bootstrap draft, then discard without affecting published rows).
- [ ] **DOCX upload** path works (upload → parse → import detail).
- [ ] **Private DOCX download** (`/api/admin/uploaded-files/[id]/file`) requires admin session **and** registered device; unauthenticated requests get 401/403.
- [ ] **Canonical fallback (staging only, if practical):** temporarily break or misconfigure `DATABASE_URL` in a **staging** environment and confirm the public site still renders from canonical seed — not from draft or import data. Do not leave production DB misconfigured.

---

## J. Rollback and safety

- [ ] **Bad working draft:** discard only (`POST /api/admin/content/draft/discard`). Visitors unchanged.
- [ ] **Bad published version:** restore a previous published `ContentVersion` into a new working draft, review, then publish again (non-destructive restore flow).
- [ ] **Published versions stay immutable** — publish promotes the working row; history remains in `ContentVersion` with `PUBLISHED` / `ARCHIVED` status.
- [ ] **Do not manually delete production DB rows** during release troubleshooting — use discard, restore, and supported admin APIs only.
- [ ] **Re-deploy previous app build** on Vercel if a bad deployment shipped; DB state is separate from code rollback.

---

## Quick reference — editorial API auth

| Action | Session | Registered device |
|--------|---------|-----------------|
| Upload DOCX | Required | Not required (merge/publish blocked until registered) |
| Import review / merge / process | Required | Required |
| Draft edit / publish / discard | Required | Required |
| Private DOCX download | Required | Required |

---

## After this checklist

When all items pass on staging (and again on production if separate), the editorial pipeline is ready for live use. AI import review remains **optional** and **off by default** - enable only after operator sign-off on data-minimization and provider privacy terms.
