import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('@/server/imports/repository', () => ({
  getContentImportDetail: vi.fn(),
  getPriorImportSourceTextHash: vi.fn(),
}));

vi.mock('@/server/content/contentWorkflowCore', async () => {
  const actual = await vi.importActual('@/server/content/contentWorkflowCore');
  return {
    ...(actual as Record<string, unknown>),
    getWorkingDraft: vi.fn(),
    getLatestPublishedVersion: vi.fn(),
  };
});

import { SITE_CONTENT_RAW } from '@/content/defaults';
import type { SiteContent } from '@/content/schema';
import { assertSiteContent } from '@/content/validators';
import { getLatestPublishedVersion, getWorkingDraft } from '@/server/content/contentWorkflowCore';
import { buildImportMergeSafetyReport } from '@/server/imports/buildImportMergeSafetyReport';
import { buildImportCandidatePayload } from '@/server/imports/candidatePayload/builder';
import {
  freezeKeysFromSafetyReport,
  type ImportMergeSafetyReport,
} from '@/server/imports/importMergeSectionSafety';
import { buildImportReviewPayload } from '@/server/imports/importReviewCompare';
import { type ImportReviewProvenance } from '@/server/imports/importReviewStructured';
import { getContentImportDetail, getPriorImportSourceTextHash } from '@/server/imports/repository';
import { minimalImportDetails } from '@/tests/fixtures/minimalImportDetails';
import type { DetailsSchemaType } from '@/validators/detailsSchema';

const PROVENANCE: ImportReviewProvenance = {
  importId: 'imp-review',
  originalFileName: 'cv.docx',
  storedPath: '/uploads/cv.docx',
  uploadedFileId: 'uf-review',
};

function safetySection(report: ImportMergeSafetyReport, id: string) {
  const row = report.sections.find((s) => s.id === id);
  expect(row).toBeDefined();
  return row!;
}

function computeMergeSafetyReport(input: {
  details: DetailsSchemaType;
  mergeBaseline: SiteContent;
  candidatePayload: unknown;
  provenance?: ImportReviewProvenance;
}): ImportMergeSafetyReport {
  return buildImportMergeSafetyReport({
    details: input.details,
    mergeBaseline: input.mergeBaseline,
    candidatePayload: input.candidatePayload,
    provenance: input.provenance ?? PROVENANCE,
  }).mergeSafety;
}

function envelopeFromDetails(
  details: DetailsSchemaType,
  rawDocumentText: string,
  importWarnings: { message: string; code?: string }[] = [],
) {
  return buildImportCandidatePayload({
    rawDocumentText,
    parserVersion: 't',
    details,
    sections: [],
    importWarnings,
  });
}

function mockParsedImportRow(
  envelope: ReturnType<typeof buildImportCandidatePayload>,
  overrides: Record<string, unknown> = {},
) {
  vi.mocked(getContentImportDetail).mockResolvedValue({
    id: PROVENANCE.importId,
    status: 'PARSED',
    candidatePayload: envelope,
    warnings: [],
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    uploadedFile: {
      originalName: PROVENANCE.originalFileName,
      storedPath: PROVENANCE.storedPath,
      id: PROVENANCE.uploadedFileId,
    },
    versions: [],
    ...overrides,
  } as never);
}

describe('buildImportReviewPayload', () => {
  beforeEach(() => {
    vi.mocked(getContentImportDetail).mockReset();
    vi.mocked(getPriorImportSourceTextHash).mockReset();
    vi.mocked(getWorkingDraft).mockReset();
    vi.mocked(getLatestPublishedVersion).mockReset();
    vi.mocked(getPriorImportSourceTextHash).mockResolvedValue(null);
    vi.mocked(getWorkingDraft).mockResolvedValue(null);
    vi.mocked(getLatestPublishedVersion).mockResolvedValue(null);
  });

  it('returns mergeSafety with safe profile/contact/summary for a minimal name-only import', async () => {
    const details = minimalImportDetails({
      profile: { ...minimalImportDetails().profile, name: 'Review Payload Name' },
    });
    const envelope = envelopeFromDetails(details, 'cv body');
    mockParsedImportRow(envelope);

    const review = await buildImportReviewPayload(PROVENANCE.importId);

    expect(review.provenance?.importId).toBe(PROVENANCE.importId);
    expect(review.mergeSafety.defaultMergeMode).toBe('safe_update');
    expect(safetySection(review.mergeSafety, 'profile').risk).toBe('safe_to_merge');
    expect(safetySection(review.mergeSafety, 'contact').risk).toBe('safe_to_merge');
    expect(safetySection(review.mergeSafety, 'summary').risk).toBe('safe_to_merge');
    expect(safetySection(review.mergeSafety, 'profile').includeInSafeMerge).toBe(true);
    expect(safetySection(review.mergeSafety, 'contact').includeInSafeMerge).toBe(true);
    expect(safetySection(review.mergeSafety, 'summary').includeInSafeMerge).toBe(true);
    // List sections churn vs canonical even for a scalar-only import — ack still required for full_replace.
    expect(review.mergeSafety.fullReplaceRequiresAck).toBe(true);
  });

  it('marks patents review-only and requires ack when PATENT_COUNT_MISMATCH is present', async () => {
    const raw = 'Patents (52 Registered & Completed)\nbody';
    const patents = Array.from({ length: 5 }, (_, i) => ({
      id: `pt-${i}`,
      title: `Patent ${i}`,
      inventors: null,
      number: null,
      country: null,
      date: null,
      status: 'registered' as const,
      type: 'international' as const,
      link: null,
      raw: null,
    }));
    const details = minimalImportDetails({
      patents,
      counts: { publications: 0, patents: 5, projects: 0, awards: 0, students: 0 },
    });
    const envelope = envelopeFromDetails(details, raw);
    mockParsedImportRow(envelope);

    const review = await buildImportReviewPayload(PROVENANCE.importId);
    const patentsRow = safetySection(review.mergeSafety, 'patents');

    expect(patentsRow.risk).toBe('review_only_default');
    expect(patentsRow.includeInSafeMerge).toBe(false);
    expect(review.mergeSafety.fullReplaceRequiresAck).toBe(true);
    expect(freezeKeysFromSafetyReport(review.mergeSafety).has('patents')).toBe(true);
    expect(safetySection(review.mergeSafety, 'profile').includeInSafeMerge).toBe(true);
  });

  it('holds teaching/supervision/service from safe merge when CV narratives are imported', async () => {
    const details = minimalImportDetails({
      about: {
        ...minimalImportDetails().about,
        cvNarrativeSections: [
          {
            id: 'nar-teach-1',
            kind: 'teaching',
            sectionTitle: 'Teaching',
            body: 'Imported teaching narrative.',
            sourceSectionType: 'services',
          },
          {
            id: 'nar-lead-1',
            kind: 'leadership_supervision',
            sectionTitle: 'Supervision',
            body: 'Imported supervision narrative.',
            sourceSectionType: 'academic_narrative',
          },
          {
            id: 'nar-svc-1',
            kind: 'professional_services',
            sectionTitle: 'Service',
            body: 'Imported service narrative.',
            sourceSectionType: 'services',
          },
        ],
      },
    });
    const envelope = envelopeFromDetails(details, 'cv body');
    mockParsedImportRow(envelope);

    const review = await buildImportReviewPayload(PROVENANCE.importId);

    for (const id of ['teaching', 'supervision', 'service'] as const) {
      const row = safetySection(review.mergeSafety, id);
      expect(row.risk).toBe('review_only_default');
      expect(row.includeInSafeMerge).toBe(false);
    }
    expect(freezeKeysFromSafetyReport(review.mergeSafety).has('cvNarrative')).toBe(true);
    expect(review.mergeSafety.fullReplaceRequiresAck).toBe(true);
  });

  it('excludes publications from safe merge when import replaces the canonical publication list', async () => {
    const details = minimalImportDetails({
      publications: [
        {
          id: 'only-import-pub',
          title: 'Sole Imported Publication',
          authors: 'Author',
          journal: 'Journal',
          year: 2024,
          volume: null,
          issue: null,
          pages: null,
          doi: null,
          link: null,
          type: 'journal',
          impactFactor: null,
          quartile: null,
          raw: null,
        },
      ],
      counts: { publications: 1, patents: 0, projects: 0, awards: 0, students: 0 },
    });
    const envelope = envelopeFromDetails(details, 'cv body');
    mockParsedImportRow(envelope);

    const review = await buildImportReviewPayload(PROVENANCE.importId);
    const pubs = safetySection(review.mergeSafety, 'publications');

    expect(pubs.includeInSafeMerge).toBe(false);
    expect(['needs_review', 'requires_explicit_replace']).toContain(pubs.risk);
    expect(review.mergeSafety.fullReplaceRequiresAck).toBe(true);
    expect(freezeKeysFromSafetyReport(review.mergeSafety).has('publications')).toBe(true);
  });

  it('mergeSafety matches pure safety-report path for the same candidate and canonical baseline', async () => {
    const raw = 'Patents (52 Registered & Completed)\nbody';
    const patents = Array.from({ length: 5 }, (_, i) => ({
      id: `pt-${i}`,
      title: `Patent ${i}`,
      inventors: null,
      number: null,
      country: null,
      date: null,
      status: 'registered' as const,
      type: 'international' as const,
      link: null,
      raw: null,
    }));
    const details = minimalImportDetails({ patents, counts: { publications: 0, patents: 5, projects: 0, awards: 0, students: 0 } });
    const envelope = envelopeFromDetails(details, raw);
    mockParsedImportRow(envelope);

    const review = await buildImportReviewPayload(PROVENANCE.importId);
    const expected = computeMergeSafetyReport({
      details,
      mergeBaseline: assertSiteContent(SITE_CONTENT_RAW),
      candidatePayload: envelope,
    });

    expect(review.mergeSafety.defaultMergeMode).toBe(expected.defaultMergeMode);
    expect(review.mergeSafety.fullReplaceRequiresAck).toBe(expected.fullReplaceRequiresAck);
    expect(review.mergeSafety.notes).toEqual(expected.notes);
    for (const id of ['profile', 'patents', 'publications', 'teaching'] as const) {
      const a = safetySection(review.mergeSafety, id);
      const b = safetySection(expected, id);
      expect(a.risk).toBe(b.risk);
      expect(a.includeInSafeMerge).toBe(b.includeInSafeMerge);
    }
  });

  it('uses working draft for mergeSafety while visible diff can use canonical baseline', async () => {
    const canonical = assertSiteContent(SITE_CONTENT_RAW);
    const working = structuredClone(canonical);
    working.about.awards = [];

    vi.mocked(getWorkingDraft).mockResolvedValue({
      id: 'cv-working',
      payload: working,
    } as never);

    const details = minimalImportDetails({
      about: {
        ...minimalImportDetails().about,
        awards: [
          {
            id: 'aw-import-1',
            title: 'Imported Award',
            organization: 'Org',
            year: '2025',
            category: 'research',
            details: 'From CV',
            raw: null,
          },
        ],
      },
      counts: { publications: 0, patents: 0, projects: 0, awards: 1, students: 0 },
    });
    const envelope = envelopeFromDetails(details, 'cv body');
    mockParsedImportRow(envelope);

    const review = await buildImportReviewPayload(PROVENANCE.importId, { baseline: 'canonical' });

    expect(review.baselineSource).toBe('canonical');
    const awardsBlock = review.blocks.find((b) => b.id === 'awards');
    expect(awardsBlock?.removed.length).toBeGreaterThan(0);

    const awardsSafety = safetySection(review.mergeSafety, 'awards');
    expect(awardsSafety.includeInSafeMerge).toBe(true);
    expect(awardsSafety.risk).toBe('safe_to_merge');

    const expectedFromWorking = computeMergeSafetyReport({
      details,
      mergeBaseline: working,
      candidatePayload: envelope,
    });
    expect(awardsSafety.includeInSafeMerge).toBe(safetySection(expectedFromWorking, 'awards').includeInSafeMerge);
  });

  it('returns blocked mergeSafety when candidate payload is invalid', async () => {
    vi.mocked(getContentImportDetail).mockResolvedValue({
      id: PROVENANCE.importId,
      status: 'PARSED',
      candidatePayload: { not: 'details' },
      warnings: [],
      createdAt: new Date(),
      uploadedFile: {
        originalName: PROVENANCE.originalFileName,
        storedPath: PROVENANCE.storedPath,
        id: PROVENANCE.uploadedFileId,
      },
      versions: [],
    } as never);

    const review = await buildImportReviewPayload(PROVENANCE.importId);

    expect(review.mergeSafety.sections).toEqual([]);
    expect(review.mergeSafety.fullReplaceRequiresAck).toBe(true);
    expect(review.mergeSafety.notes.some((n) => n.includes('not valid Details JSON'))).toBe(true);
    expect(review.blocks[0]?.id).toBe('candidate');
  });
});
