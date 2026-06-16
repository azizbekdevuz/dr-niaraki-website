import type { ImportStatus, Prisma } from '@prisma/client';
import { z } from 'zod';

/** Single warning shown in admin / future review UI; stored on `ContentImport.warnings` as JSON. */
export const importWarningItemSchema = z.object({
  message: z.string().min(1),
  code: z.string().optional(),
  path: z.string().optional(),
});

export type ImportWarningItem = z.infer<typeof importWarningItemSchema>;

/** Parser / normalizer output before mapping to site content — not canonical draft. */
export type RawExtractResult = Prisma.InputJsonValue;

/** Parsed candidate for a later review/merge phase — never live `SiteContent` until explicitly merged. */
export type CandidateParsedPayload = Prisma.InputJsonValue;

export type ImportSummaryDto = {
  id: string;
  uploadedFileId: string;
  status: ImportStatus;
  parserVersion: string | null;
  originalFileName: string;
  createdAt: string;
  updatedAt: string;
};

export type ImportCandidateSummaryDto = {
  profileName: string | null;
  publicationCount: number;
  patentCount: number;
  rawHtmlTruncated: boolean;
};

export type ImportParserWarningItemDto = {
  code?: string;
  path?: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
};

export type ImportCountValidationEntryDto = {
  domain: string;
  declaredInHeading: number | null;
  extractedCount: number;
  severity: 'info' | 'warning' | 'error';
  code: string;
};

export type ImportCountValidationDto = {
  entries: ImportCountValidationEntryDto[];
};

export type ImportUnmappedSectionDto = {
  sectionId: string;
  title: string;
  reason: string;
};

/** Per-section compact line for admin review (no full raw text). */
export type ImportRawSectionSummaryDto = {
  sectionId: string;
  title: string;
  mappedWebsiteSection: string | null;
  confidence: 'exact' | 'alias' | 'fuzzy' | 'unmapped';
  itemCount: number;
  warningCount: number;
  /** Truncated preview only; omitted when empty */
  textPreview?: string;
};

export type ImportSectionMappingRowDto = {
  docxSectionTitle: string;
  normalizedTitle: string;
  mappedWebsiteSection: string | null;
  confidence: 'exact' | 'alias' | 'fuzzy' | 'unmapped';
  parserUsed: string;
  itemCount: number;
  warningCount: number;
};

/**
 * Envelope-only metadata for import review UI (GET import detail / review).
 * Omits `rawDocumentText`; includes hashes and compact section summaries only.
 */
export type ImportCandidateReviewMetadataDto = {
  schemaVersion: number;
  envelopeVersion: number;
  reviewHint: 'READY' | 'NEEDS_REVIEW' | 'RAW_CHANGED_ONLY';
  sourceTextHash: string;
  parserVersion: string;
  mappingVersion: string;
  rawSectionSummaries: ImportRawSectionSummaryDto[];
  unmappedSections: ImportUnmappedSectionDto[];
  sectionMappingReport: ImportSectionMappingRowDto[];
  countValidation: ImportCountValidationDto;
  parserWarnings: ImportParserWarningItemDto[];
};

export type ImportCandidateReconcileReviewDto = {
  hasManifest: boolean;
  manifestRevision: string | null;
  sourceTextHash: string | null;
  baseline: {
    sourceType: string;
    versionId?: string | null;
    publishSequence?: number | null;
    label?: string | null;
  } | null;
  generatedAt: string | null;
  importSource: string | null;
  decisions: Array<{
    decisionId: string;
    section: string;
    candidateId?: string;
    existingId?: string;
    relatedExistingIds?: string[];
    action: string;
    reason: string;
    confidence: string;
    affectedCount?: number;
  }>;
  accounting: Prisma.JsonValue | null;
  analysisAccounting: Prisma.JsonValue | null;
  approvals: Array<{
    decisionId: string;
    approvedAction: string;
    selectedExistingId?: string;
  }>;
  approvalsUpdatedAt: string | null;
  unresolvedBlockingCount: number;
  mergeReviewBlocked: boolean;
  advisoryOnly: boolean;
  loadError: {
    code: 'REVIEW_MANIFEST_INVALID' | 'REVIEW_APPROVALS_INVALID' | 'REVIEW_APPROVALS_STALE';
    message: string;
  } | null;
};

export type ImportDetailDto = ImportSummaryDto & {
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  sourceFormat: string;
  rawPreviewPath: string | null;
  rawExtract: Prisma.JsonValue | null;
  candidatePayload: Prisma.JsonValue | null;
  candidateSummary: ImportCandidateSummaryDto | null;
  /** Present when `candidatePayload` is a parsed envelope (`schemaVersion` === 2). */
  candidateReview: ImportCandidateReviewMetadataDto | null;
  /** Candidate-vs-baseline reconciliation manifest and approvals. */
  candidateReconcileReview: ImportCandidateReconcileReviewDto | null;
  warnings: ImportWarningItem[];
  linkedVersionIds: string[];
};

export class ImportDomainError extends Error {
  constructor(
    readonly code: 'UPLOADED_FILE_NOT_FOUND' | 'IMPORT_NOT_FOUND',
    message: string,
  ) {
    super(message);
    this.name = 'ImportDomainError';
  }
}
