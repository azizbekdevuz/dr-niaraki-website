import { z } from 'zod';

import {
  CANDIDATE_PAYLOAD_ENVELOPE_VERSION,
  CANDIDATE_PAYLOAD_SCHEMA_VERSION,
  type ImportCandidatePayload,
  type ImportRawSection,
  type ImportReviewHint,
} from '@/server/imports/candidatePayload/types';
import { DetailsSchema, type DetailsSchemaType } from '@/validators/detailsSchema';

const importWarningLooseSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  path: z.string().optional(),
});

export const ImportRawSectionSchema = z.object({
  id: z.string().min(1),
  parentId: z.string().nullable(),
  title: z.string(),
  normalizedTitle: z.string(),
  level: z.number().int().nonnegative(),
  startIndex: z.number().int().nonnegative(),
  endIndex: z.number().int().nonnegative(),
  rawText: z.string(),
  sectionType: z.string().min(1),
  source: z.literal('typescript'),
  warnings: z.array(z.string()),
});

export const ImportUnmappedSectionRefSchema = z.object({
  sectionId: z.string().min(1),
  title: z.string(),
  reason: z.string(),
});

export const SectionMappingReportRowSchema = z.object({
  docxSectionId: z.string().min(1),
  docxSectionTitle: z.string(),
  normalizedTitle: z.string(),
  mappedWebsiteSection: z.string().nullable(),
  confidence: z.enum(['exact', 'alias', 'fuzzy', 'unmapped']),
  parserUsed: z.string(),
  itemCount: z.number().int().nonnegative(),
  warnings: z.array(z.string()),
});

export const CountValidationEntrySchema = z.object({
  domain: z.string().min(1),
  declaredInHeading: z.number().int().nonnegative().nullable(),
  extractedCount: z.number().int().nonnegative(),
  severity: z.enum(['info', 'warning', 'error']),
  code: z.string().min(1),
});

export const CountValidationSchema = z.object({
  entries: z.array(CountValidationEntrySchema),
});

export const ImportCandidatePayloadSchema = z.object({
  schemaVersion: z.literal(CANDIDATE_PAYLOAD_SCHEMA_VERSION),
  envelopeVersion: z.literal(CANDIDATE_PAYLOAD_ENVELOPE_VERSION),
  sourceTextHash: z.string().min(32),
  parserVersion: z.string().min(1),
  mappingVersion: z.string().min(1),
  rawDocumentText: z.string(),
  details: DetailsSchema,
  rawSections: z.array(ImportRawSectionSchema),
  unmappedSections: z.array(ImportUnmappedSectionRefSchema),
  sectionMappingReport: z.array(SectionMappingReportRowSchema),
  countValidation: CountValidationSchema,
  parserWarnings: z.array(importWarningLooseSchema),
  reviewHint: z.enum(['READY', 'NEEDS_REVIEW', 'RAW_CHANGED_ONLY']),
});

export type ImportCandidatePayloadParsed = z.infer<typeof ImportCandidatePayloadSchema>;

/** Legacy root payload = `Details` only (no `schemaVersion`). */
export const LegacyImportCandidatePayloadSchema = DetailsSchema;

export function parseLegacyImportCandidatePayload(input: unknown) {
  return LegacyImportCandidatePayloadSchema.safeParse(input);
}

export function isImportCandidatePayloadEnvelope(input: unknown): input is ImportCandidatePayloadParsed {
  return (
    typeof input === 'object' &&
    input !== null &&
    (input as { schemaVersion?: unknown }).schemaVersion === CANDIDATE_PAYLOAD_SCHEMA_VERSION
  );
}

export function parseImportCandidatePayload(input: unknown): ImportCandidatePayloadParsed | null {
  const r = ImportCandidatePayloadSchema.safeParse(input);
  return r.success ? r.data : null;
}

export function getDetailsFromCandidatePayload(candidatePayload: unknown): DetailsSchemaType | null {
  if (isImportCandidatePayloadEnvelope(candidatePayload)) {
    return candidatePayload.details;
  }
  const legacy = DetailsSchema.safeParse(candidatePayload);
  return legacy.success ? legacy.data : null;
}

export function assertImportRawSection(row: ImportRawSection): z.infer<typeof ImportRawSectionSchema> {
  return ImportRawSectionSchema.parse(row as unknown as z.infer<typeof ImportRawSectionSchema>);
}

export type { ImportCandidatePayload, ImportRawSection, ImportReviewHint };
