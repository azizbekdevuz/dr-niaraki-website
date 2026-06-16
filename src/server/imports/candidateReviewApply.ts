/**
 * Apply explicit candidate review approvals to produce reconciled Details.
 * Pure, deterministic, and idempotent.
 */

import type { SiteContent } from '@/content/schema';
import { withAppliedAccounting } from '@/server/imports/candidateReviewAccounting';
import {
  awardItemToDetails,
  clusterMemberIds,
  publicationItemToDetails,
} from '@/server/imports/candidateReviewIdentity';
import type { CandidateReviewApproval, CandidateReviewManifest } from '@/server/imports/candidateReviewManifest';
import { validateCandidateReviewApprovals } from '@/server/imports/candidateReviewValidate';
import type { DetailsSchemaType } from '@/validators/detailsSchema';

/**
 * Apply explicit approvals only. Without approvals:
 * - candidate rows are unchanged;
 * - baseline-only manual-review rows are not added;
 * - remove-artifact rows are not added.
 *
 * `approve-removal` records intentional omission of baseline-only rows (normally a no-op splice).
 */
export function applyCandidateReviewApprovals(
  candidate: DetailsSchemaType,
  baseline: SiteContent,
  manifest: CandidateReviewManifest,
  approvals: readonly CandidateReviewApproval[] = [],
): { details: DetailsSchemaType; manifest: CandidateReviewManifest } {
  validateCandidateReviewApprovals(manifest, baseline, approvals);

  const publicationIds = new Set(candidate.publications.map((p) => p.id));
  const awardIds = new Set(candidate.about.awards.map((a) => a.id));

  const publications = [...candidate.publications];
  const awards = [...candidate.about.awards];

  for (const decision of manifest.decisions) {
    const approval = approvals.find((a) => a.decisionId === decision.decisionId);
    if (!approval) {
      continue;
    }

    if (decision.section === 'publications' && decision.existingId) {
      applyPublicationApproval(decision, approval, baseline, publications, publicationIds);
    }

    if (decision.section === 'awards' && decision.existingId) {
      applyAwardApproval(decision, approval, baseline, awards, awardIds);
    }
  }

  const details: DetailsSchemaType = {
    ...candidate,
    publications,
    about: { ...candidate.about, awards },
  };

  return {
    details,
    manifest: withAppliedAccounting(manifest, approvals),
  };
}

function applyPublicationApproval(
  decision: { existingId?: string; candidateId?: string; action: string },
  approval: CandidateReviewApproval,
  baseline: SiteContent,
  publications: DetailsSchemaType['publications'],
  publicationIds: Set<string>,
): void {
  const base = baseline.publications.items.find((p) => p.id === decision.existingId);
  if (!base) {
    return;
  }

  if (approval.approvedAction === 'preserve-existing') {
    if (!publicationIds.has(base.id)) {
      publications.push(publicationItemToDetails(base));
      publicationIds.add(base.id);
    }
    return;
  }

  if (approval.approvedAction === 'approve-removal') {
    // Baseline-only omission — accounting only; never splice candidate rows by id collision.
    return;
  }

  // skip — intentional omission, no splice when baseline-only
}

function applyAwardApproval(
  decision: {
    existingId?: string;
    relatedExistingIds?: string[];
    action: string;
  },
  approval: CandidateReviewApproval,
  baseline: SiteContent,
  awards: DetailsSchemaType['about']['awards'],
  awardIds: Set<string>,
): void {
  const members = clusterMemberIds(decision);
  const isCluster = members.length > 1;

  if (approval.approvedAction === 'preserve-existing') {
    const selectedId = isCluster ? approval.selectedExistingId! : decision.existingId!;
    const base = baseline.about.awards.find((a) => a.id === selectedId);
    if (base && !awardIds.has(base.id)) {
      awards.push(awardItemToDetails(base));
      awardIds.add(base.id);
    }
    return;
  }

  if (approval.approvedAction === 'approve-removal') {
    // Baseline-only omission — accounting only; never splice candidate rows by id collision.
    return;
  }

  // skip — no changes to candidate awards
}

/** Repeated application with the same approvals yields identical Details. */
export function applyCandidateReviewApprovalsIdempotent(
  candidate: DetailsSchemaType,
  baseline: SiteContent,
  manifest: CandidateReviewManifest,
  approvals: readonly CandidateReviewApproval[],
): DetailsSchemaType {
  const first = applyCandidateReviewApprovals(candidate, baseline, manifest, approvals);
  const second = applyCandidateReviewApprovals(first.details, baseline, manifest, approvals);
  return second.details;
}
