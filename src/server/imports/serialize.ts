import 'server-only';

import type { ContentImport, UploadedFile } from '@prisma/client';

import { getDetailsFromCandidatePayload, parseImportCandidatePayload } from '@/server/imports/candidatePayload/schema';
import { countUnresolvedBlockingDecisions } from '@/server/imports/importCandidateReview/gate';
import { loadImportReviewStateFromRow } from '@/server/imports/importCandidateReview/reconcile';
import { buildImportCandidateReviewStateDto } from '@/server/imports/importCandidateReview/state';
import {
  importWarningItemSchema,
  type ImportCandidateReconcileReviewDto,
  type ImportCandidateReviewMetadataDto,
  type ImportCandidateSummaryDto,
  type ImportDetailDto,
  type ImportRawSectionSummaryDto,
  type ImportSectionMappingRowDto,
  type ImportSummaryDto,
  type ImportWarningItem,
} from '@/server/imports/types';

const MAX_REVIEW_SECTION_ROWS = 200;
const RAW_TEXT_PREVIEW_MAX = 120;

export function parseImportWarnings(input: unknown): ImportWarningItem[] {
  const parsed = importWarningItemSchema.array().safeParse(input);
  return parsed.success ? parsed.data : [];
}

type ImportWithFile = ContentImport & { uploadedFile: UploadedFile };

type ImportWithFileAndVersions = ImportWithFile & {
  versions: { id: string }[];
};

export function toImportSummary(row: ImportWithFile): ImportSummaryDto {
  return {
    id: row.id,
    uploadedFileId: row.uploadedFileId,
    status: row.status,
    parserVersion: row.parserVersion,
    originalFileName: row.uploadedFile.originalName,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function inferParserWarningSeverity(w: { code?: string; message: string }): 'info' | 'warning' | 'error' {
  const code = (w.code ?? '').toUpperCase();
  const msg = w.message;
  if (/\[error\]/i.test(msg) || code === 'PARSE_EXCEPTION') {
    return 'error';
  }
  if (
    code === 'PATENT_COUNT_MISMATCH' ||
    code === 'VALIDATION' ||
    code === 'RAW_CHANGED_ONLY' ||
    code === 'MISSING_CONTACT_EMAIL' ||
    code === 'EMPTY_PUBLICATIONS'
  ) {
    return 'warning';
  }
  return 'info';
}

/**
 * Compact envelope metadata for admin GET import detail (no full `rawDocumentText`).
 */
export function buildImportCandidateReviewMetadata(payload: unknown): ImportCandidateReviewMetadataDto | null {
  const parsed = parseImportCandidatePayload(payload);
  if (!parsed) {
    return null;
  }
  const pairCap = Math.min(parsed.rawSections.length, parsed.sectionMappingReport.length, MAX_REVIEW_SECTION_ROWS);
  const rawSectionSummaries: ImportRawSectionSummaryDto[] = [];
  for (let i = 0; i < pairCap; i += 1) {
    const rs = parsed.rawSections[i]!;
    const mr = parsed.sectionMappingReport[i]!;
    const trimmed = rs.rawText.trim();
    let textPreview: string | undefined;
    if (trimmed.length > 0) {
      textPreview =
        trimmed.length > RAW_TEXT_PREVIEW_MAX ? `${trimmed.slice(0, RAW_TEXT_PREVIEW_MAX)}…` : trimmed;
    }
    rawSectionSummaries.push({
      sectionId: rs.id,
      title: mr.docxSectionTitle,
      mappedWebsiteSection: mr.mappedWebsiteSection,
      confidence: mr.confidence,
      itemCount: mr.itemCount,
      warningCount: mr.warnings.length + rs.warnings.length,
      textPreview,
    });
  }

  const mapRow = (mr: (typeof parsed.sectionMappingReport)[number]): ImportSectionMappingRowDto => ({
    docxSectionTitle: mr.docxSectionTitle,
    normalizedTitle: mr.normalizedTitle,
    mappedWebsiteSection: mr.mappedWebsiteSection,
    confidence: mr.confidence,
    parserUsed: mr.parserUsed,
    itemCount: mr.itemCount,
    warningCount: mr.warnings.length,
  });

  return {
    schemaVersion: parsed.schemaVersion,
    envelopeVersion: parsed.envelopeVersion,
    reviewHint: parsed.reviewHint,
    sourceTextHash: parsed.sourceTextHash,
    parserVersion: parsed.parserVersion,
    mappingVersion: parsed.mappingVersion,
    rawSectionSummaries,
    unmappedSections: parsed.unmappedSections.map((u) => ({ ...u })),
    sectionMappingReport: parsed.sectionMappingReport.slice(0, MAX_REVIEW_SECTION_ROWS).map(mapRow),
    countValidation: {
      entries: parsed.countValidation.entries.map((e) => ({ ...e })),
    },
    parserWarnings: parsed.parserWarnings.map((w) => ({
      code: w.code,
      path: w.path,
      message: w.message,
      severity: inferParserWarningSeverity(w),
    })),
  };
}

export function buildImportCandidateSummary(payload: unknown): ImportCandidateSummaryDto | null {
  const details = getDetailsFromCandidatePayload(payload);
  if (!details) {
    return null;
  }
  const profile = details.profile;
  return {
    profileName: typeof profile.name === 'string' ? profile.name : null,
    publicationCount: details.publications.length,
    patentCount: details.patents.length,
    rawHtmlTruncated: Boolean((details as { rawHtmlTruncated?: boolean }).rawHtmlTruncated),
  };
}

export function buildImportCandidateReconcileReview(
  row: Pick<ContentImport, 'reviewManifest' | 'reviewApprovals'>,
): ImportCandidateReconcileReviewDto | null {
  const loaded = loadImportReviewStateFromRow({
    reviewManifest: row.reviewManifest,
    reviewApprovals: row.reviewApprovals,
    candidatePayload: null,
  });
  if (!loaded) {
    return null;
  }
  return buildImportCandidateReviewStateDto({
    manifestEnvelope: loaded.manifestEnvelope,
    manifest: loaded.manifest,
    approvalsEnvelope: loaded.approvalsEnvelope,
    approvals: loaded.approvals,
    unresolvedBlockingCount: countUnresolvedBlockingDecisions(loaded.manifest),
  });
}

export function toImportDetail(row: ImportWithFileAndVersions): ImportDetailDto {
  const summary = toImportSummary(row);
  const detailsOnly = getDetailsFromCandidatePayload(row.candidatePayload);
  return {
    ...summary,
    mimeType: row.uploadedFile.mimeType,
    sizeBytes: row.uploadedFile.sizeBytes,
    sha256: row.uploadedFile.sha256,
    sourceFormat: row.uploadedFile.sourceFormat,
    rawPreviewPath: row.rawPreviewPath,
    rawExtract: row.rawExtract,
    candidatePayload: (detailsOnly ?? row.candidatePayload) as ImportDetailDto['candidatePayload'],
    candidateSummary: buildImportCandidateSummary(row.candidatePayload),
    candidateReview: buildImportCandidateReviewMetadata(row.candidatePayload),
    candidateReconcileReview: buildImportCandidateReconcileReview(row),
    warnings: parseImportWarnings(row.warnings),
    linkedVersionIds: row.versions.map((v: { id: string }) => v.id),
  };
}
