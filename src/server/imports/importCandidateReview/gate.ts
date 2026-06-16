import 'server-only';

import type { CandidateReviewDecision, CandidateReviewManifest } from '@/server/imports/candidateReviewManifest';

const RESOLVABLE_ACTIONS = new Set<CandidateReviewDecision['action']>(['manual-review', 'remove-artifact']);

function isBlockingDecision(decision: CandidateReviewDecision): boolean {
  if (!RESOLVABLE_ACTIONS.has(decision.action)) {
    return false;
  }
  return decision.section === 'publications' || decision.section === 'awards';
}

export function listBlockingReviewDecisions(manifest: CandidateReviewManifest): CandidateReviewDecision[] {
  return manifest.decisions.filter(isBlockingDecision);
}

export function countUnresolvedBlockingDecisions(manifest: CandidateReviewManifest): number {
  return manifest.accounting.publications.unresolvedManualReview + manifest.accounting.awards.unresolvedManualReview;
}

export function isImportReviewMergeBlocked(manifest: CandidateReviewManifest): boolean {
  return countUnresolvedBlockingDecisions(manifest) > 0;
}

export function approvalsCoverAllBlockingDecisions(
  manifest: CandidateReviewManifest,
  approvalDecisionIds: ReadonlySet<string>,
): boolean {
  const blocking = listBlockingReviewDecisions(manifest);
  return blocking.every((d) => approvalDecisionIds.has(d.decisionId));
}
