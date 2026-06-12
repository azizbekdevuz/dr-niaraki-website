# Admin DOCX import workflow

Operational guide for uploading a CV (DOCX), reviewing parser output, merging into a **working draft**, and publishing safely. This document reflects the production import pipeline as of the post-redesign release.

**Audience:** site admin, professor, future maintainers.

**Related code:** `src/app/admin/upload/`, `src/app/admin/imports/`, `src/server/imports/`, `src/server/content/`.

---

## Overview

The import pipeline is **not** “upload → publish”. It is:

1. **Upload** DOCX (fast; parsing may run after the HTTP response).
2. **Wait** until the import is `PARSED` or `NEEDS_REVIEW`.
3. **Review** warnings, counts, section mapping, and structured diffs.
4. **Merge** into a **working draft** using **safe update** (default) or **full replace** (explicit, dangerous).
5. **Inspect** the draft in **Site content** (admin editor).
6. **Publish** only when the draft looks correct.
7. **Discard** the draft if the merge was wrong — visitors are unaffected until you publish.

The public site always serves the **latest published** `ContentVersion`. A working draft is invisible to visitors.

---

## Step-by-step workflow

### 1. Upload DOCX

- Go to **Admin → Upload** (`/admin/upload`).
- Select a `.docx` file and upload.
- The server stores the file and creates a `ContentImport` row (status `UPLOADED`).
- Parsing is typically **deferred** (`after()` / background job) so the upload request returns quickly instead of blocking on mammoth + parser.

### 2. Wait for `PARSED` or `NEEDS_REVIEW`

- Poll the UI or open **Admin → CV imports** (`/admin/imports`) and open the import detail page.
- Terminal parse statuses:
  - **`PARSED`** — candidate payload stored; review recommended but no mandatory envelope flag.
  - **`NEEDS_REVIEW`** — parser/validation flagged issues; read warnings before merging.
  - **`FAILED`** — parse error; fix the file or retry via process endpoint (see Troubleshooting).
- If status stays **`UPLOADED`**, parsing may not have run yet — wait or trigger manual process (see Troubleshooting).

### 3. Inspect parser warnings

On the import detail page (`/admin/imports/[id]`):

- **Import warnings** (DB-stored).
- **Envelope parser warnings** (`candidateReview.parserWarnings`) with severity `info` / `warning` / `error`.
- Errors on list sections (publications, patents, etc.) often mean **safe update will skip** those sections.

### 4. Inspect count validation

The candidate envelope includes `countValidation` entries, e.g.:

- **`PATENT_COUNT_MISMATCH`** — heading declares many patents (e.g. 52) but the parser extracted far fewer (e.g. 5).
- Treat declared counts as **hints**, not ground truth, until you verify the structured diff.

### 5. Inspect section mapping

- **Section mapping report** shows how each DOCX heading was mapped to a website section (`mappedWebsiteSection`, confidence, item counts).
- **Unmapped sections** — content the parser could not confidently route; inspect raw section previews before trusting list merges.

### 6. Compare against baseline

Use **Compare import against** on the import detail page:

| Baseline | Use when |
|----------|----------|
| **Auto** | Default: working draft if one exists, else in-repo canonical seed |
| **Working draft** | See diff vs your current unpublished draft |
| **In-repo canonical** | Diff vs shipped seed content (ignores a polluted draft) |
| **Latest published** | Diff vs what visitors see today (when a published row exists) |

Structured review blocks show **added / removed / changed** per section (profile, journey, publications, teaching, etc.).

**Merge safety** (separate from compare baseline) always evaluates against **working draft if valid, else canonical** — this drives which sections are included in **safe update**.

### 6b. Optional - AI review assistant (advisory only)

On the import detail page, **AI review assistant** appears after parser warnings and **before** merge controls.

- **Disabled by default** (`AI_PROVIDER=none`). Enable only when you accept provider privacy/logging terms for minimized review context.
- **Review-only:** suggestions never merge, publish, edit drafts, or change the public site. There is no "Apply suggestion" action.
- Click **Generate AI suggestions** manually - no automatic call on page load.
- The server sends **minimized** context (warnings, count validation, merge safety, truncated block summaries). It never sends DOCX bytes, `rawDocumentText`, or full publication/patent bodies.
- **Provider options** (see `/admin/ai` and `.env.example`):
  - **Ollama** - best free/open-source option when self-hosted on your VPS or machine.
  - **OpenRouter / Groq** - hosted; may expose free or low-cost models but are **rate-limited** and subject to provider policies (not unlimited or guaranteed forever-free).
  - **OpenAI** - optional paid hosted inference.
- API keys and base URLs stay in **server env only**. Active provider/model are set via `AI_PROVIDER` and provider env vars (redeploy to switch).
- AI failure or rate limits do **not** block import review, merge, draft, or publish.
- Rate limiting is **best-effort** and stored in memory per server instance (not shared across serverless cold starts).

`POST /api/admin/imports/[id]/ai-review` (admin session + registered device required).

### 7. Choose merge mode and create working draft

On **Merge into working draft**:

| Mode | When to use |
|------|-------------|
| **`safe_update`** (default) | Normal path. Updates only sections marked **Safe merge: Yes**. |
| **`full_replace`** | Only when you intentionally want import lists to overwrite curated site data. Requires **high-risk acknowledgement** when the safety report flags risky sections. |

Actions:

- **Create draft from import** — first time; fails if a working draft already exists.
- **Replace current draft** — overwrites the existing working draft payload (still does not publish).

The API accepts optional body fields:

```json
{
  "action": "create",
  "mergeMode": "safe_update",
  "acknowledgeHighRisk": false
}
```

`POST /api/admin/imports/[id]/merge-to-draft`

### 8. Inspect draft

- Open **Admin → Site content** (`/admin/content`).
- Preview list sections, professional summary, patents, publications, teaching, etc.
- Compare mentally (or via baseline) with what you expected from the DOCX.

### 9. Publish only after review

- **Publish** is a separate action from merge.
- Until publish, visitors still see the previous published version (or canonical fallback if none).

### 10. Discard draft if unsafe

If the draft is wrong:

- **Discard working draft** on the import detail page, or
- `POST /api/admin/content/draft/discard` (admin session required).

This deletes **only** the working draft row. Published content and import history are unchanged.

---

## Merge modes (critical)

### `safe_update` — default, conservative

- **Server default** when `mergeMode` is omitted.
- Merges **only** sections the safety policy marks as safe (`includeInSafeMerge: true`).
- Typical safe sections:
  - **Profile** (display name, role line)
  - **Contact** (unless parser errors block contact)
  - **Professional summary** (narrative paragraphs, with split/qualifications policy)
  - **Research interests** — only when churn is low
- **Skipped** (baseline preserved) when risky:
  - Patents with **`PATENT_COUNT_MISMATCH`**
  - Publications when parser errors mention publications
  - **Teaching / supervision / service** when CV **narrative** sections would inject raw `cv-nar-` rows
  - Academic journey, experience, awards, research projects when **high list churn** vs baseline
- Does **not** mean “everything in the DOCX is on the site” — it means “only the safe slices were applied.”

### `full_replace` — dangerous

- Maps **all** import-backed list sections into the draft (legacy aggressive behavior).
- Can **remove** curated rows and replace patents/publications/experience with incomplete parser output.
- When **any** section is not `safe_to_merge`, the server requires:

```json
{
  "mergeMode": "full_replace",
  "acknowledgeHighRisk": true
}
```

Without acknowledgement, the API returns **`MERGE_ACK_REQUIRED`** (HTTP 422) and does not create/update the draft.

**Do not use full replace** unless you have checked patents, publications, and long CV narrative blocks intentionally.

---

## High-risk signals (what they mean)

| Signal | Meaning | Safe update behavior |
|--------|---------|----------------------|
| **`PATENT_COUNT_MISMATCH`** | Heading count ≠ extracted patent rows | Patents **not** merged; baseline patents kept |
| **Parser warnings (error)** | Parse/validation failures on candidate | Often blocks contact; may block publications |
| **Parser warnings (warning)** | Non-fatal issues | Review list sections; noted in merge safety |
| **`reviewHint: NEEDS_REVIEW`** | Envelope flagged manual inspection | Merge allowed but **review first** |
| **`reviewHint: RAW_CHANGED_ONLY`** | Document hash changed but structured diff empty | Inspect **raw** section summaries |
| **Unmapped sections** | DOCX blocks without confident mapping | Do not trust automatic list merge for that content |
| **High list churn** | Many added/removed rows vs baseline (journey, experience, awards, …) | Section held back from safe merge |
| **CV narrative sections** | Raw teaching/supervision/service/skills text from DOCX | **Review-only**; `cv-nar-` rows **not** applied in safe update |

Risk labels in the UI:

- **`safe_to_merge`** — included in safe update when no other rule blocks it.
- **`needs_review`** — moderate churn; held back by default.
- **`review_only_default`** — patents mismatch, publication errors, CV narratives.
- **`requires_explicit_replace`** — very high churn; full replace needs acknowledgement.

---

## Known parser limitations (current)

These are **expected** today — not bugs in merge safety:

- **Patents:** parser (`v1.3.0`) correctly splits Korean single-line entries and infers country. Extracted count should be close to the declared heading count. If `PATENT_COUNT_MISMATCH` appears on an old import, re-upload and re-parse with the current parser version.
- **Publications:** segmentation significantly improved in `v1.3.0`. Publication summary prose is filtered and `Books and Book Chapters` no longer creates a spurious top-level section. Exact count may still differ slightly from heading due to DOCX formatting variation.
- **DOCX formatting:** unusual headings, tables, or Word styles can confuse section boundaries.
- **CV narrative blocks:** teaching, supervision, service, and skills may appear as **long raw text** unsuitable for public pages without manual editing.
- **AI:** not required for import; **not enabled by default** in this pipeline. Parsing is TypeScript/mammoth-based.
- **Old import candidates:** imports parsed with `v1.2.0` or earlier will still show old counts (e.g. `PATENT_COUNT_MISMATCH` with 5 extracted). Re-upload the DOCX to get `v1.3.0` parser output.

---

## What `safe_update` protects

| Area | Protection |
|------|------------|
| **Patents** | Preserved when count mismatch or unsafe |
| **Publications** | Preserved when parser errors or high churn |
| **Teaching / supervision / service** | CV narrative (`cv-nar-`) rows **not** applied; baseline lists kept |
| **Academic journey / experience / awards / research projects** | Held back when churn thresholds exceeded |
| **Profile / summary / contact** | Updated when safe (primary intended use of safe update) |

Merge safety is enforced **server-side** in `mergeImportCandidateToWorkingDraft` — the UI warnings are not sufficient on their own.

---

## Draft safety model

| Fact | Detail |
|------|--------|
| Working draft visibility | **Admin only** — not served to public visitors |
| Public site source | Latest **published** `ContentVersion` (valid payload), else canonical seed |
| Merge vs publish | Merge creates/updates draft; **publish** is a separate explicit step |
| Discard endpoint | `POST /api/admin/content/draft/discard` |
| Discard scope | Removes working draft row only; does not unpublish or delete imports |
| Re-merge | An import marked `MERGED` is idempotent on repeat merge requests (links existing draft version) |

---

## Troubleshooting

### Upload returns timeout or feels slow

- Upload should return quickly; **parsing runs afterward**. Refresh imports list or wait for poll on upload page.
- Very large DOCX files may still take time to parse in the background.

### Import stuck in `UPLOADED`

- Background parse may not have started (serverless `after()` edge cases).
- **Manual retry:** `POST /api/admin/imports/[id]/process` (admin auth).
- Check server logs for `docx_import_parse` events.

### Parser says `NEEDS_REVIEW`

- Read parser warnings and count validation before merging.
- Prefer **safe update**; inspect structured diff and raw section previews.
- Do not publish until you understand what changed.

### Full replace button disabled / merge fails with acknowledgement error

- You selected **full replace** but did not check the acknowledgement box.
- Or the server returned `MERGE_ACK_REQUIRED` — set `acknowledgeHighRisk: true` in API or check the box in UI.

### Working draft looks wrong after safe update

- Expected if you expected list sections to update — safe update **intentionally skipped** risky sections.
- Open import detail → **Merge safety** table (Safe merge: No).
- **Discard draft** and either fix the DOCX / curated content, or use **full replace** only with eyes open.

### Patents or publications look wrong

- Check for **`PATENT_COUNT_MISMATCH`** and publication parser errors.
- Safe update **preserves** baseline lists in those cases.
- Full replace can overwrite with incomplete parser output — **avoid** without verification.

### How to discard draft

1. Import detail page → **Discard working draft**, or  
2. Site content workflow if exposed, or  
3. `POST /api/admin/content/draft/discard`

Then merge again or bootstrap a fresh draft from canonical.

### What logs to check

- Server stdout: `{"event":"docx_import_parse", ...}` (status, timings, errors).
- Import row `warnings` JSON in DB / admin UI.
- API responses from `/api/admin/imports/[id]/review` (`mergeSafety`, `blocks`, `warnings`).

---

## Do not do this

- **Do not publish immediately after import** — always review the working draft in Site content.
- **Do not full_replace** without checking patents, publications, and experience lists.
- **Do not assume** the parser extracted every patent or publication named in a heading.
- **Do not ignore `NEEDS_REVIEW`** or `PATENT_COUNT_MISMATCH`.
- **Do not use test.docx / synthetic CV content** in production merges.
- **Do not confuse** “merged to draft” with “live on the website” — only **publish** changes the public site.

---

## API quick reference

| Endpoint | Purpose |
|----------|---------|
| `POST /api/admin/upload` | Store DOCX, create import (`UPLOADED`) |
| `POST /api/admin/imports/[id]/process` | Re-run parse if stuck |
| `GET /api/admin/imports/[id]/review?baseline=auto` | Review payload + merge safety |
| `POST /api/admin/imports/[id]/merge-to-draft` | Create/replace working draft |
| `GET /api/admin/content/draft` | Read working draft |
| `POST /api/admin/content/draft/discard` | Delete working draft |
| `POST /api/admin/content/publish` | Publish working draft |

Baseline query values: `auto`, `working_draft`, `canonical`, `published`.

---

## Parser accuracy improvements

### `v1.3.0` (Phases 4B–4E)

Parser version `v1.3.0` (constant `PARSER_VERSION` in `src/parser/docxParser.ts`) includes the following accuracy improvements. No merge safety behavior was changed.

**Korean patent parsing (Phases 4B–4C)**

- Korean registered patents with bare single-line format (`10-XXXXXXX – YYYY-MM-DD Title`) are now correctly split into individual entries.
- `country = 'Korea'` is inferred automatically for any patent whose number matches the `10-\d{4,}` pattern.
- Real DOCX diagnostic result: **53 patents extracted** (declared: 52); **48 Korean**, **5 US**, **0 null-country**.

**Korean patent title cleanup (Phase 4D)**

- Patent number prefix and ISO date (`YYYY-MM-DD`) are stripped from single-line Korean patent titles.
- Titles now start directly with the descriptive text.

**Publication section boundary fix (Phase 4E)**

- `Books and Book Chapters` (title-case) no longer acts as a top-level section boundary. Content remains under the parent `Publications` section.
- All-caps subsection banners (`BOOKS AND BOOK CHAPTERS`, `JOURNAL PAPERS`, `CONFERENCE PAPERS`) were already suppressed in Phase 4B.

**Publication summary prose filtering (Phase 4E)**

- Lines such as `Publication Summary`, `Over 200 peer-reviewed publications`, bullet-point prose overviews, and introductory phrases are filtered before APA entry parsing.
- Real DOCX diagnostic result: **0 null-year publication stubs** (was 3); **190 parsed publications** (was 201 with noise); **1 publication section** (was 2).

**Important caveats**

- Parser output is still **candidate data**, not ground truth. Always verify on the import review page before merging.
- `safe_update` and `full_replace` safety policies are **unchanged** — the merge workflow is the same.
- Imports parsed with `v1.2.0` or earlier retain old (lower) counts. Re-upload the DOCX to generate a fresh `v1.3.0` candidate.

---

## Maintainer notes

- Candidate storage uses **`candidatePayload` envelope** (`schemaVersion`, `sourceTextHash`, `countValidation`, `sectionMappingReport`, `details`, …).
- Merge implementation: `mergeImportCandidateToWorkingDraft`, `evaluateImportMergeSectionSafety`, `mergeCvDetailsIntoSiteContent` with optional `freeze` keys.
- CV narrative policy: `cvNarrativeToSimpleLists.ts` (`cv-nar-` item prefix).
- Tests: `src/tests/imports/importMergeSectionSafety.test.ts`, `src/tests/imports/mergeImportToDraft.test.ts`, `src/tests/imports/importReviewSemantics.test.ts`, `src/tests/imports/phase3aImportPayload.test.ts`, `src/tests/imports/importReviewCompare.test.ts`.

For architecture context see [README.md](../README.md).
