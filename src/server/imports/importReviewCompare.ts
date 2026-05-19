import 'server-only';

import { SITE_CONTENT_RAW } from '@/content/defaults';
import { assertSiteContent, validateSiteContent } from '@/content/validators';
import { getWorkingDraft } from '@/server/content/contentWorkflowCore';
import { getDetailsFromCandidatePayload, parseImportCandidatePayload } from '@/server/imports/candidatePayload/schema';
import { mergeCvDetailsIntoSiteContent } from '@/server/imports/detailsToSiteContentMerge';
import {
  buildStructuredReviewBlocks,
  LEGACY_UPLOADS_META_NOTE,
  structuredMergeDiffIsVacuous,
  type ImportReviewBlock,
  type ImportReviewProvenance,
} from '@/server/imports/importReviewStructured';
import { getContentImportDetail, getPriorImportSourceTextHash } from '@/server/imports/repository';

export type { ImportReviewBlock } from '@/server/imports/importReviewStructured';

export type ImportReviewPayload = {
  baselineSource: 'working_draft' | 'canonical';
  blocks: ImportReviewBlock[];
  warnings: { message: string; code?: string }[];
  provenance: ImportReviewProvenance | null;
  legacyUploadsMetaNote: string;
};

/**
 * Builds structured review (added / removed / changed + scalar summaries) for the import admin UI.
 */
export async function buildImportReviewPayload(importId: string): Promise<ImportReviewPayload> {
  const row = await getContentImportDetail(importId);
  if (!row) {
    throw new Error('Import not found');
  }
  const warnings = Array.isArray(row.warnings)
    ? (row.warnings as { message: string; code?: string }[])
    : [];

  const working = await getWorkingDraft();
  const baselineSource = working ? 'working_draft' : 'canonical';
  const baselinePayload = working
    ? validateSiteContent(working.payload)
    : validateSiteContent(SITE_CONTENT_RAW);
  const baseline =
    baselinePayload.success && baselinePayload.data
      ? baselinePayload.data
      : assertSiteContent(SITE_CONTENT_RAW);

  const parsed = getDetailsFromCandidatePayload(row.candidatePayload);
  if (!parsed) {
    return {
      baselineSource,
      blocks: [
        {
          id: 'candidate',
          title: 'Candidate',
          unchangedSummary: null,
          added: [],
          removed: [],
          changed: [
            {
              label: 'Parse / storage',
              lines: [
                'Stored candidate is not valid Details JSON (legacy root or v2 `details`) — merge is blocked until the candidate is valid.',
              ],
            },
          ],
        },
      ],
      warnings,
      provenance: {
        importId: row.id,
        originalFileName: row.uploadedFile.originalName,
        storedPath: row.uploadedFile.storedPath,
        uploadedFileId: row.uploadedFile.id,
      },
      legacyUploadsMetaNote: LEGACY_UPLOADS_META_NOTE,
    };
  }

  const mergedCandidate = mergeCvDetailsIntoSiteContent(parsed, baseline);
  const provenance: ImportReviewProvenance = {
    importId: row.id,
    originalFileName: row.uploadedFile.originalName,
    storedPath: row.uploadedFile.storedPath,
    uploadedFileId: row.uploadedFile.id,
  };
  let blocks = buildStructuredReviewBlocks(baseline, mergedCandidate, provenance);

  const envelope = parseImportCandidatePayload(row.candidatePayload);
  const curHash = envelope?.sourceTextHash ?? null;
  const priorHash =
    curHash !== null
      ? await getPriorImportSourceTextHash({
          originalName: row.uploadedFile.originalName,
          beforeCreatedAt: row.createdAt,
          excludeImportId: row.id,
        })
      : null;

  const reviewWarnings = [...warnings];
  if (priorHash && curHash && priorHash !== curHash && structuredMergeDiffIsVacuous(blocks)) {
    const head = blocks[0]!;
    const rest = blocks.slice(1);
    blocks = [
      head,
      {
        id: 'raw_document_change',
        title: 'Raw document drift',
        unchangedSummary: null,
        added: [],
        removed: [],
        changed: [
          {
            label: 'Structured diff empty',
            lines: [
              'Source document changed, but no safe structured changes were detected. Please review raw section differences.',
            ],
          },
        ],
      },
      ...rest,
    ];
    reviewWarnings.push({
      code: 'RAW_CHANGED_ONLY',
      message:
        'Source document changed, but no safe structured changes were detected. Please review raw section differences.',
    });
  }

  return {
    baselineSource,
    blocks,
    warnings: reviewWarnings,
    provenance,
    legacyUploadsMetaNote: LEGACY_UPLOADS_META_NOTE,
  };
}
