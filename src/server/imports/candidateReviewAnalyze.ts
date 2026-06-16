/**
 * Candidate review analysis — decisions only; never mutates candidate Details.
 */

import type { PublicationItem, SiteContent } from '@/content/schema';
import {
  assertAccountingConsistent,
  emptyBaselineAccounting,
} from '@/server/imports/candidateReviewAccounting';
import {
  buildSourceTextIndex,
  clusterBaselineAwardIds,
  evaluateSourceMentionEvidence,
  isAuthorStringPublicationTitle,
  isAwardMatchedByCandidate,
  isAwardWrongSectionArtifact,
  isBaselinePublicationSuperseded,
  makeDecisionId,
} from '@/server/imports/candidateReviewIdentity';
import type {
  CandidateReviewAdvisorySectionAccounting,
  CandidateReviewBaselineRef,
  CandidateReviewBaselineSectionAccounting,
  CandidateReviewDecision,
  CandidateReviewManifest,
  CandidateReviewSectionAccounting,
} from '@/server/imports/candidateReviewManifest';
import { diffPublicationsSemantically } from '@/server/imports/semanticListDiff';
import type { Award, Publication } from '@/types/details';
import type { DetailsSchemaType } from '@/validators/detailsSchema';

export type AnalyzeCandidateReviewInput = {
  candidate: DetailsSchemaType;
  baseline: SiteContent;
  baselineRef: CandidateReviewBaselineRef;
  importId?: string | null;
  generatedAt?: string;
};

function publicationDecisionId(existingId?: string, candidateId?: string, suffix?: string): string {
  return makeDecisionId(['publications', existingId ?? '', candidateId ?? '', suffix ?? '']);
}

function awardDecisionId(existingId?: string, candidateId?: string, suffix?: string): string {
  return makeDecisionId(['awards', existingId ?? '', candidateId ?? '', suffix ?? '']);
}

function sourceMentionReason(evidence: ReturnType<typeof evaluateSourceMentionEvidence>): string {
  if (!evidence.found) {
    return 'Baseline-only row absent from fresh candidate and source evidence';
  }
  if (evidence.method === 'exact') {
    return 'Baseline-only row; exact normalized title found in source';
  }
  if (evidence.method === 'apa-title') {
    return 'Baseline-only row; APA-extracted title phrase found in source';
  }
  return 'Baseline-only row; contiguous significant-token sequence found in source';
}

export function classifyBaselineOnlyPublication(
  item: PublicationItem,
): CandidateReviewDecision['action'] {
  if (isAuthorStringPublicationTitle(item.title)) {
    return 'remove-artifact';
  }
  return 'manual-review';
}

export function classifyBaselineOnlyAward(
  item: SiteContent['about']['awards'][number],
  _mentionedInSource: boolean,
): CandidateReviewDecision['action'] {
  if (isAwardWrongSectionArtifact(item.title)) {
    return 'remove-artifact';
  }
  return 'manual-review';
}

function analyzePublications(
  candidate: readonly Publication[],
  baseline: readonly PublicationItem[],
  sourceIndex: ReturnType<typeof buildSourceTextIndex>,
): { decisions: CandidateReviewDecision[]; accounting: CandidateReviewSectionAccounting } {
  const decisions: CandidateReviewDecision[] = [];
  const candidateItems = candidate.map((p) => ({
    id: p.id,
    title: p.title,
    authors: p.authors ?? '—',
    journal: p.journal ?? '—',
    year: p.year ?? 0,
    type: p.type === 'chapter' ? 'book' : (p.type ?? 'other'),
    doi: p.doi ?? undefined,
    impactFactor: p.impactFactor ?? undefined,
    quartile: p.quartile ?? undefined,
  })) as PublicationItem[];

  const diff = diffPublicationsSemantically(baseline, candidateItems);
  const matchedUpdated = diff.changed.length;
  const candidateOnlyAdded = diff.added.length;
  const matchedUnchanged = diff.unchangedCount;
  const candidateTotal = matchedUpdated + matchedUnchanged + candidateOnlyAdded;

  const removedIds = new Set(diff.removed.map((r) => r.id));
  const supersededIds = new Set<string>();
  let wrongSectionArtifact = 0;
  let unresolvedManualReview = 0;

  for (const ch of diff.changed) {
    decisions.push({
      decisionId: publicationDecisionId(ch.id, ch.id, 'update'),
      section: 'publications',
      candidateId: ch.id,
      existingId: ch.id,
      action: 'update',
      reason: 'Semantic match with field changes from fresh candidate',
      confidence: 'high',
    });
  }

  for (const add of diff.added) {
    decisions.push({
      decisionId: publicationDecisionId(undefined, add.id, 'add'),
      section: 'publications',
      candidateId: add.id,
      action: 'add',
      reason: 'Present in fresh candidate only',
      confidence: 'high',
    });
  }

  for (const rem of diff.removed) {
    const base = baseline.find((b) => b.id === rem.id);
    if (!base) {
      continue;
    }
    if (isBaselinePublicationSuperseded(base, candidate)) {
      supersededIds.add(base.id);
      decisions.push({
        decisionId: publicationDecisionId(base.id, undefined, 'superseded'),
        section: 'publications',
        existingId: base.id,
        action: 'update',
        reason: 'Baseline row superseded by fresh candidate semantic match',
        confidence: 'high',
      });
      continue;
    }

    const evidence = evaluateSourceMentionEvidence(base.title, sourceIndex);
    const action = classifyBaselineOnlyPublication(base);
    decisions.push({
      decisionId: publicationDecisionId(base.id, undefined, action),
      section: 'publications',
      existingId: base.id,
      action,
      reason: sourceMentionReason(evidence),
      confidence: action === 'remove-artifact' ? 'high' : evidence.confidence,
    });
    unresolvedManualReview += 1;
    if (action === 'remove-artifact') {
      wrongSectionArtifact += 1;
    }
  }

  const matchedBaseline = baseline.length - removedIds.size;
  const supersededBaseline = supersededIds.size;
  const unresolvedBaseline = removedIds.size - supersededIds.size;

  const baselineAccounting: CandidateReviewBaselineSectionAccounting = {
    matchedBaseline,
    supersededBaseline,
    unresolvedBaseline,
    preservedBaseline: 0,
    removedBaseline: 0,
    resolvedSkipped: 0,
    wrongSectionArtifact,
    clusteredBaseline: 0,
  };

  const accounting: CandidateReviewSectionAccounting = {
    mode: 'reconciled',
    candidateTotal,
    baselineTotal: baseline.length,
    matchedUpdated: matchedUpdated + matchedUnchanged,
    candidateOnlyAdded,
    baselinePreserved: 0,
    baselineRemovedArtifact: 0,
    unresolvedManualReview,
    resolvedSkipped: 0,
    finalTotalAfterApprovals: candidateTotal,
    baseline: baselineAccounting,
  };

  return { decisions, accounting };
}

function analyzeAwards(
  candidate: readonly Award[],
  baseline: SiteContent['about']['awards'][number][],
  sourceIndex: ReturnType<typeof buildSourceTextIndex>,
): { decisions: CandidateReviewDecision[]; accounting: CandidateReviewSectionAccounting } {
  const decisions: CandidateReviewDecision[] = [];

  const matchedBaselineIds = new Set<string>();
  for (const b of baseline) {
    if (isAwardMatchedByCandidate(b, candidate)) {
      matchedBaselineIds.add(b.id);
    }
  }

  const unmatchedBaseline = baseline.filter((b) => !matchedBaselineIds.has(b.id));
  const artifactBaseline = unmatchedBaseline.filter((b) => isAwardWrongSectionArtifact(b.title));
  const clusterableBaseline = unmatchedBaseline.filter((b) => !isAwardWrongSectionArtifact(b.title));

  const clustered = clusterBaselineAwardIds(clusterableBaseline);
  const clusterByMember = new Map<string, string[]>();

  for (const ids of clustered) {
    for (const id of ids) {
      clusterByMember.set(id, ids);
    }
    const primary = ids[0]!;
    const related = ids.slice(1);
    decisions.push({
      decisionId: makeDecisionId(['awards', 'cluster', [...ids].sort().join('+')]),
      section: 'awards',
      existingId: primary,
      relatedExistingIds: related.length > 0 ? related : undefined,
      action: 'manual-review',
      reason: 'Likely duplicate baseline awards for one event',
      confidence: 'medium',
    });
  }

  let matchedUpdated = 0;
  let candidateOnlyAdded = 0;
  let unresolvedManualReview = clustered.length;

  for (const a of candidate) {
    const hasBaseline = baseline.some((b) => isAwardMatchedByCandidate(b, [a]));
    if (!hasBaseline) {
      candidateOnlyAdded += 1;
      decisions.push({
        decisionId: awardDecisionId(undefined, a.id, 'add'),
        section: 'awards',
        candidateId: a.id,
        action: 'add',
        reason: 'Present in fresh candidate only',
        confidence: 'high',
      });
    } else {
      matchedUpdated += 1;
    }
  }

  for (const b of artifactBaseline) {
    decisions.push({
      decisionId: awardDecisionId(b.id, undefined, 'remove-artifact'),
      section: 'awards',
      existingId: b.id,
      action: 'remove-artifact',
      reason: 'Row belongs in service/membership narrative, not awards list',
      confidence: 'high',
    });
    unresolvedManualReview += 1;
  }

  for (const b of clusterableBaseline) {
    if (clusterByMember.has(b.id) && clusterByMember.get(b.id)![0] !== b.id) {
      continue;
    }
    if (clusterByMember.has(b.id)) {
      continue;
    }

    const evidence = evaluateSourceMentionEvidence(b.title, sourceIndex);
    decisions.push({
      decisionId: awardDecisionId(b.id, undefined, 'manual-review'),
      section: 'awards',
      existingId: b.id,
      action: 'manual-review',
      reason: sourceMentionReason(evidence),
      confidence: evidence.confidence,
    });
    unresolvedManualReview += 1;
  }

  const matchedBaseline = matchedBaselineIds.size;
  let unresolvedBaseline = 0;
  const wrongSectionArtifact = artifactBaseline.length;
  let clusteredBaseline = 0;

  for (const b of unmatchedBaseline) {
    if (clusterByMember.has(b.id)) {
      clusteredBaseline += 1;
      unresolvedBaseline += 1;
      continue;
    }
    if (isAwardWrongSectionArtifact(b.title)) {
      unresolvedBaseline += 1;
      continue;
    }
    unresolvedBaseline += 1;
  }

  const baselineAccounting: CandidateReviewBaselineSectionAccounting = {
    matchedBaseline,
    supersededBaseline: 0,
    unresolvedBaseline,
    preservedBaseline: 0,
    removedBaseline: 0,
    resolvedSkipped: 0,
    wrongSectionArtifact,
    clusteredBaseline,
  };

  const candidateTotal = candidate.length;
  const accounting: CandidateReviewSectionAccounting = {
    mode: 'reconciled',
    candidateTotal,
    baselineTotal: baseline.length,
    matchedUpdated,
    candidateOnlyAdded,
    baselinePreserved: 0,
    baselineRemovedArtifact: 0,
    unresolvedManualReview,
    resolvedSkipped: 0,
    finalTotalAfterApprovals: candidateTotal,
    baseline: baselineAccounting,
  };

  return { decisions, accounting };
}

function advisoryAccounting(
  candidateTotal: number,
  baselineTotal: number,
  unresolvedDecisions: number,
  affectedRecordCount: number,
): CandidateReviewAdvisorySectionAccounting {
  return {
    mode: 'advisory',
    candidateTotal,
    baselineTotal,
    unresolvedAdvisoryDecisions: unresolvedDecisions,
    affectedRecordCount,
  };
}

/**
 * Analyze candidate vs baseline and return a review manifest.
 * Does not mutate candidate Details or auto-apply manual-review decisions.
 */
export function analyzeCandidateReview(input: AnalyzeCandidateReviewInput): CandidateReviewManifest {
  const sourceIndex = buildSourceTextIndex(input.candidate.rawHtml);
  const pub = analyzePublications(
    input.candidate.publications,
    input.baseline.publications.items,
    sourceIndex,
  );
  const aw = analyzeAwards(input.candidate.about.awards, input.baseline.about.awards, sourceIndex);

  const decisions: CandidateReviewDecision[] = [...pub.decisions, ...aw.decisions];

  const unknownPatents = input.candidate.patents.filter((p) => !p.status).length;
  if (unknownPatents > 0) {
    decisions.push({
      decisionId: makeDecisionId(['patents', 'status-unknown']),
      section: 'patents',
      action: 'manual-review',
      reason: `${unknownPatents} patents have no individually verifiable status in the current CV`,
      confidence: 'high',
      affectedCount: unknownPatents,
    });
  }

  const manifest: CandidateReviewManifest = {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    importId: input.importId ?? input.candidate.meta?.sourceFileName ?? null,
    importSource: input.candidate.meta?.sourceFileName ?? 'unknown',
    baseline: input.baselineRef,
    decisions,
    analysisAccounting: {
      publications: pub.accounting,
      awards: aw.accounting,
    },
    accounting: {
      publications: pub.accounting,
      awards: aw.accounting,
      patents: advisoryAccounting(
        input.candidate.patents.length,
        input.baseline.patents.items.length,
        unknownPatents > 0 ? 1 : 0,
        unknownPatents,
      ),
      research: advisoryAccounting(
        input.candidate.research.projects.length,
        input.baseline.research.projects.length,
        0,
        0,
      ),
    },
  };

  assertAccountingConsistent(manifest);
  return manifest;
}

export { emptyBaselineAccounting };
