import { z } from 'zod';

import type {
  CandidateReviewApproval,
  CandidateReviewManifest,
} from '@/server/imports/candidateReviewManifest';
import { computeImportReviewManifestRevision } from '@/server/imports/importCandidateReview/revision';

export const IMPORT_REVIEW_STORAGE_VERSION = 1 as const;

const reviewBaselineRefSchema = z.object({
  sourceType: z.enum(['published', 'working_draft', 'canonical']),
  versionId: z.string().nullable().optional(),
  publishSequence: z.number().nullable().optional(),
  label: z.string().nullable().optional(),
});

const reviewDecisionSchema = z.object({
  decisionId: z.string().min(1),
  section: z.enum(['publications', 'awards', 'patents', 'research']),
  candidateId: z.string().optional(),
  existingId: z.string().optional(),
  relatedExistingIds: z.array(z.string()).optional(),
  action: z.enum(['add', 'update', 'remove-artifact', 'preserve-existing', 'manual-review']),
  reason: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  affectedCount: z.number().int().nonnegative().optional(),
});

const baselineSectionAccountingSchema = z.object({
  matchedBaseline: z.number().int().nonnegative(),
  supersededBaseline: z.number().int().nonnegative(),
  unresolvedBaseline: z.number().int().nonnegative(),
  preservedBaseline: z.number().int().nonnegative(),
  removedBaseline: z.number().int().nonnegative(),
  resolvedSkipped: z.number().int().nonnegative(),
  wrongSectionArtifact: z.number().int().nonnegative(),
  clusteredBaseline: z.number().int().nonnegative(),
});

const reconciledSectionAccountingSchema = z.object({
  mode: z.literal('reconciled'),
  candidateTotal: z.number().int().nonnegative(),
  baselineTotal: z.number().int().nonnegative(),
  matchedUpdated: z.number().int().nonnegative(),
  candidateOnlyAdded: z.number().int().nonnegative(),
  baselinePreserved: z.number().int().nonnegative(),
  baselineRemovedArtifact: z.number().int().nonnegative(),
  unresolvedManualReview: z.number().int().nonnegative(),
  resolvedSkipped: z.number().int().nonnegative(),
  finalTotalAfterApprovals: z.number().int().nonnegative(),
  baseline: baselineSectionAccountingSchema,
});

const advisorySectionAccountingSchema = z.object({
  mode: z.literal('advisory'),
  candidateTotal: z.number().int().nonnegative(),
  baselineTotal: z.number().int().nonnegative(),
  unresolvedAdvisoryDecisions: z.number().int().nonnegative(),
  affectedRecordCount: z.number().int().nonnegative(),
});

const candidateReviewManifestSchema = z
  .object({
    generatedAt: z.string(),
    importId: z.string().nullable().optional(),
    importSource: z.string(),
    baseline: reviewBaselineRefSchema,
    decisions: z.array(reviewDecisionSchema),
    analysisAccounting: z.object({
      publications: reconciledSectionAccountingSchema,
      awards: reconciledSectionAccountingSchema,
    }),
    accounting: z.object({
      publications: reconciledSectionAccountingSchema,
      awards: reconciledSectionAccountingSchema,
      patents: advisorySectionAccountingSchema,
      research: advisorySectionAccountingSchema,
    }),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.decisions.forEach((d, idx) => {
      if (seen.has(d.decisionId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['decisions', idx, 'decisionId'],
          message: 'decisionId must be unique within a manifest.',
        });
        return;
      }
      seen.add(d.decisionId);
    });
  });

export const storedReviewManifestEnvelopeSchema = z.object({
  storageVersion: z.literal(IMPORT_REVIEW_STORAGE_VERSION),
  manifestRevision: z.string().min(8),
  sourceTextHash: z.string().min(8),
  manifest: candidateReviewManifestSchema,
});

export const candidateReviewApprovalSchema = z.object({
  decisionId: z.string().min(1),
  approvedAction: z.enum(['preserve-existing', 'approve-removal', 'skip']),
  selectedExistingId: z.string().optional(),
});

export const storedReviewApprovalsEnvelopeSchema = z.object({
  storageVersion: z.literal(IMPORT_REVIEW_STORAGE_VERSION),
  manifestRevision: z.string().min(8),
  updatedAt: z.string(),
  approvals: z.array(candidateReviewApprovalSchema),
});

export type StoredReviewManifestEnvelope = z.infer<typeof storedReviewManifestEnvelopeSchema>;
export type StoredReviewApprovalsEnvelope = z.infer<typeof storedReviewApprovalsEnvelopeSchema>;

export function parseStoredReviewManifest(input: unknown): StoredReviewManifestEnvelope | null {
  const parsed = storedReviewManifestEnvelopeSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}

export function parseStoredReviewApprovals(input: unknown): StoredReviewApprovalsEnvelope | null {
  const parsed = storedReviewApprovalsEnvelopeSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}

export function assertStoredManifestMatchesRevision(
  envelope: StoredReviewManifestEnvelope,
): CandidateReviewManifest {
  const manifest = envelope.manifest as CandidateReviewManifest;
  const expectedIds = manifest.decisions.map((d) => d.decisionId).sort();
  const revisionIds = [...expectedIds];
  const computed = computeImportReviewManifestRevision({
    sourceTextHash: envelope.sourceTextHash,
    decisionIds: revisionIds,
  });
  if (computed !== envelope.manifestRevision) {
    throw new Error('Stored review manifest revision does not match content.');
  }
  return manifest;
}

export function toStoredManifestEnvelope(input: {
  manifest: CandidateReviewManifest;
  sourceTextHash: string;
  manifestRevision: string;
}): StoredReviewManifestEnvelope {
  return {
    storageVersion: IMPORT_REVIEW_STORAGE_VERSION,
    manifestRevision: input.manifestRevision,
    sourceTextHash: input.sourceTextHash,
    manifest: input.manifest,
  };
}

export function toStoredApprovalsEnvelope(input: {
  manifestRevision: string;
  approvals: readonly CandidateReviewApproval[];
  updatedAt?: string;
}): StoredReviewApprovalsEnvelope {
  return {
    storageVersion: IMPORT_REVIEW_STORAGE_VERSION,
    manifestRevision: input.manifestRevision,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    approvals: [...input.approvals],
  };
}
