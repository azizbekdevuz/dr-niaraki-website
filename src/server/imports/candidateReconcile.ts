/**
 * Candidate review — barrel re-exports (analysis and application only).
 */

export type {
  CandidateReviewApproval,
  CandidateReviewApprovalAction,
  CandidateReviewBaselineRef,
  CandidateReviewDecision,
  CandidateReviewManifest,
  CandidateReviewSectionAccounting,
} from '@/server/imports/candidateReviewManifest';

export {
  analyzeCandidateReview,
  classifyBaselineOnlyAward,
  classifyBaselineOnlyPublication,
} from '@/server/imports/candidateReviewAnalyze';

export {
  applyCandidateReviewApprovals,
  applyCandidateReviewApprovalsIdempotent,
} from '@/server/imports/candidateReviewApply';

export {
  assertAccountingConsistent,
  assertBaselineAccountingConsistent,
  computeSectionAccounting,
  withAppliedAccounting,
} from '@/server/imports/candidateReviewAccounting';

export {
  buildSourceTextIndex,
  evaluateSourceMentionEvidence,
  isAuthorStringPublicationTitle,
  isAwardWrongSectionArtifact,
} from '@/server/imports/candidateReviewIdentity';

export {
  CandidateReviewApprovalError,
  validateCandidateReviewApprovals,
} from '@/server/imports/candidateReviewValidate';

import type { SiteContent } from '@/content/schema';
import { analyzeCandidateReview } from '@/server/imports/candidateReviewAnalyze';
import type {
  CandidateReviewBaselineRef,
  CandidateReviewManifest,
} from '@/server/imports/candidateReviewManifest';
import type { DetailsSchemaType } from '@/validators/detailsSchema';

/** Analysis-only entry point. Returns manifest; candidate Details are unchanged. */
export function analyzeCandidateAgainstBaseline(
  candidate: DetailsSchemaType,
  baseline: SiteContent,
  baselineRef: CandidateReviewBaselineRef,
  importId?: string | null,
): CandidateReviewManifest {
  return analyzeCandidateReview({ candidate, baseline, baselineRef, importId });
}
