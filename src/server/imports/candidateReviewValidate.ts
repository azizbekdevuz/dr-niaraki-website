/**
 * Strict validation for candidate review approvals before application.
 */

import type { SiteContent } from '@/content/schema';
import { clusterMemberIds } from '@/server/imports/candidateReviewIdentity';
import type {
  CandidateReviewApproval,
  CandidateReviewDecision,
  CandidateReviewManifest,
} from '@/server/imports/candidateReviewManifest';

export class CandidateReviewApprovalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CandidateReviewApprovalError';
  }
}

const APPROVAL_REQUIRED_ACTIONS = new Set<CandidateReviewDecision['action']>([
  'manual-review',
  'remove-artifact',
]);

function decisionRequiresApproval(decision: CandidateReviewDecision): boolean {
  return APPROVAL_REQUIRED_ACTIONS.has(decision.action);
}

function isClusterDecision(decision: CandidateReviewDecision): boolean {
  return Boolean(decision.relatedExistingIds && decision.relatedExistingIds.length > 0);
}

function assertBaselineRowExists(
  baseline: SiteContent,
  section: CandidateReviewDecision['section'],
  existingId: string,
): void {
  if (section === 'publications') {
    if (!baseline.publications.items.some((p) => p.id === existingId)) {
      throw new CandidateReviewApprovalError(
        `Approval references missing baseline publication id "${existingId}".`,
      );
    }
    return;
  }
  if (section === 'awards') {
    if (!baseline.about.awards.some((a) => a.id === existingId)) {
      throw new CandidateReviewApprovalError(
        `Approval references missing baseline award id "${existingId}".`,
      );
    }
  }
}

function isAdvisoryDecision(decision: CandidateReviewDecision): boolean {
  return decision.section === 'patents' || decision.section === 'research';
}

function assertApprovalCompatible(
  decision: CandidateReviewDecision,
  approval: CandidateReviewApproval,
): void {
  if (isAdvisoryDecision(decision)) {
    throw new CandidateReviewApprovalError(
      `Advisory decision "${decision.decisionId}" (${decision.section}) does not accept ` +
        `preserve-existing, approve-removal, or skip approvals.`,
    );
  }

  if (!decisionRequiresApproval(decision)) {
    throw new CandidateReviewApprovalError(
      `Decision "${decision.decisionId}" (${decision.action}) does not accept approvals.`,
    );
  }

  if (approval.approvedAction === 'preserve-existing') {
    if (!decision.existingId) {
      throw new CandidateReviewApprovalError(
        `preserve-existing requires existingId on decision "${decision.decisionId}".`,
      );
    }
    if (decision.action === 'remove-artifact' && !isClusterDecision(decision)) {
      throw new CandidateReviewApprovalError(
        `preserve-existing is incompatible with remove-artifact decision "${decision.decisionId}".`,
      );
    }
    if (isClusterDecision(decision)) {
      const members = clusterMemberIds(decision);
      const selected = approval.selectedExistingId;
      if (!selected) {
        throw new CandidateReviewApprovalError(
          `preserve-existing on award cluster "${decision.decisionId}" requires selectedExistingId.`,
        );
      }
      if (!members.includes(selected)) {
        throw new CandidateReviewApprovalError(
          `selectedExistingId "${selected}" is not a member of cluster [${members.join(', ')}].`,
        );
      }
    }
    return;
  }

  if (approval.approvedAction === 'approve-removal') {
    if (!decision.existingId) {
      throw new CandidateReviewApprovalError(
        `approve-removal requires a baseline-oriented decision with existingId ("${decision.decisionId}").`,
      );
    }
    if (isClusterDecision(decision) && approval.selectedExistingId) {
      throw new CandidateReviewApprovalError(
        `approve-removal on cluster "${decision.decisionId}" must not include selectedExistingId.`,
      );
    }
    return;
  }

  if (approval.approvedAction === 'skip') {
    return;
  }

  throw new CandidateReviewApprovalError(
    `Unknown approval action "${String(approval.approvedAction)}" for decision "${decision.decisionId}".`,
  );
}

/**
 * Validate approvals before application. Throws on any invalid input.
 */
export function validateCandidateReviewApprovals(
  manifest: CandidateReviewManifest,
  baseline: SiteContent,
  approvals: readonly CandidateReviewApproval[],
): void {
  const decisionById = new Map(manifest.decisions.map((d) => [d.decisionId, d]));
  const seen = new Set<string>();

  for (const approval of approvals) {
    if (seen.has(approval.decisionId)) {
      throw new CandidateReviewApprovalError(
        `Duplicate approval for decision "${approval.decisionId}".`,
      );
    }
    seen.add(approval.decisionId);

    const decision = decisionById.get(approval.decisionId);
    if (!decision) {
      throw new CandidateReviewApprovalError(
        `Unknown decision id "${approval.decisionId}".`,
      );
    }

    assertApprovalCompatible(decision, approval);

    if (decision.existingId) {
      assertBaselineRowExists(baseline, decision.section, decision.existingId);
    }
    if (approval.selectedExistingId) {
      assertBaselineRowExists(baseline, decision.section, approval.selectedExistingId);
    }
  }
}

/**
 * Compatibility matrix (decision.action → allowed approval.approvedAction):
 *
 * | Decision action   | preserve-existing | approve-removal | skip |
 * |-------------------|-------------------|-----------------|------|
 * | manual-review     | yes               | yes             | yes  |
 * | remove-artifact   | no*               | yes             | yes  |
 * | add / update      | (no approval)     |                 |      |
 *
 * *Award duplicate clusters use manual-review with relatedExistingIds;
 *  preserve-existing requires selectedExistingId from the cluster.
 */
export const APPROVAL_COMPATIBILITY_MATRIX = 'see validateCandidateReviewApprovals';
