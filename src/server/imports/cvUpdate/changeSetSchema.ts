/**
 * Zod schemas for persisted CV change sets and professor decisions.
 */

import { z } from 'zod';

import type { CvChangeDecisionsEnvelope, CvChangeSet } from '@/server/imports/cvUpdate/changeSetTypes';

const fieldOwnershipSchema = z.enum(['website', 'cv', 'review']);

const cvChangeKindSchema = z.enum([
  'unchanged',
  'added',
  'modified',
  'removed',
  'uncertain_match',
  'conflict_manual',
  'protected_lock',
  'truncated_candidate',
  'new_section',
  'website_only',
]);

const cvChangeSectionKeySchema = z.enum([
  'profile',
  'summary',
  'contact',
  'publications',
  'patents',
  'education',
  'appointments',
  'awards',
  'projects',
  'research_interests',
  'teaching',
  'supervision',
  'service',
  'unknown_section',
  'website_chrome',
]);

const cvChangeDecisionActionSchema = z.enum(['accept', 'keep_website', 'edit', 'ignore', 'lock_website']);

export const CvChangeItemSchema = z.object({
  id: z.string().min(1),
  sectionKey: cvChangeSectionKeySchema,
  fieldPath: z.string().min(1),
  itemKey: z.string().optional(),
  kind: cvChangeKindSchema,
  ownership: fieldOwnershipSchema,
  safelyPrepared: z.boolean(),
  requiresReview: z.boolean(),
  label: z.string().min(1),
  summary: z.string().min(1),
  previousCvValue: z.unknown().optional(),
  candidateValue: z.unknown().optional(),
  websiteValue: z.unknown().optional(),
  editedValue: z.unknown().optional(),
  warnings: z.array(z.string()),
  reconcileDecisionId: z.string().optional(),
});

export const CvChangeSectionSummarySchema = z.object({
  sectionKey: cvChangeSectionKeySchema,
  label: z.string().min(1),
  changes: z.number().int().nonnegative(),
  unchanged: z.number().int().nonnegative(),
  requiresReview: z.number().int().nonnegative(),
  safelyPrepared: z.number().int().nonnegative(),
});

export const CvUnknownSectionProposalSchema = z.object({
  sectionId: z.string().min(1),
  sourceTitle: z.string(),
  normalizedTitle: z.string(),
  textPreview: z.string(),
  rememberedPresentation: z.string().nullable().optional(),
});

export const CvChangeSetSummarySchema = z.object({
  totalChanges: z.number().int().nonnegative(),
  safelyPrepared: z.number().int().nonnegative(),
  requiresReview: z.number().int().nonnegative(),
  unchangedItemCount: z.number().int().nonnegative(),
  noWebsiteRelevantChanges: z.boolean(),
});

export const CvAcceptedBaselineRefSchema = z.object({
  baselineId: z.string().min(1),
  sourceImportId: z.string().min(1),
  acceptedAt: z.string().min(1),
  parserVersion: z.string().min(1),
  mappingVersion: z.string().min(1),
  sourceTextHash: z.string().nullable(),
});

export const CvWebsiteRefSchema = z.object({
  sourceType: z.enum(['working_draft', 'published', 'canonical']),
  versionId: z.string().nullable().optional(),
  label: z.string().nullable().optional(),
});

export const CvChangeSetSchema = z.object({
  schemaVersion: z.literal(1),
  algorithmVersion: z.number().int().positive().optional(),
  generatedAt: z.string().min(1),
  importId: z.string().min(1),
  candidateSourceTextHash: z.string().nullable(),
  baseline: CvAcceptedBaselineRefSchema.nullable(),
  website: CvWebsiteRefSchema,
  summary: CvChangeSetSummarySchema,
  sectionSummaries: z.array(CvChangeSectionSummarySchema),
  items: z.array(CvChangeItemSchema),
  unknownSections: z.array(CvUnknownSectionProposalSchema),
  changeSetRevision: z.string().length(32),
});

export const CvChangeDecisionSchema = z.object({
  changeId: z.string().min(1),
  action: cvChangeDecisionActionSchema,
  editedValue: z.unknown().optional(),
  lockForFutureImports: z.boolean().optional(),
});

export const CvChangeDecisionsEnvelopeSchema = z.object({
  schemaVersion: z.literal(1),
  changeSetRevision: z.string().length(32),
  savedAt: z.string().min(1),
  decisions: z.array(CvChangeDecisionSchema),
});

export function parseCvChangeSet(input: unknown): CvChangeSet | null {
  const result = CvChangeSetSchema.safeParse(input);
  return result.success ? (result.data as CvChangeSet) : null;
}

export function parseCvChangeDecisionsEnvelope(input: unknown): CvChangeDecisionsEnvelope | null {
  const result = CvChangeDecisionsEnvelopeSchema.safeParse(input);
  return result.success ? (result.data as CvChangeDecisionsEnvelope) : null;
}
