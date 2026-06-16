import { describe, expect, it } from 'vitest';

import { SITE_CONTENT_RAW } from '@/content/defaults';
import { assertSiteContent } from '@/content/validators';
import * as candidateReviewExports from '@/server/imports/candidateReconcile';
import {
  assertAccountingConsistent,
  assertBaselineAccountingConsistent,
  computeSectionAccounting,
} from '@/server/imports/candidateReviewAccounting';
import {
  analyzeCandidateReview,
  classifyBaselineOnlyAward,
  classifyBaselineOnlyPublication,
} from '@/server/imports/candidateReviewAnalyze';
import {
  applyCandidateReviewApprovals,
  applyCandidateReviewApprovalsIdempotent,
} from '@/server/imports/candidateReviewApply';
import {
  buildSourceTextIndex,
  evaluateSourceMentionEvidence,
  hasBoundedGapTokenSequence,
  hasSlidingTokenWindow,
  isAwardWrongSectionArtifact,
  isAuthorStringPublicationTitle,
} from '@/server/imports/candidateReviewIdentity';
import {
  CandidateReviewApprovalError,
  validateCandidateReviewApprovals,
} from '@/server/imports/candidateReviewValidate';
import { mergeCvDetailsIntoSiteContent } from '@/server/imports/detailsToSiteContentMerge';
import type { DetailsSchemaType } from '@/validators/detailsSchema';

function miniDetails(
  publications: DetailsSchemaType['publications'],
  awards: DetailsSchemaType['about']['awards'] = [],
  rawHtml = '<p>source text without matching phrases</p>',
  patents: DetailsSchemaType['patents'] = [],
): DetailsSchemaType {
  return {
    profile: { name: 'N', title: null, photoUrl: null, summary: null, meta: null },
    about: {
      brief: null,
      full: null,
      education: [],
      positions: [],
      awards,
      languages: [],
      cvNarrativeSections: [],
    },
    research: { interests: [], projects: [], grants: [] },
    publications,
    patents,
    contact: {
      email: 'a@b.com',
      personalEmail: 'a@b.com',
      phone: null,
      fax: null,
      cellPhone: null,
      address: null,
      department: null,
      university: null,
      website: null,
      cvUrl: null,
      social: {},
    },
    rawHtml,
    counts: {
      publications: publications.length,
      patents: patents.length,
      projects: 0,
      awards: awards.length,
      students: 0,
    },
    meta: {
      sourceFileName: 'cv-source.docx',
      parsedAt: '2026-01-01T00:00:00.000Z',
      parserVersion: 't',
      commitSha: null,
      uploader: null,
      warnings: [],
    },
  };
}

function pub(id: string, title: string, year: number): DetailsSchemaType['publications'][number] {
  return {
    id,
    title,
    authors: 'Author, A.',
    journal: 'Journal',
    year,
    type: 'journal',
    volume: null,
    issue: null,
    pages: null,
    doi: null,
    link: null,
    impactFactor: null,
    quartile: null,
    raw: null,
  };
}

function award(id: string, title: string): DetailsSchemaType['about']['awards'][number] {
  return {
    id,
    title,
    organization: 'Org',
    year: '2024',
    category: 'research',
    details: null,
    raw: null,
  };
}

const baselineRef = {
  sourceType: 'published' as const,
  versionId: 'version-abc123',
  publishSequence: 15,
  label: 'Published snapshot #15',
};

describe('source evidence', () => {
  const title = 'Adaptive spatial modeling for urban extended reality environments';
  const titleTokens = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w.length > 4);

  it('does not treat scattered tokens as a title mention', () => {
    const index = buildSourceTextIndex(
      '<p>adaptive modeling appears in one paragraph. urban environments discussed elsewhere. extended reality in another section.</p>',
    );
    const evidence = evaluateSourceMentionEvidence(title, index);
    expect(evidence.found).toBe(false);
    expect(evidence.method).toBe('none');
  });

  it('does not match ordered tokens separated across paragraphs', () => {
    const index = buildSourceTextIndex(
      '<p>adaptive spatial modeling</p>' +
        '<p>lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod</p>' +
        '<p>urban extended reality environments</p>',
    );
    expect(hasSlidingTokenWindow(index.normalizedText, titleTokens)).toBe(false);
    expect(hasBoundedGapTokenSequence(index.normalizedText, titleTokens)).toBe(false);
    expect(evaluateSourceMentionEvidence(title, index).found).toBe(false);
  });

  it('does not match reordered title tokens', () => {
    const haystack =
      'urban extended reality environments adaptive spatial modeling for';
    expect(hasSlidingTokenWindow(haystack, titleTokens)).toBe(false);
    const index = buildSourceTextIndex(`<p>${haystack}</p>`);
    expect(evaluateSourceMentionEvidence(title, index).found).toBe(false);
  });

  it('matches consecutive adjacent title tokens in source', () => {
    const haystack = title;
    expect(hasSlidingTokenWindow(haystack, titleTokens)).toBe(true);
    const index = buildSourceTextIndex(`<p>${haystack}</p>`);
    const evidence = evaluateSourceMentionEvidence(title, index);
    expect(evidence.found).toBe(true);
    expect(['exact', 'contiguous-token-sequence']).toContain(evidence.method);
  });

  it('accepts exact and APA title phrases', () => {
    const index = buildSourceTextIndex(
      '<p>Author (2024). Adaptive spatial modeling for urban environments. Journal.</p>',
    );
    const apa = evaluateSourceMentionEvidence('Adaptive spatial modeling for urban environments', index);
    expect(apa.found).toBe(true);
    expect(['exact', 'apa-title']).toContain(apa.method);
  });
});

describe('generic classification', () => {
  it('detects author-string publication titles by pattern', () => {
    expect(isAuthorStringPublicationTitle('Smith, J., Doe, A., & Lee, B')).toBe(true);
    expect(
      classifyBaselineOnlyPublication(
        {
          id: 'x',
          title: 'Smith, J., Doe, A., & Lee, B',
          authors: '—',
          journal: '—',
          year: 2026,
          type: 'journal',
        },
      ),
    ).toBe('remove-artifact');
  });

  it('flags membership rows as wrong-section award artifacts', () => {
    expect(isAwardWrongSectionArtifact('Professional Memberships')).toBe(true);
    expect(
      classifyBaselineOnlyAward(
        {
          id: 'm1',
          title: 'Professional Memberships',
          organization: 'Association',
          year: '—',
          details: '—',
          impact: '—',
          category: 'service',
        },
        false,
      ),
    ).toBe('remove-artifact');
  });
});

describe('initial artifact accounting', () => {
  it('counts unapproved remove-artifact as unresolved with zero removed', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const artifact = {
      id: 'author-string-pub',
      title: 'Smith, J., Doe, A., & Lee, B',
      authors: '—',
      journal: '—',
      year: 2026,
      type: 'journal' as const,
    };
    const baselineWithArtifact = {
      ...baseline,
      publications: {
        ...baseline.publications,
        items: [...baseline.publications.items, artifact],
      },
    };
    const manifest = analyzeCandidateReview({
      candidate: miniDetails([pub('c1', 'Candidate publication alpha', 2024)]),
      baseline: baselineWithArtifact,
      baselineRef,
    });

    expect(manifest.accounting.publications.baselineRemovedArtifact).toBe(0);
    expect(manifest.accounting.publications.unresolvedManualReview).toBeGreaterThan(0);
    assertAccountingConsistent(manifest);
  });
});

describe('approval validation', () => {
  it('throws on unknown decision id', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const manifest = analyzeCandidateReview({
      candidate: miniDetails([]),
      baseline,
      baselineRef,
    });
    expect(() =>
      validateCandidateReviewApprovals(manifest, baseline, [
        { decisionId: 'missing-id', approvedAction: 'skip' },
      ]),
    ).toThrow(CandidateReviewApprovalError);
  });

  it('throws on duplicate approval decision ids', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const manifest = analyzeCandidateReview({
      candidate: miniDetails([]),
      baseline,
      baselineRef,
    });
    const decision = manifest.decisions.find((d) => d.action === 'manual-review');
    if (!decision) {
      return;
    }
    expect(() =>
      validateCandidateReviewApprovals(manifest, baseline, [
        { decisionId: decision.decisionId, approvedAction: 'skip' },
        { decisionId: decision.decisionId, approvedAction: 'skip' },
      ]),
    ).toThrow(/Duplicate approval/);
  });

  it('throws on incompatible preserve-existing for remove-artifact', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const artifact = {
      id: 'membership-row',
      title: 'Professional Memberships',
      organization: 'Association',
      year: '—',
      details: '—',
      impact: '—',
      category: 'service' as const,
    };
    const baselineWithMembership = {
      ...baseline,
      about: { ...baseline.about, awards: [...baseline.about.awards, artifact] },
    };
    const manifest = analyzeCandidateReview({
      candidate: miniDetails([], []),
      baseline: baselineWithMembership,
      baselineRef,
    });
    const decision = manifest.decisions.find((d) => d.existingId === 'membership-row')!;
    expect(() =>
      validateCandidateReviewApprovals(manifest, baselineWithMembership, [
        { decisionId: decision.decisionId, approvedAction: 'preserve-existing' },
      ]),
    ).toThrow(/incompatible/i);
  });
});

describe('applyCandidateReviewApprovals', () => {
  it('leaves candidate unchanged without approvals', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const baselineOnly = {
      id: 'baseline-only',
      title: 'Baseline-only publication gamma',
      authors: 'A',
      journal: 'J',
      year: 2025,
      type: 'journal' as const,
    };
    const baselineWithExtra = {
      ...baseline,
      publications: {
        ...baseline.publications,
        items: [...baseline.publications.items, baselineOnly],
      },
    };
    const candidate = miniDetails([pub('c1', 'Candidate publication beta', 2024)]);
    const manifest = analyzeCandidateReview({ candidate, baseline: baselineWithExtra, baselineRef });
    const { details } = applyCandidateReviewApprovals(candidate, baselineWithExtra, manifest, []);
    expect(details.publications).toHaveLength(1);
  });

  it('approved preserve-existing adds baseline publication', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const baselineOnly = {
      id: 'baseline-only',
      title: 'Baseline-only publication delta',
      authors: 'A',
      journal: 'J',
      year: 2025,
      type: 'journal' as const,
    };
    const baselineWithExtra = {
      ...baseline,
      publications: {
        ...baseline.publications,
        items: [...baseline.publications.items, baselineOnly],
      },
    };
    const candidate = miniDetails([]);
    const manifest = analyzeCandidateReview({ candidate, baseline: baselineWithExtra, baselineRef });
    const decision = manifest.decisions.find((d) => d.existingId === 'baseline-only')!;

    const { details, manifest: applied } = applyCandidateReviewApprovals(
      candidate,
      baselineWithExtra,
      manifest,
      [{ decisionId: decision.decisionId, approvedAction: 'preserve-existing' }],
    );

    expect(details.publications.some((p) => p.id === 'baseline-only')).toBe(true);
    expect(applied.accounting.publications.baselinePreserved).toBe(1);
    expect(applied.accounting.publications.finalTotalAfterApprovals).toBe(1);
  });

  it('approved approve-removal accounts intentional omission without splice', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const artifact = {
      id: 'author-string-pub',
      title: 'Smith, J., Doe, A., & Lee, B',
      authors: '—',
      journal: '—',
      year: 2026,
      type: 'journal' as const,
    };
    const baselineWithArtifact = {
      ...baseline,
      publications: {
        ...baseline.publications,
        items: [...baseline.publications.items, artifact],
      },
    };
    const candidate = miniDetails([pub('c1', 'Candidate publication', 2024)]);
    const manifest = analyzeCandidateReview({
      candidate,
      baseline: baselineWithArtifact,
      baselineRef,
    });
    const decision = manifest.decisions.find(
      (d) => d.existingId === 'author-string-pub' && d.action === 'remove-artifact',
    )!;

    const { details, manifest: applied } = applyCandidateReviewApprovals(
      candidate,
      baselineWithArtifact,
      manifest,
      [{ decisionId: decision.decisionId, approvedAction: 'approve-removal' }],
    );

    expect(details.publications).toHaveLength(1);
    expect(applied.accounting.publications.baselineRemovedArtifact).toBe(1);
    expect(applied.accounting.publications.unresolvedManualReview).toBe(
      manifest.accounting.publications.unresolvedManualReview - 1,
    );
  });

  it('approve-removal on baseline publication does not delete colliding candidate id', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const sharedId = 'collision-pub';
    const baselineOnly = {
      id: sharedId,
      title: 'Baseline-only publication for intentional omission',
      authors: 'A',
      journal: 'J',
      year: 2025,
      type: 'journal' as const,
    };
    const baselineWithExtra = {
      ...baseline,
      publications: {
        ...baseline.publications,
        items: [...baseline.publications.items, baselineOnly],
      },
    };
    const manifest = analyzeCandidateReview({
      candidate: miniDetails([]),
      baseline: baselineWithExtra,
      baselineRef,
    });
    const decision = manifest.decisions.find(
      (d) => d.existingId === sharedId && d.action === 'manual-review',
    )!;
    const candidateWithCollision = miniDetails([
      pub(sharedId, 'Candidate publication with same id', 2024),
    ]);

    const { details } = applyCandidateReviewApprovals(
      candidateWithCollision,
      baselineWithExtra,
      manifest,
      [{ decisionId: decision.decisionId, approvedAction: 'approve-removal' }],
    );

    expect(details.publications).toHaveLength(1);
    expect(details.publications[0]!.id).toBe(sharedId);
    expect(details.publications[0]!.title).toBe('Candidate publication with same id');
  });

  it('approve-removal on baseline award does not delete colliding candidate award id', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const sharedId = 'award-same-id';
    const baselineAward = {
      id: sharedId,
      title: 'Baseline-only award for intentional omission',
      organization: 'Org',
      year: '2020',
      details: '—',
      impact: '—',
      category: 'research' as const,
    };
    const baselineWithAward = {
      ...baseline,
      about: { ...baseline.about, awards: [...baseline.about.awards, baselineAward] },
    };
    const candidate = miniDetails([], [award(sharedId, 'Candidate award with same id')]);
    const manifest = analyzeCandidateReview({
      candidate,
      baseline: baselineWithAward,
      baselineRef,
    });
    const decision = manifest.decisions.find(
      (d) => d.existingId === sharedId && d.section === 'awards',
    )!;

    const { details } = applyCandidateReviewApprovals(
      candidate,
      baselineWithAward,
      manifest,
      [{ decisionId: decision.decisionId, approvedAction: 'approve-removal' }],
    );

    expect(details.about.awards).toHaveLength(1);
    expect(details.about.awards[0]!.id).toBe(sharedId);
    expect(details.about.awards[0]!.title).toBe('Candidate award with same id');
  });

  it('skip resolves artifact without counting as removed', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const artifact = {
      id: 'membership-row',
      title: 'Professional Memberships',
      organization: 'Association',
      year: '—',
      details: '—',
      impact: '—',
      category: 'service' as const,
    };
    const baselineWithMembership = {
      ...baseline,
      about: { ...baseline.about, awards: [...baseline.about.awards, artifact] },
    };
    const candidate = miniDetails([], []);
    const manifest = analyzeCandidateReview({
      candidate,
      baseline: baselineWithMembership,
      baselineRef,
    });
    const decision = manifest.decisions.find((d) => d.existingId === 'membership-row')!;
    const { details, manifest: applied } = applyCandidateReviewApprovals(
      candidate,
      baselineWithMembership,
      manifest,
      [{ decisionId: decision.decisionId, approvedAction: 'skip' }],
    );

    expect(details.about.awards).toHaveLength(0);
    expect(applied.accounting.awards.baselineRemovedArtifact).toBe(0);
    expect(applied.accounting.awards.resolvedSkipped).toBe(1);
  });

  it('does not add membership rows without approval', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const membership = {
      id: 'membership-row',
      title: 'Professional Memberships',
      organization: 'Association',
      year: '—',
      details: '—',
      impact: '—',
      category: 'service' as const,
    };
    const baselineWithMembership = {
      ...baseline,
      about: { ...baseline.about, awards: [...baseline.about.awards, membership] },
    };
    const candidate = miniDetails([], []);
    const manifest = analyzeCandidateReview({
      candidate,
      baseline: baselineWithMembership,
      baselineRef,
    });
    const { details } = applyCandidateReviewApprovals(candidate, baselineWithMembership, manifest, []);
    expect(details.about.awards.some((a) => a.title === 'Professional Memberships')).toBe(false);
  });
});

describe('award duplicate cluster', () => {
  const keynoteA = {
    id: 'key-a',
    title: 'Keynote Speaker Recognition, International Conference on Applied Computing 2025',
    organization: 'Institute',
    year: '2025',
    details: '—',
    impact: '—',
    category: 'research' as const,
  };
  const keynoteB = {
    id: 'key-b',
    title: 'Certificate of Appreciation as Keynote Speaker, International Conference on Applied Computing 2025',
    organization: 'Institute',
    year: '2025',
    details: '—',
    impact: '—',
    category: 'research' as const,
  };

  function baselineWithCluster() {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    return {
      ...baseline,
      about: {
        ...baseline.about,
        awards: [...baseline.about.awards, keynoteA, keynoteB],
      },
    };
  }

  it('preserve requires selectedExistingId and preserves exactly one row', () => {
    const baseline = baselineWithCluster();
    const candidate = miniDetails([], [award('c-award', 'Unrelated candidate award')]);
    const manifest = analyzeCandidateReview({ candidate, baseline, baselineRef });
    const cluster = manifest.decisions.find((d) => d.decisionId.startsWith('awards:cluster:'))!;

    expect(() =>
      applyCandidateReviewApprovals(candidate, baseline, manifest, [
        { decisionId: cluster.decisionId, approvedAction: 'preserve-existing' },
      ]),
    ).toThrow(/selectedExistingId/);

    const { details } = applyCandidateReviewApprovals(candidate, baseline, manifest, [
      {
        decisionId: cluster.decisionId,
        approvedAction: 'preserve-existing',
        selectedExistingId: 'key-b',
      },
    ]);

    expect(details.about.awards.filter((a) => a.id === 'key-a' || a.id === 'key-b')).toHaveLength(1);
    expect(details.about.awards.some((a) => a.id === 'key-b')).toBe(true);
  });

  it('approve-removal updates accounting without splicing candidate rows', () => {
    const baseline = baselineWithCluster();
    const candidate = miniDetails([], [award('c-award', 'Unrelated candidate award')]);
    const manifest = analyzeCandidateReview({ candidate, baseline, baselineRef });
    const cluster = manifest.decisions.find((d) => d.decisionId.startsWith('awards:cluster:'))!;

    const { details, manifest: applied } = applyCandidateReviewApprovals(candidate, baseline, manifest, [
      { decisionId: cluster.decisionId, approvedAction: 'approve-removal' },
    ]);

    expect(details.about.awards).toHaveLength(1);
    expect(details.about.awards[0]!.id).toBe('c-award');
    expect(applied.accounting.awards.baselineRemovedArtifact).toBe(2);
    assertAccountingConsistent(applied);
  });

  it('does not cluster matched baseline awards', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const matchedAward = {
      id: 'matched-award',
      title: 'Distinguished Research Excellence Award 2024',
      organization: 'University',
      year: '2024',
      details: '—',
      impact: '—',
      category: 'research' as const,
    };
    const dupA = {
      id: 'dup-a',
      title: 'Keynote Speaker Recognition, International Conference on Applied Computing 2025',
      organization: 'Institute',
      year: '2025',
      details: '—',
      impact: '—',
      category: 'research' as const,
    };
    const dupB = {
      id: 'dup-b',
      title: 'Certificate of Appreciation as Keynote Speaker, International Conference on Applied Computing 2025',
      organization: 'Institute',
      year: '2025',
      details: '—',
      impact: '—',
      category: 'research' as const,
    };
    const baselineWithAwards = {
      ...baseline,
      about: {
        ...baseline.about,
        awards: [...baseline.about.awards, matchedAward, dupA, dupB],
      },
    };
    const candidate = miniDetails([], [award('c-matched', matchedAward.title)]);
    const manifest = analyzeCandidateReview({ candidate, baseline: baselineWithAwards, baselineRef });

    const clusterDecisions = manifest.decisions.filter((d) =>
      d.decisionId.startsWith('awards:cluster:'),
    );
    expect(clusterDecisions).toHaveLength(1);
    expect(clusterDecisions[0]!.existingId).toBe('dup-a');
    expect(clusterDecisions[0]!.relatedExistingIds).toEqual(['dup-b']);
    expect(clusterDecisions.some((d) => d.existingId === 'matched-award')).toBe(false);

    assertAccountingConsistent(manifest);
    expect(manifest.accounting.awards.baseline.matchedBaseline).toBe(1);
    expect(manifest.accounting.awards.baseline.clusteredBaseline).toBe(2);
    expect(manifest.accounting.awards.baseline.unresolvedBaseline).toBeGreaterThanOrEqual(0);
  });

  it('skip leaves candidate unchanged', () => {
    const baseline = baselineWithCluster();
    const candidate = miniDetails([], [award('c-award', 'Unrelated candidate award')]);
    const manifest = analyzeCandidateReview({ candidate, baseline, baselineRef });
    const cluster = manifest.decisions.find((d) => d.decisionId.startsWith('awards:cluster:'))!;

    const before = candidate.about.awards.length;
    const { details } = applyCandidateReviewApprovals(candidate, baseline, manifest, [
      { decisionId: cluster.decisionId, approvedAction: 'skip' },
    ]);
    expect(details.about.awards).toHaveLength(before);
  });

  it('repeated cluster preserve is idempotent', () => {
    const baseline = baselineWithCluster();
    const candidate = miniDetails([], []);
    const manifest = analyzeCandidateReview({ candidate, baseline, baselineRef });
    const cluster = manifest.decisions.find((d) => d.decisionId.startsWith('awards:cluster:'))!;
    const approvals = [
      {
        decisionId: cluster.decisionId,
        approvedAction: 'preserve-existing' as const,
        selectedExistingId: 'key-a',
      },
    ];
    const once = applyCandidateReviewApprovalsIdempotent(candidate, baseline, manifest, approvals);
    const twice = applyCandidateReviewApprovalsIdempotent(candidate, baseline, manifest, approvals);
    expect(once.about.awards).toEqual(twice.about.awards);
  });
});

describe('baseline accounting invariants', () => {
  it('assigns every baseline publication id to exactly one category', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const extras = [
      {
        id: 'baseline-only',
        title: 'Baseline-only publication epsilon',
        authors: 'A',
        journal: 'J',
        year: 2025,
        type: 'journal' as const,
      },
      {
        id: 'author-string-pub',
        title: 'Smith, J., Doe, A., & Lee, B',
        authors: '—',
        journal: '—',
        year: 2026,
        type: 'journal' as const,
      },
    ];
    const baselineWithExtras = {
      ...baseline,
      publications: {
        ...baseline.publications,
        items: [...baseline.publications.items, ...extras],
      },
    };
    const manifest = analyzeCandidateReview({
      candidate: miniDetails([pub('c1', 'Candidate publication zeta', 2024)]),
      baseline: baselineWithExtras,
      baselineRef,
    });
    assertBaselineAccountingConsistent('publications', manifest.accounting.publications);
  });
});

describe('advisory sections', () => {
  it('does not claim false patent matches', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const patents = [
      {
        id: 'p1',
        title: 'Patent one',
        number: '1',
        country: 'US',
        date: null,
        inventors: null,
        status: null,
        type: 'international' as const,
        raw: null,
      },
      {
        id: 'p2',
        title: 'Patent two',
        number: '2',
        country: 'US',
        date: null,
        inventors: null,
        status: null,
        type: 'international' as const,
        raw: null,
      },
    ];
    const manifest = analyzeCandidateReview({
      candidate: miniDetails([], [], '<p></p>', patents),
      baseline,
      baselineRef,
    });

    expect(manifest.accounting.patents.mode).toBe('advisory');
    expect(manifest.accounting.patents.affectedRecordCount).toBe(2);
    expect(manifest.accounting.research.mode).toBe('advisory');
    const patentDecision = manifest.decisions.find((d) => d.section === 'patents');
    expect(patentDecision?.affectedCount).toBe(2);
  });

  it('rejects normal approvals on advisory patent decisions', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const patents = [
      {
        id: 'p1',
        title: 'Patent one',
        number: '1',
        country: 'US',
        date: null,
        inventors: null,
        status: null,
        type: 'international' as const,
        raw: null,
      },
    ];
    const manifest = analyzeCandidateReview({
      candidate: miniDetails([], [], '<p></p>', patents),
      baseline,
      baselineRef,
    });
    const patentDecision = manifest.decisions.find((d) => d.section === 'patents')!;

    for (const action of ['preserve-existing', 'approve-removal', 'skip'] as const) {
      expect(() =>
        validateCandidateReviewApprovals(manifest, baseline, [
          { decisionId: patentDecision.decisionId, approvedAction: action },
        ]),
      ).toThrow(/Advisory decision/);
    }
  });
});

describe('accounting idempotency', () => {
  it('recomputes publications accounting identically from original and applied manifests', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const baselineOnly = {
      id: 'baseline-only',
      title: 'Baseline-only publication iota',
      authors: 'A',
      journal: 'J',
      year: 2025,
      type: 'journal' as const,
    };
    const baselineWithExtra = {
      ...baseline,
      publications: {
        ...baseline.publications,
        items: [...baseline.publications.items, baselineOnly],
      },
    };
    const candidate = miniDetails([pub('c1', 'Candidate publication', 2024)]);
    const manifest = analyzeCandidateReview({ candidate, baseline: baselineWithExtra, baselineRef });
    const decision = manifest.decisions.find((d) => d.existingId === 'baseline-only')!;
    const approvals = [{ decisionId: decision.decisionId, approvedAction: 'preserve-existing' as const }];

    const fromOriginal = computeSectionAccounting('publications', manifest, approvals);
    const { manifest: applied } = applyCandidateReviewApprovals(
      candidate,
      baselineWithExtra,
      manifest,
      approvals,
    );
    const fromApplied = computeSectionAccounting('publications', applied, approvals);

    expect(fromApplied).toEqual(fromOriginal);
    assertAccountingConsistent(applied);
  });

  it('recomputes award cluster accounting identically from original and applied manifests', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const keynoteA = {
      id: 'key-a',
      title: 'Keynote Speaker Recognition, International Conference on Applied Computing 2025',
      organization: 'Institute',
      year: '2025',
      details: '—',
      impact: '—',
      category: 'research' as const,
    };
    const keynoteB = {
      id: 'key-b',
      title: 'Certificate of Appreciation as Keynote Speaker, International Conference on Applied Computing 2025',
      organization: 'Institute',
      year: '2025',
      details: '—',
      impact: '—',
      category: 'research' as const,
    };
    const baselineWithCluster = {
      ...baseline,
      about: { ...baseline.about, awards: [...baseline.about.awards, keynoteA, keynoteB] },
    };
    const candidate = miniDetails([], []);
    const manifest = analyzeCandidateReview({ candidate, baseline: baselineWithCluster, baselineRef });
    const cluster = manifest.decisions.find((d) => d.decisionId.startsWith('awards:cluster:'))!;
    const approvals = [
      {
        decisionId: cluster.decisionId,
        approvedAction: 'preserve-existing' as const,
        selectedExistingId: 'key-a',
      },
    ];

    const fromOriginal = computeSectionAccounting('awards', manifest, approvals);
    const { manifest: applied } = applyCandidateReviewApprovals(
      candidate,
      baselineWithCluster,
      manifest,
      approvals,
    );
    const fromApplied = computeSectionAccounting('awards', applied, approvals);

    expect(fromApplied).toEqual(fromOriginal);
    assertAccountingConsistent(applied);
  });
});

describe('public API', () => {
  it('exposes analyzeCandidateAgainstBaseline without misleading reconcile wrapper', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const candidate = miniDetails([pub('c1', 'Candidate publication', 2024)]);
    const manifest = candidateReviewExports.analyzeCandidateAgainstBaseline(
      candidate,
      baseline,
      baselineRef,
      'import-1',
    );
    expect(manifest.baseline.versionId).toBe('version-abc123');
    expect('reconcileCandidateWithBaseline' in candidateReviewExports).toBe(false);
  });
});

describe('naive merge hazard', () => {
  it('drops baseline-only rows without apply step', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const baselineOnly = {
      id: 'future-pub',
      title: 'Baseline-only publication theta',
      authors: 'A',
      journal: 'J',
      year: 2026,
      type: 'journal' as const,
    };
    const baselineWithFuture = {
      ...baseline,
      publications: {
        ...baseline.publications,
        items: [...baseline.publications.items, baselineOnly],
      },
    };
    const merged = mergeCvDetailsIntoSiteContent(miniDetails([]), baselineWithFuture);
    expect(merged.publications.items.some((p) => p.id === 'future-pub')).toBe(false);
  });
});
