import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { CV_NARRATIVE_LIST_ITEM_PREFIX } from '@/server/imports/cvNarrativeToSimpleLists';
import {
  evaluateImportMergeSectionSafety,
  freezeKeysFromSafetyReport,
} from '@/server/imports/importMergeSectionSafety';
import type { ImportReviewBlock } from '@/server/imports/importReviewStructured';
import type { ImportCandidateReviewMetadataDto } from '@/server/imports/types';

function reviewBlock(partial: Partial<ImportReviewBlock> & Pick<ImportReviewBlock, 'id' | 'title'>): ImportReviewBlock {
  return {
    unchangedSummary: null,
    added: [],
    removed: [],
    changed: [],
    ...partial,
  };
}

function candidateReview(overrides: Partial<ImportCandidateReviewMetadataDto> = {}): ImportCandidateReviewMetadataDto {
  return {
    schemaVersion: 2,
    envelopeVersion: 1,
    reviewHint: 'READY',
    sourceTextHash: 'aa'.repeat(32),
    parserVersion: 't',
    mappingVersion: 'm',
    rawSectionSummaries: [],
    unmappedSections: [],
    sectionMappingReport: [],
    countValidation: { entries: [] },
    parserWarnings: [],
    ...overrides,
  };
}

describe('importMergeSectionSafety', () => {
  it('marks patents review-only and excludes them from safe merge when PATENT_COUNT_MISMATCH is present', () => {
    const blocks: ImportReviewBlock[] = [
      reviewBlock({ id: 'patents', title: 'Patents', added: ['x'], removed: [], changed: [] }),
    ];
    const report = evaluateImportMergeSectionSafety({
      reviewBlocks: blocks,
      candidateReview: candidateReview({
        countValidation: {
          entries: [
            {
              domain: 'patents',
              declaredInHeading: 52,
              extractedCount: 5,
              severity: 'warning',
              code: 'PATENT_COUNT_MISMATCH',
            },
          ],
        },
      }),
    });
    const patents = report.sections.find((s) => s.id === 'patents');
    expect(patents?.risk).toBe('review_only_default');
    expect(patents?.includeInSafeMerge).toBe(false);
    expect(report.fullReplaceRequiresAck).toBe(true);
    expect(freezeKeysFromSafetyReport(report).has('patents')).toBe(true);
  });

  it('marks high list churn on experiences as not merge-safe by default', () => {
    const blocks: ImportReviewBlock[] = [
      reviewBlock({
        id: 'experiences',
        title: 'Professional experience',
        added: Array.from({ length: 28 }, (_, i) => `Added line ${i}`),
        removed: Array.from({ length: 3 }, (_, i) => `Removed line ${i}`),
        changed: [],
      }),
    ];
    const report = evaluateImportMergeSectionSafety({
      reviewBlocks: blocks,
      candidateReview: candidateReview(),
    });
    const exp = report.sections.find((s) => s.id === 'experiences');
    expect(exp?.includeInSafeMerge).toBe(false);
    expect(['needs_review', 'requires_explicit_replace']).toContain(exp?.risk);
    expect(freezeKeysFromSafetyReport(report).has('experiences')).toBe(true);
  });

  it('adds notes for unmapped sections and NEEDS_REVIEW hint', () => {
    const report = evaluateImportMergeSectionSafety({
      reviewBlocks: [],
      candidateReview: candidateReview({
        unmappedSections: [{ sectionId: 's1', title: 'Loose', reason: 'unmapped' }],
        reviewHint: 'NEEDS_REVIEW',
      }),
    });
    expect(report.notes.some((n) => n.includes('unmapped'))).toBe(true);
    expect(report.notes.some((n) => n.includes('NEEDS_REVIEW'))).toBe(true);
  });

  it('marks teaching/supervision/service review-only when candidate has cv narrative imports', () => {
    const report = evaluateImportMergeSectionSafety({
      reviewBlocks: [],
      candidateReview: candidateReview(),
      cvNarrativeSections: [
        {
          id: 'nar-teach-1',
          kind: 'teaching',
          sectionTitle: 'Teaching Experiences',
          body: 'Raw CV teaching block.',
          sourceSectionType: 'services',
        },
        {
          id: 'nar-lead-1',
          kind: 'leadership_supervision',
          sectionTitle: 'Supervision',
          body: 'Raw CV supervision block.',
          sourceSectionType: 'academic_narrative',
        },
        {
          id: 'nar-svc-1',
          kind: 'skills',
          sectionTitle: 'Skills',
          body: 'Raw CV skills block.',
          sourceSectionType: 'services',
        },
      ],
    });
    for (const id of ['teaching', 'supervision', 'service'] as const) {
      const row = report.sections.find((s) => s.id === id);
      expect(row?.risk).toBe('review_only_default');
      expect(row?.includeInSafeMerge).toBe(false);
    }
    expect(freezeKeysFromSafetyReport(report).has('cvNarrative')).toBe(true);
    expect(report.notes.some((n) => n.includes('CV narrative'))).toBe(true);
  });

  it('downgrades publications in safe merge when parser errors mention publications', () => {
    const blocks: ImportReviewBlock[] = [
      reviewBlock({ id: 'publications', title: 'Pubs', added: ['a'], removed: [], changed: [] }),
    ];
    const report = evaluateImportMergeSectionSafety({
      reviewBlocks: blocks,
      candidateReview: candidateReview({
        parserWarnings: [{ code: 'PUBLICATION_PARSE', message: 'bad publication row', severity: 'error' }],
      }),
    });
    const pubs = report.sections.find((s) => s.id === 'publications');
    expect(pubs?.includeInSafeMerge).toBe(false);
    expect(pubs?.risk).toBe('review_only_default');
  });

  it('adds a non-blocking note when imported summary is significantly longer than baseline (ratio >= 2.5)', () => {
    const report = evaluateImportMergeSectionSafety({
      reviewBlocks: [],
      candidateReview: candidateReview(),
      summarySizeHint: { importedChars: 2500, baselineChars: 800 },
    });
    const summary = report.sections.find((s) => s.id === 'summary');
    expect(summary?.risk).toBe('safe_to_merge');
    expect(summary?.includeInSafeMerge).toBe(true);
    expect(summary?.reasons.some((r) => r.includes('much longer'))).toBe(true);
    expect(report.notes.some((n) => n.includes('longer'))).toBe(true);
  });

  it('adds a non-blocking note when imported summary is more than 800 chars longer than baseline', () => {
    const report = evaluateImportMergeSectionSafety({
      reviewBlocks: [],
      candidateReview: candidateReview(),
      summarySizeHint: { importedChars: 1600, baselineChars: 700 },
    });
    const summary = report.sections.find((s) => s.id === 'summary');
    expect(summary?.risk).toBe('safe_to_merge');
    expect(summary?.reasons.some((r) => r.includes('much longer'))).toBe(true);
  });

  it('does not add summary size note when imported summary is only moderately longer', () => {
    const report = evaluateImportMergeSectionSafety({
      reviewBlocks: [],
      candidateReview: candidateReview(),
      summarySizeHint: { importedChars: 900, baselineChars: 700 },
    });
    const summary = report.sections.find((s) => s.id === 'summary');
    expect(summary?.reasons.some((r) => r.includes('much longer'))).toBe(false);
    expect(report.notes.some((n) => n.includes('longer'))).toBe(false);
  });

  it('does not add summary size note when summarySizeHint is not provided', () => {
    const report = evaluateImportMergeSectionSafety({
      reviewBlocks: [],
      candidateReview: candidateReview(),
    });
    const summary = report.sections.find((s) => s.id === 'summary');
    expect(summary?.reasons.some((r) => r.includes('much longer'))).toBe(false);
  });

  it('safe_update summary remains safe_to_merge even with large summary warning', () => {
    const report = evaluateImportMergeSectionSafety({
      reviewBlocks: [],
      candidateReview: candidateReview(),
      summarySizeHint: { importedChars: 5000, baselineChars: 500 },
    });
    expect(report.fullReplaceRequiresAck).toBe(false);
    const summary = report.sections.find((s) => s.id === 'summary');
    expect(summary?.includeInSafeMerge).toBe(true);
  });

  it('journey quality warning: collapse — imported count much lower than baseline', () => {
    const report = evaluateImportMergeSectionSafety({
      reviewBlocks: [],
      candidateReview: candidateReview(),
      qualityHints: {
        journeyCollapse: { importedCount: 2, baselineCount: 8, hasGiantRows: false },
      },
    });
    const journey = report.sections.find((s) => s.id === 'journey');
    expect(journey?.risk).toBe('needs_review');
    expect(journey?.includeInSafeMerge).toBe(false);
    expect(journey?.reasons.some((r) => r.includes('parser collapse'))).toBe(true);
    expect(report.fullReplaceRequiresAck).toBe(true);
  });

  it('journey quality warning: giant rows (concatenated details)', () => {
    const report = evaluateImportMergeSectionSafety({
      reviewBlocks: [],
      candidateReview: candidateReview(),
      qualityHints: {
        journeyCollapse: { importedCount: 6, baselineCount: 7, hasGiantRows: true },
      },
    });
    const journey = report.sections.find((s) => s.id === 'journey');
    expect(journey?.includeInSafeMerge).toBe(false);
    expect(journey?.reasons.some((r) => r.includes('concatenated rows'))).toBe(true);
  });

  it('journey quality warning: no warning when counts are reasonable and no giant rows', () => {
    const report = evaluateImportMergeSectionSafety({
      reviewBlocks: [],
      candidateReview: candidateReview(),
      qualityHints: {
        journeyCollapse: { importedCount: 6, baselineCount: 8, hasGiantRows: false },
      },
    });
    const journey = report.sections.find((s) => s.id === 'journey');
    // No quality warning — falls back to churn-based logic; no churn means safe_to_merge
    expect(journey?.risk).toBe('safe_to_merge');
    expect(journey?.includeInSafeMerge).toBe(true);
  });

  it('experience quality warning: many Unknown Organization rows trigger needs_review', () => {
    const report = evaluateImportMergeSectionSafety({
      reviewBlocks: [],
      candidateReview: candidateReview(),
      qualityHints: {
        experienceQuality: { unknownOrgCount: 4, totalCount: 8 },
      },
    });
    const exp = report.sections.find((s) => s.id === 'experiences');
    expect(exp?.risk).toBe('needs_review');
    expect(exp?.includeInSafeMerge).toBe(false);
    expect(exp?.reasons.some((r) => r.includes('unknown organization'))).toBe(true);
    expect(report.fullReplaceRequiresAck).toBe(true);
  });

  it('experience quality warning: no warning when unknown org ratio is low', () => {
    const report = evaluateImportMergeSectionSafety({
      reviewBlocks: [],
      candidateReview: candidateReview(),
      qualityHints: {
        experienceQuality: { unknownOrgCount: 1, totalCount: 10 },
      },
    });
    const exp = report.sections.find((s) => s.id === 'experiences');
    // Only 10% unknown — no quality warning; churn is 0, so safe_to_merge
    expect(exp?.risk).toBe('safe_to_merge');
    expect(exp?.includeInSafeMerge).toBe(true);
  });

  it('summaryTrimNotes appear as non-blocking reasons and top-level notes on summary section', () => {
    const report = evaluateImportMergeSectionSafety({
      reviewBlocks: [],
      candidateReview: candidateReview(),
      summaryTrimNotes: ['Home intro trimmed from 900 to 598 chars to fit display limit (600).'],
    });
    const summary = report.sections.find((s) => s.id === 'summary');
    expect(summary?.risk).toBe('safe_to_merge');
    expect(summary?.includeInSafeMerge).toBe(true);
    expect(summary?.reasons.some((r) => r.includes('Home intro trimmed'))).toBe(true);
    expect(report.notes.some((n) => n.includes('Home intro trimmed'))).toBe(true);
    // Non-blocking: does not require ack on its own
    expect(report.fullReplaceRequiresAck).toBe(false);
  });

  it('marks teaching review-only when structured diff shows cv-nar- list churn', () => {
    const cvNarLine = `[added] CV row (id: ${CV_NARRATIVE_LIST_ITEM_PREFIX}nar-1)`;
    const report = evaluateImportMergeSectionSafety({
      reviewBlocks: [
        reviewBlock({
          id: 'teaching',
          title: 'Teaching',
          added: [cvNarLine],
          removed: [],
          changed: [],
        }),
      ],
      candidateReview: candidateReview(),
    });
    const teaching = report.sections.find((s) => s.id === 'teaching');
    expect(teaching?.risk).toBe('review_only_default');
    expect(teaching?.includeInSafeMerge).toBe(false);
    expect(teaching?.reasons.some((r) => r.includes('cv-nar-'))).toBe(true);
    expect(freezeKeysFromSafetyReport(report).has('cvNarrative')).toBe(true);
  });

  it('safe_update excludes risky sections but is not blocked when quality warnings present', () => {
    const report = evaluateImportMergeSectionSafety({
      reviewBlocks: [],
      candidateReview: candidateReview(),
      qualityHints: {
        journeyCollapse: { importedCount: 1, baselineCount: 9, hasGiantRows: false },
        experienceQuality: { unknownOrgCount: 5, totalCount: 6 },
      },
    });
    // fullReplaceRequiresAck means safe_update is still available, just journey/exp are frozen
    expect(report.fullReplaceRequiresAck).toBe(true);
    expect(report.defaultMergeMode).toBe('safe_update');
    const frozen = freezeKeysFromSafetyReport(report);
    expect(frozen.has('journey')).toBe(true);
    expect(frozen.has('experiences')).toBe(true);
  });
});
