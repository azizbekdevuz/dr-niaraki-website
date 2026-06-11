# Phase 2 — DOCX import / review architecture (design only)

**Status:** Design document. Phase 1 findings are the source of truth.  
**Scope:** No production implementation in this phase.

---

## 0. Phase 1 anchors (constraints on this design)

- Mammoth → plain text → line headers → **single `summary` accumulator overwrites** earlier Professional Summary when Summary of Qualifications follows (`docxParserSectionRoutes.ts` + `cvSectionBoundaries.ts`).
- **`Details.research.projects` never merged** into `SiteContent`; review has **no** research-projects block (`detailsToSiteContentMerge.ts`, `importReviewStructured.ts`).
- Review “no changes” strings come from **id-keyed list diff** + **narrow profile scalar keys** + **summary string equality** (`importListDiff.ts`, `importReviewStructured.ts`).
- Patents: **marker-driven splitting** + **no heading-count validation** (`patentsParser.ts`).
- **No `*.docx` fixtures** in repo today — Phase K requires adding `original.docx` / `test.docx` (or redacted structural twins).

---

## 1. `candidatePayload` v2 schema

### 1.1 Goals

- Single JSON column remains `ContentImport.candidatePayload` (Prisma `Json`) unless a later phase justifies splitting blobs.
- **Backward compatible:** v1 = today’s `Details`-only object (implicit or `schemaVersion: 1`).
- **v2** wraps structured site-bound data + **preservation layers** that Phase 1 lacked.

### 1.2 Top-level shape (conceptual)

```ts
// Discriminated by schemaVersion
type ImportCandidatePayload =
  | ImportCandidatePayloadV1   // current: Details-only (legacy)
  | ImportCandidatePayloadV2;

type ImportCandidatePayloadV2 = {
  schemaVersion: 2;

  /** Semantic version of this envelope (bump when fields are added/renamed). */
  envelopeVersion: 1;

  /** Hash of canonical normalized raw document text used for “raw changed?” gate (e.g. SHA-256). */
  sourceTextHash: string;

  /** TS path: e.g. mammoth-1.2 + ts-map-0.3; Python path: e.g. py-docx-0.2.0 */
  parserVersion: string;

  /** Section alias table + fuzzy matcher version (e.g. map-2026.05). */
  mappingVersion: string;

  /** Full normalized plain text of the document (post whitespace/tab/NBSP rules). Primary input for raw diff. */
  rawDocumentText: string;

  /** Optional: original mammoth HTML or stripped HTML for debugging; never sole source of truth. */
  rawHtmlDigest?: string | null;

  /**
   * Structured site-oriented view (today’s `Details` shape or a narrowed successor).
   * Produced by mapping layer from `pythonExtraction` + TS validators; used for merge when valid.
   */
  details: Details;

  /** Raw structural extraction from Python (null = skipped / failed / dev-only TS path). */
  pythonExtraction: PythonParserOutput | null;

  /**
   * Deterministic section slices derived from Python (or TS fallback): titles, levels, rawText spans, optional items[].
   * Not dropped when unmapped.
   */
  rawSections: RawSection[];

  /** Subset of rawSections with no confident website target after mapping. */
  unmappedSections: UnmappedSectionRef[];

  /** One row per detected DOCX section → website target + confidence + warnings. */
  sectionMappingReport: SectionMappingReportRow[];

  /** Declared counts in headings vs extracted item counts. */
  countValidation: CountValidation;

  /** Normalized parser + mapping warnings (codes, severity, sectionId). */
  parserWarnings: ParserWarningItem[];

  /** Import-level status hint (may duplicate DB `ContentImport.status` for payload self-description). */
  reviewHint?: 'READY' | 'NEEDS_REVIEW' | 'RAW_CHANGED_ONLY';
};
```

### 1.3 Nested types (conceptual)

**`RawSection`**

- `id: string` (stable: slug + hash of title + startIndex)
- `parentId: string | null`
- `title: string` (display)
- `normalizedTitle: string` (lower, collapsed whitespace)
- `level: number` (1 = top-level)
- `startIndex` / `endIndex` (offsets into `rawDocumentText`)
- `rawText: string` (slice or copy; slice preferred for size)
- `children: RawSection[]` (or flat list + `parentId`)
- `items: string[]` (deterministic line/paragraph items when segmentation succeeds)
- `source: 'python' | 'typescript_fallback'`
- `warnings: string[]`

**`UnmappedSectionRef`**

- `sectionId: string`
- `reason: string`
- `suggestedLabels?: string[]` (for admin UI)

**`SectionMappingReportRow`**

- `docxSectionId: string`
- `docxSectionTitle: string`
- `normalizedTitle: string`
- `mappedWebsiteSection: string | null` (dot-path e.g. `about.experiences`, `patents.items`, `research.projects`)
- `confidence: 'exact' | 'alias' | 'fuzzy' | 'unmapped'`
- `parserUsed: string` (e.g. `educationParser`, `patentsParser`, `none`)
- `itemCount: number`
- `warnings: string[]`

**`CountValidation`**

- `entries: CountValidationEntry[]`

**`CountValidationEntry`**

- `domain: 'patents' | 'publications_journal' | 'publications_conference' | 'publications_book' | 'awards' | 'students' | ...`
- `declaredInHeading: number | null` (parsed from “Patents (52 …)”)
- `extractedCount: number`
- `severity: 'info' | 'warning' | 'error'` (error = extreme drop only; default warning)
- `code: string` (e.g. `PATENT_COUNT_MISMATCH`)

**`ParserWarningItem`**

- Align with existing DB JSON shape where possible; extend with `code`, `severity`, `sectionId?`.

**`PythonParserOutput`**

- Strict subset of the JSON contract in §2 (validated by `PythonParserOutputSchema` Zod in Node).

### 1.4 Zod placement (Phase 3)

- `src/server/imports/candidatePayload/` (new)
  - `candidatePayloadV2.schema.ts` — Zod schemas + `parseCandidatePayload(unknown)` discriminated on `schemaVersion`.
  - `types.ts` — exported TypeScript types inferred from Zod.

---

## 2. Python parser service contract

### 2.1 Responsibilities (Python only)

- DOCX **structural** read: paragraphs, runs, styles, heading levels, tables (as text), numbering when accessible.
- Normalization: tabs, NBSP, collapsed spaces, consistent newlines.
- **Section tree** + optional deterministic `items[]` segmentation.
- **Warnings** (non-fatal): table too wide, unknown numbering, empty cells merged, etc.
- **No** DB, **no** auth, **no** merge to `SiteContent`, **no** AI (unless later optional pass — not in Python core).

### 2.2 Input shape

**Option A — stdin JSON + file path (dev / same machine)**

```json
{
  "jobId": "optional-correlation-id",
  "originalFileName": "cv.docx",
  "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "docxBase64": "<base64>",
  "options": {
    "maxSectionDepth": 6,
    "maxTextChars": 2000000
  }
}
```

**Option B — HTTP multipart (production container)**

- `POST /parse`
- multipart field `file` + optional JSON `options` field.

**Recommendation:** One **OpenAPI-documented** HTTP contract for production; stdin JSON for local `npm run dev` optional wrapper.

### 2.3 Output JSON shape (success)

Top-level (aligned with §1 `pythonExtraction`):

```json
{
  "ok": true,
  "parserVersion": "py-docx-import-0.1.0",
  "normalizedText": "...",
  "normalizedTextHash": "sha256:...",
  "sections": [
    {
      "id": "sec-...",
      "title": "Patents (52 Registered & Completed)",
      "normalizedTitle": "patents (52 registered & completed)",
      "level": 1,
      "startIndex": 0,
      "endIndex": 0,
      "rawText": "...",
      "children": [],
      "items": [],
      "warnings": []
    }
  ],
  "tables": [
    { "id": "tbl-1", "markdown": "|...|", "warnings": [] }
  ],
  "warnings": []
}
```

- `startIndex`/`endIndex` must be consistent with a single `normalizedText` string (Python computes indices after building full text).

### 2.4 Error shape

```json
{
  "ok": false,
  "errorCode": "DOCX_CORRUPT | TIMEOUT | UNSUPPORTED_FORMAT | INTERNAL",
  "message": "human-safe",
  "partial": null
}
```

Optional `partial` for best-effort `normalizedText` when recoverable.

### 2.5 Timeout behavior

- **Client of Python** (Next.js route or `runDocxImportParseJob`): `AbortSignal.timeout(MS)` around HTTP/subprocess.
- **Python service:** enforce wall-clock max (e.g. 55s) to stay under caller budget; return `TIMEOUT` JSON, not hang.
- **Vercel:** Python is **not** in-process on default Node serverless; design assumes **separate deployable** (Fly/Railway/Cloud Run) or **self-hosted** Node with Python installed. Document **env** `PYTHON_PARSER_URL` + `PYTHON_PARSER_SECRET`.

### 2.6 How Next.js calls it

1. After `saveUploadedFile` + `ContentImport` row `UPLOADED`, parse job loads bytes (`readUploadBufferByStoredPath` or buffer from upload).
2. `POST ${PYTHON_PARSER_URL}/parse` with `Authorization: Bearer ${PYTHON_PARSER_SECRET}`.
3. On success: validate body with **`PythonParserOutputSchema.safeParse`**.
4. On failure: set `pythonExtraction: null`, append `parserWarnings`, run **TS mammoth fallback** to fill `rawDocumentText` + minimal `rawSections` (optional reduced tree), set `reviewHint: 'NEEDS_REVIEW'`.

### 2.7 Zod validation (Node)

- `PythonParserOutputSchema` — strict: unknown keys stripped or rejected (`strict()` policy TBD in Phase 3).
- `ImportCandidatePayloadV2Schema` — composes `DetailsSchema` + python subtree + arrays.
- Invalid Python output → **treat as failure** → fallback + `NEEDS_REVIEW`, never silent success.

### 2.8 Fallback if Python fails

| Step | Behavior |
|------|----------|
| 1 | Log structured warning: `importId`, `errorCode`, duration. |
| 2 | Run existing **mammoth + TS** path to populate `rawDocumentText` + interim `details` (current behavior, improved in Phase 3 for accumulators). |
| 3 | Set `pythonExtraction: null`, `countValidation` from TS-only heuristics where possible. |
| 4 | Force `ContentImport.status = NEEDS_REVIEW` if raw hash changed vs previous import **or** mismatch warnings exist. |

---

## 3. Deterministic no-AI parsing improvements (design)

All implementable in **TS first** for parity; Python mirrors for production extraction.

| # | Improvement | Design |
|---|-------------|--------|
| 1 | Professional Summary vs Summary of Qualifications | **Separate accumulators:** `professionalSummaryText`, `qualificationsSummaryText` (and optional `qualificationsBullets: string[]`). `cvSectionBoundaries`: distinct `SectionType` values `professional_summary` vs `summary_of_qualifications` (or keep string detection but route to different fields). |
| 2 | No overwrite of “last summary wins” | **Append-only section log:** `rawSections[]` always receives every detected section; **structured** fields merge by policy table, not single assignment. |
| 3 | Nested patents | **Patents parent section** contains **child virtual sections** when Python sees headings “International Patent”, “Registered Korean Patents” OR TS adds sub-rules in `cvSectionBoundaries` for those lines as **child headers** under patents (level 2). `parsePatents` receives **per-subsection text** concatenated or called per child. |
| 4 | Patent segmentation | Add rules: KR patterns (`10-YYYY-XXXXXXX`), bullet + numbered lists inside patents, **line density** heuristic, **minimum chunk count vs heading number** to raise `PATENT_COUNT_MISMATCH`. |
| 5 | Research projects | Extend **`mergeCvDetailsIntoSiteContent`** to map `details.research.projects` → `next.research.projects` (with stable ids). Extend **`buildStructuredReviewBlocks`** with **Research projects** list diff (same `diffIdLists` pattern). |
| 6 | Unknown sections | Always push to `rawSections` + `unmappedSections` until mapped; never drop in `handleUnknownSection` without also storing `rawText` in `rawSections`. |

---

## 4. Section mapping layer

### 4.1 Module

- `src/server/imports/sectionMapping/` (new)
  - `aliases.ts` — canonical alias list from product spec (Professional Summary → `about.page.professionalSummaryParagraphs` / profile fields, etc.).
  - `mapRawSectionsToWebsite.ts` — input: `RawSection[]`, output: `SectionMappingReportRow[]` + fills `mappedWebsiteSection` on sections.
  - `confidence.ts` — exact / alias / fuzzy / unmapped rules (fuzzy: Levenshtein threshold on `normalizedTitle`).

### 4.2 Row content (as spec)

- `docxSectionTitle`, `mappedWebsiteSection`, `confidence`, `parserUsed`, `itemCount`, `warnings`.

### 4.3 Website targets (inventory)

Derived from Phase 1 review blocks + gaps:

- `profile.*` (subset), `contact.*`, `about.page.professionalSummaryParagraphs`, `about.journey`, `about.experiences`, `about.awards`, `teaching`, `supervision`, `service`, `publications.items`, `patents.items`, `research.interests`, **`research.projects` (new)**, home/research/publications **hero** copy (currently **unmapped** from DOCX — document as intentional or add mapping later).

---

## 5. Diff engine changes

### 5.1 Two-track diff

1. **Structured diff** — today’s `buildStructuredReviewBlocks` extended (research projects, optional more scalars).
2. **Raw diff** — always compute `sourceTextHash` vs **previous import** for same upload lineage **or** vs `rawExtract` snapshot stored on prior `ContentImport` (if retained).

### 5.2 Rule: never silent “no changes”

- If `sourceTextHash` ≠ `previousSourceTextHash` (or no previous, treat as changed on first import):
  - **Never** emit global “all clear” if structured diffs are empty.
  - Set `reviewHint: 'RAW_CHANGED_ONLY'`.
  - Inject synthetic block:

**Title:** `Raw document`  
**unchangedSummary:** `null`  
**changed:** lines explaining hash change + link to “Raw section diff” subview (truncated previews).

### 5.3 Copy when structured empty but raw changed

Exact string (product):

> **Source document changed, but no safe structured changes were detected. Please review raw section differences.**

### 5.4 Raw section diff fallback

- Compare `prior.rawSections[]` vs `current.rawSections[]` by `id` where stable; else by `(normalizedTitle, order)` with fuzzy match.
- Show per-section **added/removed** line diff (Myers or simple LCS on `items[]` lines).

---

## 6. Admin UI changes

### 6.1 New grouped panels (import review page + upload preview when wired)

1. **Safe parsed changes** — existing structured blocks where `reviewHint === READY` subset.
2. **Needs review** — `NEEDS_REVIEW` / `RAW_CHANGED_ONLY` + any `confidence: fuzzy`.
3. **Count mismatches** — table from `countValidation.entries` with `severity`.
4. **Unmapped sections** — list from `unmappedSections` + actions (Phase 3: stub buttons storing operator intent in local state; Phase 4: persist mapping overrides on `ContentImport` JSON column `reviewDecisions` optional).
5. **Raw changed sections** — subsection under Raw diff.
6. **Parser warnings** — filterable list.
7. **Optional AI suggestions** — collapsed panel; hidden when `AI_PROVIDER=none`.

### 6.2 Create draft gate

- **Allow merge-to-draft** only when:
  - `acknowledgedWarningIds` (client + optional server echo) includes all `severity === 'error'` and configurable `warning` codes; **and**
  - every `unmappedSections` entry has decision `map | ignore | raw_note | reviewed` (stored in `reviewDecisions` on import row or session).

Server must **re-validate** decisions on `POST merge-to-draft` (not UI-only).

---

## 7. Optional AI layer (design only)

### 7.1 Config

- `AI_PROVIDER=none | ollama | gemini | groq`
- Provider-specific vars **optional**; missing → AI panel disabled, **no** throw.

### 7.2 Interface

- `src/server/imports/ai/aiProvider.ts` — `classifySections`, `suggestMapping`, `explainCountMismatch` — all return **`AiSuggestionEnvelope`** validated by Zod, **never** `SiteContent` patches.

### 7.3 `SiteStructureProposal` (when AI enabled + mismatch)

```ts
type SiteStructureProposal = {
  type: 'site_structure_proposal';
  reason: string;
  docxSection: string;
  suggestedAction: 'add_section' | 'map_to_existing' | 'ignore' | 'manual_review';
  minimalCodeChange: {
    filesLikelyAffected: string[];
    schemaChangeNeeded: boolean;
    uiChangeNeeded: boolean;
    risk: 'low' | 'medium' | 'high';
  };
  adminMessage: string;
  confidence: number;
};
```

- Stored in `candidatePayload.aiProposals[]` or separate `ContentImport.aiArtifacts` JSON (prefer **inside candidatePayload** v2 under `ai?: { proposals: ... }` to avoid migration).

### 7.4 Hard bans

- No auto-publish, no prisma migrate from AI, no file writes from AI, no bypass of acknowledge gate.

---

## 8. Testing plan

### 8.1 Fixtures

- Add `src/tests/fixtures/cv/original.docx` and `test.docx` (or **redacted** copies: same heading structure + paragraph counts + patent markers, anonymized names).  
- `.gitattributes` / size check: if too large, store **zipped** fixtures under `src/tests/fixtures/cv/*.zip` and unzip in test `beforeAll`.

### 8.2 Cases (map to Phase K)

| Test | Assertion |
|------|------------|
| Metaverse → MMMMMM | `professionalSummaryText` or mapped paragraph contains `MMMMMM`; raw hash changes. |
| Removed SoQ bullets | `qualifications` slice or `rawSections` diff shows removed lines; not overwritten by prof summary. |
| Inserted research project | `details.research.projects` length +1 and **merged** `SiteContent.research.projects` + review block. |
| Inserted award / journal | `diffIdLists` added row or raw fallback. |
| Korean patents subsection | `rawSections` child under Patents; extracted count >> 5 when fixture has 52-like markers. |
| Count mismatch | `PATENT_COUNT_MISMATCH` in `countValidation`. |
| Raw changed, structured empty | Force mapper to no-op; assert UI gate string + `reviewHint`. |

### 8.3 Runner

- Vitest + **happy-dom** only for React; parser tests in **node** env.
- Optional: Python contract tests in `pytest` in `parser_py/` (same repo).

---

## 9. Migration & backward compatibility

### 9.1 Old payloads

- `parseCandidatePayload(json)`:
  - No `schemaVersion` → treat as **v1** `Details` only.
  - `schemaVersion === 2` → full v2 validation.

### 9.2 Prisma migration

- **Not required** for v2 if `candidatePayload` remains `Json` and `rawExtract` remains `Json` (reuse `rawExtract` for prior raw snapshot **or** deprecate in favor of v2 fields inside `candidatePayload`).
- **Optional** later: `ContentImport.reviewDecisions Json?`, `ContentImport.previousSourceTextHash String?` for faster diff without loading prior row.

### 9.3 Deploy order

1. Deploy Node changes with **read** support for v1 + v2 and **write** v2 for new imports only.
2. Deploy Python service (if separate).
3. Enable `PYTHON_PARSER_URL` in production.
4. Re-import **not** required for old rows; old imports keep v1 until re-uploaded.

### 9.4 Rollback

- Feature flag `IMPORT_CANDIDATE_SCHEMA_VERSION=1|2` (env).
- Rollback: set flag to `1`; new uploads use v1 path; v2 rows remain readable but UI may hide v2-only panels if flag off.

---

## 10. Phase 3 — file-level implementation order (minimal safe no-AI first)

1. **`src/server/imports/candidatePayload/`** — Zod v2 + parser + migration from v1.
2. **`src/server/imports/sectionMapping/`** — aliases + mapper + `countValidation` from headings.
3. **`src/parser/`** — TS fixes: split summary types, patent subsections, patent split heuristics, preserve section list.
4. **`src/server/imports/detailsToSiteContentMerge.ts`** — merge `research.projects`.
5. **`src/server/imports/importReviewStructured.ts`** + **`importReviewCompare.ts`** — research projects block + raw diff block + `reviewHint`.
6. **`src/server/imports/runDocxImportParseJob.ts`** / **`processDocxUploadImport.ts`** — assemble v2 payload; store `sourceTextHash`.
7. **`src/app/admin/imports/`** — UI panels + acknowledge + merge gate API.
8. **`src/app/api/admin/imports/[id]/merge-to-draft/route.ts`** — server-side gate.
9. **Python package** `parser_py/` + Dockerfile / deploy doc — HTTP `/parse` + Zod mirror optional.
10. **Fixtures + tests** per §8.

---

*End of Phase 2 design document.*
