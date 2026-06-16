import 'server-only';

import type { Prisma } from '@prisma/client';

import type {
  CandidateReviewApproval,
  CandidateReviewManifest,
} from '@/server/imports/candidateReviewManifest';
import type { StoredReviewApprovalsEnvelope, StoredReviewManifestEnvelope } from '@/server/imports/importCandidateReview/storageSchema';

export type ImportCandidateReviewStateDto = {
  hasManifest: boolean;
  manifestRevision: string | null;
  sourceTextHash: string | null;
  baseline: CandidateReviewManifest['baseline'] | null;
  generatedAt: string | null;
  importSource: string | null;
  decisions: CandidateReviewManifest['decisions'];
  accounting: CandidateReviewManifest['accounting'] | null;
  analysisAccounting: CandidateReviewManifest['analysisAccounting'] | null;
  approvals: CandidateReviewApproval[];
  approvalsUpdatedAt: string | null;
  unresolvedBlockingCount: number;
  mergeReviewBlocked: boolean;
  advisoryOnly: boolean;
};

export function buildImportCandidateReviewStateDto(input: {
  manifestEnvelope: StoredReviewManifestEnvelope | null;
  manifest: CandidateReviewManifest | null;
  approvalsEnvelope: StoredReviewApprovalsEnvelope | null;
  approvals: readonly CandidateReviewApproval[];
  unresolvedBlockingCount: number;
}): ImportCandidateReviewStateDto {
  const manifest = input.manifest;
  const envelope = input.manifestEnvelope;
  return {
    hasManifest: Boolean(envelope && manifest),
    manifestRevision: envelope?.manifestRevision ?? null,
    sourceTextHash: envelope?.sourceTextHash ?? null,
    baseline: manifest?.baseline ?? null,
    generatedAt: manifest?.generatedAt ?? null,
    importSource: manifest?.importSource ?? null,
    decisions: manifest?.decisions ?? [],
    accounting: manifest?.accounting ?? null,
    analysisAccounting: manifest?.analysisAccounting ?? null,
    approvals: [...input.approvals],
    approvalsUpdatedAt: input.approvalsEnvelope?.updatedAt ?? null,
    unresolvedBlockingCount: input.unresolvedBlockingCount,
    mergeReviewBlocked: input.unresolvedBlockingCount > 0,
    advisoryOnly: Boolean(
      manifest &&
        input.unresolvedBlockingCount === 0 &&
        (manifest.accounting.patents.unresolvedAdvisoryDecisions > 0 ||
          manifest.accounting.research.unresolvedAdvisoryDecisions > 0),
    ),
  };
}

export function reviewStateToJson(dto: ImportCandidateReviewStateDto): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(dto)) as Prisma.InputJsonValue;
}
