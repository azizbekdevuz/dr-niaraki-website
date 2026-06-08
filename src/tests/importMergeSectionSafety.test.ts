import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

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
});
