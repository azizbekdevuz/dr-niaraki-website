import type { Details } from '@/types/details';
import type { SectionType } from '@/types/parser';

/** Stored JSON `schemaVersion` for the import envelope (monotonic; bump when shape breaks). */
export const CANDIDATE_PAYLOAD_SCHEMA_VERSION = 2 as const;

/** Stored JSON `envelopeVersion` for ancillary envelope fields alongside `details`. */
export const CANDIDATE_PAYLOAD_ENVELOPE_VERSION = 1 as const;

/** Raw section slice preserved from DOCX text pipeline (indices optional until Python path). */
export type ImportRawSection = {
  id: string;
  parentId: string | null;
  title: string;
  normalizedTitle: string;
  level: number;
  startIndex: number;
  endIndex: number;
  rawText: string;
  sectionType: SectionType;
  source: 'typescript';
  warnings: string[];
};

export type ImportUnmappedSectionRef = {
  sectionId: string;
  title: string;
  reason: string;
};

export type SectionMappingConfidence = 'exact' | 'alias' | 'fuzzy' | 'unmapped';

export type SectionMappingReportRow = {
  docxSectionId: string;
  docxSectionTitle: string;
  normalizedTitle: string;
  mappedWebsiteSection: string | null;
  confidence: SectionMappingConfidence;
  parserUsed: string;
  itemCount: number;
  warnings: string[];
};

export type CountValidationEntry = {
  domain: string;
  declaredInHeading: number | null;
  extractedCount: number;
  severity: 'info' | 'warning' | 'error';
  code: string;
};

export type CountValidation = {
  entries: CountValidationEntry[];
};

export type ImportReviewHint = 'READY' | 'NEEDS_REVIEW' | 'RAW_CHANGED_ONLY';

/** Current import candidate envelope (Prisma `ContentImport.candidatePayload`). */
export type ImportCandidatePayload = {
  schemaVersion: typeof CANDIDATE_PAYLOAD_SCHEMA_VERSION;
  envelopeVersion: typeof CANDIDATE_PAYLOAD_ENVELOPE_VERSION;
  sourceTextHash: string;
  parserVersion: string;
  mappingVersion: string;
  rawDocumentText: string;
  details: Details;
  rawSections: ImportRawSection[];
  unmappedSections: ImportUnmappedSectionRef[];
  sectionMappingReport: SectionMappingReportRow[];
  countValidation: CountValidation;
  parserWarnings: { message: string; code?: string; path?: string }[];
  reviewHint: ImportReviewHint;
};
