import 'server-only';

import type { SiteContent } from '@/content/schema';
import { assertAccountingConsistent } from '@/server/imports/candidateReviewAccounting';
import { applyCandidateReviewApprovals } from '@/server/imports/candidateReviewApply';
import type {
  CandidateReviewApproval,
  CandidateReviewManifest,
} from '@/server/imports/candidateReviewManifest';
import { validateCandidateReviewApprovals } from '@/server/imports/candidateReviewValidate';
import { resolveImportMergeReviewBaseline } from '@/server/imports/importCandidateReview/baseline';
import {
  isImportReviewMergeBlocked,
  countUnresolvedBlockingDecisions,
} from '@/server/imports/importCandidateReview/gate';
import { applyApprovalsToStoredManifest } from '@/server/imports/importCandidateReview/generate';
import {
  parseStoredReviewApprovals,
  parseStoredReviewManifest,
  type StoredReviewApprovalsEnvelope,
  type StoredReviewManifestEnvelope,
} from '@/server/imports/importCandidateReview/storageSchema';
import type { DetailsSchemaType } from '@/validators/detailsSchema';

export class ImportReviewReconcileError extends Error {
  constructor(
    readonly code:
      | 'REVIEW_MANIFEST_MISSING'
      | 'REVIEW_MANIFEST_INVALID'
      | 'REVIEW_MANIFEST_STALE'
      | 'REVIEW_APPROVALS_STALE'
      | 'REVIEW_BLOCKED'
      | 'REVIEW_APPROVALS_INVALID',
    message: string,
  ) {
    super(message);
    this.name = 'ImportReviewReconcileError';
  }
}

export type LoadedImportReviewState = {
  manifestEnvelope: StoredReviewManifestEnvelope;
  manifest: CandidateReviewManifest;
  approvalsEnvelope: StoredReviewApprovalsEnvelope | null;
  approvals: CandidateReviewApproval[];
};

export function loadImportReviewStateFromRow(row: {
  reviewManifest: unknown;
  reviewApprovals: unknown;
}): LoadedImportReviewState | null {
  const manifestEnvelope = parseStoredReviewManifest(row.reviewManifest);
  if (!manifestEnvelope) {
    return null;
  }
  const approvalsEnvelope =
    row.reviewApprovals === null || row.reviewApprovals === undefined
      ? null
      : parseStoredReviewApprovals(row.reviewApprovals);
  if (
    row.reviewApprovals !== null &&
    row.reviewApprovals !== undefined &&
    approvalsEnvelope === null
  ) {
    throw new ImportReviewReconcileError(
      'REVIEW_APPROVALS_INVALID',
      'Stored review approvals are malformed.',
    );
  }
  const approvals = approvalsEnvelope?.approvals ?? [];
  let manifest = manifestEnvelope.manifest as CandidateReviewManifest;
  if (approvals.length > 0) {
    manifest = applyApprovalsToStoredManifest(manifest, approvals);
  }
  return { manifestEnvelope, manifest, approvalsEnvelope, approvals };
}

export function verifyReviewApprovalsRevision(
  manifestEnvelope: StoredReviewManifestEnvelope,
  approvalsEnvelope: StoredReviewApprovalsEnvelope | null,
): void {
  if (!approvalsEnvelope) {
    return;
  }
  if (approvalsEnvelope.manifestRevision !== manifestEnvelope.manifestRevision) {
    throw new ImportReviewReconcileError(
      'REVIEW_APPROVALS_STALE',
      'Stored approvals do not match the current review manifest revision.',
    );
  }
}

export function verifyReviewManifestSourceHash(
  manifestEnvelope: StoredReviewManifestEnvelope,
  sourceTextHash: string,
): void {
  if (manifestEnvelope.sourceTextHash !== sourceTextHash) {
    throw new ImportReviewReconcileError(
      'REVIEW_MANIFEST_STALE',
      'Review manifest was generated for a different source document hash.',
    );
  }
}

export type ReconcileCandidateForMergeInput = {
  candidate: DetailsSchemaType;
  baseline?: SiteContent;
  manifestEnvelope: StoredReviewManifestEnvelope;
  manifest: CandidateReviewManifest;
  approvals: readonly CandidateReviewApproval[];
  acknowledgeUnresolvedReview?: boolean;
  unresolvedReviewReason?: string | null;
};

export type ReconcileCandidateForMergeResult = {
  details: DetailsSchemaType;
  manifest: CandidateReviewManifest;
  unresolvedBlockingCount: number;
};

export async function reconcileCandidateForMerge(
  input: ReconcileCandidateForMergeInput,
): Promise<ReconcileCandidateForMergeResult> {
  const baseline = input.baseline ?? (await resolveImportMergeReviewBaseline()).baseline;
  validateCandidateReviewApprovals(input.manifest, baseline, input.approvals);

  const appliedManifest = applyApprovalsToStoredManifest(
    input.manifestEnvelope.manifest as CandidateReviewManifest,
    input.approvals,
  );
  assertAccountingConsistent(appliedManifest);

  const unresolvedBlockingCount = countUnresolvedBlockingDecisions(appliedManifest);
  if (isImportReviewMergeBlocked(appliedManifest) && !input.acknowledgeUnresolvedReview) {
    throw new ImportReviewReconcileError(
      'REVIEW_BLOCKED',
      `${unresolvedBlockingCount} publication/award reconciliation decision(s) remain unresolved.`,
    );
  }

  const { details, manifest } = applyCandidateReviewApprovals(
    input.candidate,
    baseline,
    input.manifestEnvelope.manifest as CandidateReviewManifest,
    input.approvals,
  );
  assertAccountingConsistent(manifest);

  return { details, manifest, unresolvedBlockingCount };
}
