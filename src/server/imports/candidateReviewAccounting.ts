/**
 * Mutually exclusive accounting for candidate review manifests.
 */

import { clusterMemberIds } from '@/server/imports/candidateReviewIdentity';
import type {
  CandidateReviewApproval,
  CandidateReviewBaselineSectionAccounting,
  CandidateReviewDecision,
  CandidateReviewManifest,
  CandidateReviewSectionAccounting,
} from '@/server/imports/candidateReviewManifest';

function emptyBaselineAccounting(): CandidateReviewBaselineSectionAccounting {
  return {
    matchedBaseline: 0,
    supersededBaseline: 0,
    unresolvedBaseline: 0,
    preservedBaseline: 0,
    removedBaseline: 0,
    resolvedSkipped: 0,
    wrongSectionArtifact: 0,
    clusteredBaseline: 0,
  };
}

function approvalMap(approvals: readonly CandidateReviewApproval[]): Map<string, CandidateReviewApproval> {
  return new Map(approvals.map((a) => [a.decisionId, a]));
}

function isResolvableDecision(decision: CandidateReviewDecision): boolean {
  return decision.action === 'manual-review' || decision.action === 'remove-artifact';
}

function analysisSectionAccounting(
  manifest: CandidateReviewManifest,
  section: 'publications' | 'awards',
): CandidateReviewSectionAccounting {
  return manifest.analysisAccounting[section];
}

/**
 * Recompute candidate-facing counts from immutable analysis accounting + approvals.
 * Idempotent: same approvals on original or already-applied manifest yield identical results.
 */
export function computeSectionAccounting(
  section: 'publications' | 'awards',
  manifest: CandidateReviewManifest,
  approvals: readonly CandidateReviewApproval[] = [],
): CandidateReviewSectionAccounting {
  const analysis = analysisSectionAccounting(manifest, section);
  const snapshot = analysis.baseline;
  const approvalById = approvalMap(approvals);
  const sectionDecisions = manifest.decisions.filter(
    (d) => d.section === section && isResolvableDecision(d),
  );

  let baselinePreserved = 0;
  let baselineRemovedArtifact = 0;
  let unresolvedManualReview = 0;
  let resolvedSkipped = 0;

  let unresolvedBaseline = snapshot.unresolvedBaseline;
  let preservedBaseline = 0;
  let removedBaseline = 0;
  let resolvedSkippedBaseline = 0;

  for (const decision of sectionDecisions) {
    const approval = approvalById.get(decision.decisionId);
    const members = clusterMemberIds(decision);
    const memberCount = members.length > 0 ? members.length : 1;

    if (!approval) {
      unresolvedManualReview += 1;
      continue;
    }

    unresolvedBaseline -= memberCount;

    if (approval.approvedAction === 'preserve-existing') {
      baselinePreserved += 1;
      preservedBaseline += 1;
      if (members.length > 1) {
        const omitted = members.length - 1;
        baselineRemovedArtifact += omitted;
        removedBaseline += omitted;
      }
      continue;
    }

    if (approval.approvedAction === 'approve-removal') {
      baselineRemovedArtifact += memberCount;
      removedBaseline += memberCount;
      continue;
    }

    if (approval.approvedAction === 'skip') {
      resolvedSkipped += 1;
      resolvedSkippedBaseline += memberCount;
    }
  }

  const finalTotalAfterApprovals = analysis.candidateTotal + baselinePreserved;

  return {
    mode: 'reconciled',
    candidateTotal: analysis.candidateTotal,
    baselineTotal: analysis.baselineTotal,
    matchedUpdated: analysis.matchedUpdated,
    candidateOnlyAdded: analysis.candidateOnlyAdded,
    baselinePreserved,
    baselineRemovedArtifact,
    unresolvedManualReview,
    resolvedSkipped,
    finalTotalAfterApprovals,
    baseline: {
      matchedBaseline: snapshot.matchedBaseline,
      supersededBaseline: snapshot.supersededBaseline,
      wrongSectionArtifact: snapshot.wrongSectionArtifact,
      clusteredBaseline: snapshot.clusteredBaseline,
      unresolvedBaseline,
      preservedBaseline,
      removedBaseline,
      resolvedSkipped: resolvedSkippedBaseline,
    },
  };
}

export function assertAccountingConsistent(manifest: CandidateReviewManifest): void {
  for (const section of ['publications', 'awards'] as const) {
    const a = manifest.accounting[section];
    if (a.mode !== 'reconciled') {
      continue;
    }
    if (a.candidateTotal !== a.matchedUpdated + a.candidateOnlyAdded) {
      throw new Error(
        `${section}: candidateTotal (${a.candidateTotal}) !== matchedUpdated (${a.matchedUpdated}) + candidateOnlyAdded (${a.candidateOnlyAdded})`,
      );
    }
    if (a.finalTotalAfterApprovals !== a.candidateTotal + a.baselinePreserved) {
      throw new Error(
        `${section}: finalTotalAfterApprovals (${a.finalTotalAfterApprovals}) !== candidateTotal (${a.candidateTotal}) + baselinePreserved (${a.baselinePreserved})`,
      );
    }
    assertBaselineAccountingConsistent(section, a);
    assertBaselineCountsNonNegative(section, a);
  }
}

export function assertBaselineCountsNonNegative(
  section: string,
  accounting: CandidateReviewSectionAccounting,
): void {
  const b = accounting.baseline;
  const fields: (keyof CandidateReviewBaselineSectionAccounting)[] = [
    'matchedBaseline',
    'supersededBaseline',
    'unresolvedBaseline',
    'preservedBaseline',
    'removedBaseline',
    'resolvedSkipped',
    'wrongSectionArtifact',
    'clusteredBaseline',
  ];
  for (const field of fields) {
    if (b[field] < 0) {
      throw new Error(`${section}: baseline.${field} is negative (${b[field]})`);
    }
  }
}

export function assertBaselineAccountingConsistent(
  section: string,
  accounting: CandidateReviewSectionAccounting,
): void {
  const b = accounting.baseline;
  const sum =
    b.matchedBaseline +
    b.supersededBaseline +
    b.unresolvedBaseline +
    b.preservedBaseline +
    b.removedBaseline +
    b.resolvedSkipped;

  if (sum !== accounting.baselineTotal) {
    throw new Error(
      `${section}: baseline accounting sum (${sum}) !== baselineTotal (${accounting.baselineTotal})`,
    );
  }
}

export function withAppliedAccounting(
  manifest: CandidateReviewManifest,
  approvals: readonly CandidateReviewApproval[],
): CandidateReviewManifest {
  const updated: CandidateReviewManifest = {
    ...manifest,
    accounting: {
      ...manifest.accounting,
      publications: computeSectionAccounting('publications', manifest, approvals),
      awards: computeSectionAccounting('awards', manifest, approvals),
    },
  };
  assertAccountingConsistent(updated);
  return updated;
}

export { emptyBaselineAccounting };
