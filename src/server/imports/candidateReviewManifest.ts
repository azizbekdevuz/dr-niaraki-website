/**
 * Candidate import review manifest — analysis vs explicit approval application.
 */

export type CandidateReviewSection = 'publications' | 'awards' | 'patents' | 'research';

export type CandidateReviewAction =
  | 'add'
  | 'update'
  | 'remove-artifact'
  | 'preserve-existing'
  | 'manual-review';

/** Approval actions only — candidate `add`/`update` decisions need no approval. */
export type CandidateReviewApprovalAction =
  | 'preserve-existing'
  | 'approve-removal'
  | 'skip';

export type CandidateReviewBaselineSource = 'published' | 'working_draft' | 'canonical';

export type CandidateReviewBaselineRef = {
  sourceType: CandidateReviewBaselineSource;
  versionId?: string | null;
  publishSequence?: number | null;
  label?: string | null;
};

export type CandidateReviewDecision = {
  decisionId: string;
  section: CandidateReviewSection;
  candidateId?: string;
  existingId?: string;
  /** Additional baseline row ids grouped with this decision (e.g. duplicate award cluster). */
  relatedExistingIds?: string[];
  action: CandidateReviewAction;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  /** Affected row count for advisory decisions (e.g. unknown patent status). */
  affectedCount?: number;
};

export type CandidateReviewApproval = {
  decisionId: string;
  approvedAction: CandidateReviewApprovalAction;
  /** Required when preserving a duplicate award cluster — must be one of the cluster ids. */
  selectedExistingId?: string;
};

/** Every baseline row id is assigned to exactly one category. */
export type CandidateReviewBaselineSectionAccounting = {
  matchedBaseline: number;
  supersededBaseline: number;
  unresolvedBaseline: number;
  preservedBaseline: number;
  removedBaseline: number;
  resolvedSkipped: number;
  wrongSectionArtifact: number;
  clusteredBaseline: number;
};

/**
 * Candidate-side accounting for reconciled sections (publications, awards).
 * Invariant: `candidateTotal === matchedUpdated + candidateOnlyAdded`
 * Invariant: `finalTotalAfterApprovals === candidateTotal + baselinePreserved`
 */
export type CandidateReviewSectionAccounting = {
  mode: 'reconciled';
  candidateTotal: number;
  baselineTotal: number;
  matchedUpdated: number;
  candidateOnlyAdded: number;
  baselinePreserved: number;
  /** Intentional baseline omission approved via `approve-removal` (not necessarily a splice). */
  baselineRemovedArtifact: number;
  unresolvedManualReview: number;
  resolvedSkipped: number;
  finalTotalAfterApprovals: number;
  baseline: CandidateReviewBaselineSectionAccounting;
};

/** Advisory sections are not semantically reconciled — counts are candidate-side only. */
export type CandidateReviewAdvisorySectionAccounting = {
  mode: 'advisory';
  candidateTotal: number;
  baselineTotal: number;
  unresolvedAdvisoryDecisions: number;
  affectedRecordCount: number;
};

export type CandidateReviewManifest = {
  generatedAt: string;
  importId?: string | null;
  importSource: string;
  baseline: CandidateReviewBaselineRef;
  decisions: CandidateReviewDecision[];
  /** Immutable analysis-time accounting for reconciled sections. */
  analysisAccounting: {
    publications: CandidateReviewSectionAccounting;
    awards: CandidateReviewSectionAccounting;
  };
  accounting: {
    publications: CandidateReviewSectionAccounting;
    awards: CandidateReviewSectionAccounting;
    patents: CandidateReviewAdvisorySectionAccounting;
    research: CandidateReviewAdvisorySectionAccounting;
  };
};
