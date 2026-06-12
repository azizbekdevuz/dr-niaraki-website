import 'server-only';

import { SITE_CONTENT_RAW } from '@/content/defaults';
import { assertSiteContent, validateSiteContent } from '@/content/validators';
import { extractEditorSliceFromSiteContent } from '@/lib/draftEditorSlice';
import { getLatestPublishedVersion, getWorkingDraft } from '@/server/content/contentWorkflowCore';
import { getDetailsFromCandidatePayload, parseImportCandidatePayload } from '@/server/imports/candidatePayload/schema';
import { mergeCvDetailsIntoSiteContent } from '@/server/imports/detailsToSiteContentMerge';
import {
  evaluateImportMergeSectionSafety,
  type ImportMergeSafetyReport,
} from '@/server/imports/importMergeSectionSafety';
import {
  buildStructuredReviewBlocks,
  LEGACY_UPLOADS_META_NOTE,
  structuredMergeDiffIsVacuous,
  type ImportReviewBlock,
  type ImportReviewProvenance,
} from '@/server/imports/importReviewStructured';
import { getContentImportDetail, getPriorImportSourceTextHash } from '@/server/imports/repository';
import {
  resolveImportReviewBaseline,
  type ReviewBaselineCapabilities,
  type ReviewBaselineMode,
} from '@/server/imports/reviewBaseline';
import { buildImportCandidateReviewMetadata } from '@/server/imports/serialize';
import { sanitizeImportedSummary } from '@/server/imports/summarySanitize';
export type { ImportReviewBlock } from '@/server/imports/importReviewStructured';

export type ImportReviewPayload = {
  baselineSource: 'working_draft' | 'canonical' | 'published';
  /** Human-readable baseline description (shown in admin UI). */
  baselineLabel: string;
  baselineCapabilities: ReviewBaselineCapabilities;
  blocks: ImportReviewBlock[];
  warnings: { message: string; code?: string }[];
  provenance: ImportReviewProvenance | null;
  legacyUploadsMetaNote: string;
  mergeSafety: ImportMergeSafetyReport;
};

async function applyRawDocumentDriftGate(input: {
  importId: string;
  originalName: string;
  createdAt: Date;
  candidatePayload: unknown;
  blocks: ImportReviewBlock[];
  reviewWarnings: { message: string; code?: string }[];
}): Promise<{ blocks: ImportReviewBlock[]; reviewWarnings: { message: string; code?: string }[] }> {
  const reviewWarnings = [...input.reviewWarnings];
  let blocks = input.blocks;
  const envelope = parseImportCandidatePayload(input.candidatePayload);
  const curHash = envelope?.sourceTextHash ?? null;
  const priorHash =
    curHash !== null
      ? await getPriorImportSourceTextHash({
          originalName: input.originalName,
          beforeCreatedAt: input.createdAt,
          excludeImportId: input.importId,
        })
      : null;

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

  return { blocks, reviewWarnings };
}

/**
 * Builds structured review (added / removed / changed + scalar summaries) for the import admin UI.
 */
export async function buildImportReviewPayload(
  importId: string,
  opts?: { baseline?: ReviewBaselineMode },
): Promise<ImportReviewPayload> {
  const row = await getContentImportDetail(importId);
  if (!row) {
    throw new Error('Import not found');
  }
  const warnings = Array.isArray(row.warnings)
    ? (row.warnings as { message: string; code?: string }[])
    : [];

  const mode = opts?.baseline ?? 'auto';
  const working = await getWorkingDraft();
  const published = await getLatestPublishedVersion();
  const resolved = resolveImportReviewBaseline(mode, {
    workingDraftPayload: working?.payload ?? null,
    publishedPayload: published?.payload ?? null,
    publishedSequence: published?.publishSequence ?? null,
    publishedVersionId: published?.id ?? null,
  });
  const { baseline, baselineSource, baselineLabel, fallbackWarnings, capabilities } = resolved;

  const parsed = getDetailsFromCandidatePayload(row.candidatePayload);
  if (!parsed) {
    return {
      baselineSource,
      baselineLabel,
      baselineCapabilities: capabilities,
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
      warnings: [...warnings, ...fallbackWarnings],
      provenance: {
        importId: row.id,
        originalFileName: row.uploadedFile.originalName,
        storedPath: row.uploadedFile.storedPath,
        uploadedFileId: row.uploadedFile.id,
      },
      legacyUploadsMetaNote: LEGACY_UPLOADS_META_NOTE,
      mergeSafety: {
        defaultMergeMode: 'safe_update',
        fullReplaceRequiresAck: true,
        sections: [],
        notes: ['Candidate is not valid Details JSON — merge is not available.'],
      },
    };
  }

  const provenance: ImportReviewProvenance = {
    importId: row.id,
    originalFileName: row.uploadedFile.originalName,
    storedPath: row.uploadedFile.storedPath,
    uploadedFileId: row.uploadedFile.id,
  };

  const mergeBaselineRes = working
    ? validateSiteContent(working.payload)
    : validateSiteContent(SITE_CONTENT_RAW);
  const mergeBaseline =
    mergeBaselineRes.success && mergeBaselineRes.data ? mergeBaselineRes.data : assertSiteContent(SITE_CONTENT_RAW);
  const mergedForMergePolicy = mergeCvDetailsIntoSiteContent(parsed, mergeBaseline);
  const mergeSafetyBlocks = buildStructuredReviewBlocks(mergeBaseline, mergedForMergePolicy, provenance);
  const mergeBaselineSlice = extractEditorSliceFromSiteContent(mergeBaseline);
  const mergedForMergePolicySlice = extractEditorSliceFromSiteContent(mergedForMergePolicy);
  const { trimNotes: summaryTrimNotes } = sanitizeImportedSummary({
    profileSummary: parsed.profile.summary ?? undefined,
    brief: parsed.about.brief ?? undefined,
    full: parsed.about.full ?? undefined,
    profileTitle: parsed.profile.title ?? undefined,
    cvSummaryMergePolicy: parsed.meta?.cvSummaryMergePolicy ?? undefined,
  });
  const mergeSafety = evaluateImportMergeSectionSafety({
    reviewBlocks: mergeSafetyBlocks,
    candidateReview: buildImportCandidateReviewMetadata(row.candidatePayload),
    cvNarrativeSections: parsed.about.cvNarrativeSections,
    summarySizeHint: {
      importedChars: mergedForMergePolicySlice.aboutProfessionalSummaryText.length,
      baselineChars: mergeBaselineSlice.aboutProfessionalSummaryText.length,
    },
    qualityHints: {
      journeyCollapse: {
        importedCount: parsed.about.education.length,
        baselineCount: mergeBaseline.about.journey.length,
        hasGiantRows: parsed.about.education.some(
          (e) => (e.details?.length ?? 0) > 400 || (e.raw?.length ?? 0) > 400,
        ),
      },
      experienceQuality: {
        unknownOrgCount: parsed.about.positions.filter((p) => p.institution === 'Unknown Organization').length,
        totalCount: parsed.about.positions.length,
      },
    },
    summaryTrimNotes,
  });

  const mergedCandidate = mergeCvDetailsIntoSiteContent(parsed, baseline);
  const blocks = buildStructuredReviewBlocks(baseline, mergedCandidate, provenance);

  const reviewWarnings = [...warnings, ...fallbackWarnings];
  const drift = await applyRawDocumentDriftGate({
    importId: row.id,
    originalName: row.uploadedFile.originalName,
    createdAt: row.createdAt,
    candidatePayload: row.candidatePayload,
    blocks,
    reviewWarnings,
  });

  return {
    baselineSource,
    baselineLabel,
    baselineCapabilities: capabilities,
    blocks: drift.blocks,
    warnings: drift.reviewWarnings,
    provenance,
    legacyUploadsMetaNote: LEGACY_UPLOADS_META_NOTE,
    mergeSafety,
  };
}

export { parseReviewBaselineMode, type ReviewBaselineMode } from '@/server/imports/reviewBaseline';
