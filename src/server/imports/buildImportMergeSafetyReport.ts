import 'server-only';

import type { SiteContent } from '@/content/schema';
import { extractEditorSliceFromSiteContent } from '@/lib/draftEditorSlice';
import { deriveImportQualityHints } from '@/server/imports/deriveImportQualityHints';
import { mergeCvDetailsIntoSiteContent } from '@/server/imports/detailsToSiteContentMerge';
import {
  evaluateImportMergeSectionSafety,
  type ImportMergeSafetyReport,
} from '@/server/imports/importMergeSectionSafety';
import {
  buildStructuredReviewBlocks,
  type ImportReviewProvenance,
} from '@/server/imports/importReviewStructured';
import { buildImportCandidateReviewMetadata } from '@/server/imports/serialize';
import { sanitizeImportedSummary } from '@/server/imports/summarySanitize';
import type { DetailsSchemaType } from '@/validators/detailsSchema';

export type BuildImportMergeSafetyReportInput = {
  details: DetailsSchemaType;
  mergeBaseline: SiteContent;
  candidatePayload: unknown;
  provenance: ImportReviewProvenance;
};

export type BuildImportMergeSafetyReportResult = {
  mergedFull: SiteContent;
  mergeSafety: ImportMergeSafetyReport;
};

/**
 * Builds the merge-policy safety report from imported Details against the working-draft (or canonical) merge baseline.
 * Shared by import review (`buildImportReviewPayload`) and merge (`mergeImportCandidateToWorkingDraft`).
 */
export function buildImportMergeSafetyReport(
  input: BuildImportMergeSafetyReportInput,
): BuildImportMergeSafetyReportResult {
  const { details, mergeBaseline, candidatePayload, provenance } = input;

  const mergedFull = mergeCvDetailsIntoSiteContent(details, mergeBaseline);
  const safetyBlocks = buildStructuredReviewBlocks(mergeBaseline, mergedFull, provenance);
  const mergeBaselineSlice = extractEditorSliceFromSiteContent(mergeBaseline);
  const mergedFullSlice = extractEditorSliceFromSiteContent(mergedFull);
  const { trimNotes: summaryTrimNotes } = sanitizeImportedSummary({
    profileSummary: details.profile.summary ?? undefined,
    brief: details.about.brief ?? undefined,
    full: details.about.full ?? undefined,
    profileTitle: details.profile.title ?? undefined,
    cvSummaryMergePolicy: details.meta?.cvSummaryMergePolicy ?? undefined,
  });
  const mergeSafety = evaluateImportMergeSectionSafety({
    reviewBlocks: safetyBlocks,
    candidateReview: buildImportCandidateReviewMetadata(candidatePayload),
    cvNarrativeSections: details.about.cvNarrativeSections,
    summarySizeHint: {
      importedChars: mergedFullSlice.aboutProfessionalSummaryText.length,
      baselineChars: mergeBaselineSlice.aboutProfessionalSummaryText.length,
    },
    qualityHints: deriveImportQualityHints(details, mergeBaseline),
    summaryTrimNotes,
  });

  return { mergedFull, mergeSafety };
}
