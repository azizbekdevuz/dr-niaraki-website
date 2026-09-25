import { describe, expect, it } from 'vitest';

import { SITE_CONTENT_RAW } from '@/content/defaults';
import type { SiteContent } from '@/content/schema';
import { assertSiteContent } from '@/content/validators';
import type { ImportCandidatePayload } from '@/server/imports/candidatePayload/types';
import {
  generateCvChangeSet,
  type GenerateCvChangeSetInput,
} from '@/server/imports/cvUpdate/changeSetGenerate';
import { buildAcceptedCvNormalizedSnapshot } from '@/server/imports/cvUpdate/normalizeBaseline';
import { fingerprintText } from '@/server/imports/cvUpdate/truncationDetect';
import { minimalImportDetails } from '@/tests/fixtures/minimalImportDetails';
import type { DetailsSchemaType } from '@/validators/detailsSchema';

const WEBSITE_REF = { sourceType: 'canonical' as const, label: 'fixture' };

function websiteFixture(patch?: (site: SiteContent) => void): SiteContent {
  const site = structuredClone(assertSiteContent(SITE_CONTENT_RAW));
  patch?.(site);
  return site;
}

function pub(id: string, title: string, extras: Partial<DetailsSchemaType['publications'][number]> = {}) {
  return {
    id,
    title,
    authors: 'A. Author',
    journal: 'Journal',
    year: 2020,
    volume: null,
    issue: null,
    pages: null,
    doi: null,
    link: null,
    type: 'journal' as const,
    impactFactor: null,
    quartile: null,
    raw: null,
    ...extras,
  };
}

function project(
  id: string,
  title: string,
  description: string,
  extras: Partial<DetailsSchemaType['research']['projects'][number]> = {},
) {
  return {
    id,
    title,
    description,
    period: '2020–2021',
    funding: null,
    fundingAmount: null,
    role: 'PI',
    status: 'ongoing' as const,
    raw: null,
    ...extras,
  };
}

function patent(
  id: string,
  title: string,
  extras: Partial<DetailsSchemaType['patents'][number]> = {},
) {
  return {
    id,
    title,
    inventors: 'Inventor',
    number: 'KR-1',
    country: 'KR',
    date: '2024-01-01',
    status: 'registered' as const,
    type: 'korean' as const,
    link: null,
    raw: null,
    ...extras,
  };
}

function award(
  id: string,
  title: string,
  extras: Partial<DetailsSchemaType['about']['awards'][number]> = {},
) {
  return {
    id,
    title,
    organization: 'Org',
    year: '2020',
    category: 'research' as const,
    details: null,
    raw: null,
    ...extras,
  };
}

function emptyAbout(awards: DetailsSchemaType['about']['awards'] = []): DetailsSchemaType['about'] {
  return {
    brief: null,
    full: null,
    education: [],
    positions: [],
    awards: [...awards],
    languages: [],
    cvNarrativeSections: [],
  };
}

function emptyResearch(
  projects: DetailsSchemaType['research']['projects'] = [],
): DetailsSchemaType['research'] {
  return { interests: [], projects: [...projects], grants: [] };
}

function minimalEnvelope(
  details: DetailsSchemaType,
  overrides: Partial<ImportCandidatePayload> = {},
): ImportCandidatePayload {
  return {
    schemaVersion: 2,
    envelopeVersion: 1,
    sourceTextHash: 'aa'.repeat(32),
    parserVersion: 't',
    mappingVersion: 'm',
    rawDocumentText: 'fixture cv text',
    details,
    rawSections: [],
    unmappedSections: [],
    sectionMappingReport: [],
    countValidation: { entries: [] },
    parserWarnings: [],
    reviewHint: 'READY',
    ...overrides,
  };
}

function runGenerate(
  partial: Omit<
    GenerateCvChangeSetInput,
    'importId' | 'websiteRef' | 'sectionMappings' | 'baselineRef' | 'fieldLocks' | 'candidateEnvelope'
  > &
    Partial<
      Pick<
        GenerateCvChangeSetInput,
        'importId' | 'websiteRef' | 'sectionMappings' | 'baselineRef' | 'fieldLocks' | 'candidateEnvelope'
      >
    >,
) {
  return generateCvChangeSet({
    importId: 'imp-cv-changeset',
    websiteRef: WEBSITE_REF,
    sectionMappings: [],
    baselineRef: null,
    fieldLocks: [],
    candidateEnvelope: null,
    ...partial,
  });
}

describe('generateCvChangeSet', () => {
  it('emits only small incremental list updates (added pub, modified project, added patent)', () => {
    const website = websiteFixture();
    const baselineDetails = minimalImportDetails({
      publications: [pub('A', 'Paper A'), pub('B', 'Paper B')],
      research: emptyResearch([project('P1', 'Project One', 'Original description')]),
      patents: [],
      counts: { publications: 2, patents: 0, projects: 1, awards: 0, students: 0 },
    });
    const candidateDetails = minimalImportDetails({
      publications: [pub('A', 'Paper A'), pub('B', 'Paper B'), pub('C', 'Paper C')],
      research: emptyResearch([project('P1', 'Project One', 'Updated description')]),
      patents: [patent('X', 'Patent X')],
      counts: { publications: 3, patents: 1, projects: 1, awards: 0, students: 0 },
    });

    const changeSet = runGenerate({
      candidateDetails,
      previousBaseline: buildAcceptedCvNormalizedSnapshot({ details: baselineDetails }),
      website,
      fieldLocks: [],
    });

    expect(changeSet.items).toHaveLength(3);
    expect(changeSet.items.map((i) => i.kind).sort()).toEqual(['added', 'added', 'modified']);
    expect(changeSet.items.some((i) => i.sectionKey === 'publications' && i.kind === 'added')).toBe(true);
    expect(changeSet.items.some((i) => i.sectionKey === 'projects' && i.kind === 'modified')).toBe(true);
    expect(changeSet.items.some((i) => i.sectionKey === 'patents' && i.kind === 'added')).toBe(true);

    const pubsSummary = changeSet.sectionSummaries.find((s) => s.sectionKey === 'publications');
    expect(pubsSummary?.unchanged).toBe(2);
    expect(pubsSummary?.changes).toBe(1);
    expect(changeSet.summary.totalChanges).toBe(3);
  });

  it('flags curated display-name downgrade for review (not safelyPrepared)', () => {
    const website = websiteFixture();
    expect(website.profile.displayName).toBe('Dr. Eng. Abolghasem Sadeghi-Niaraki');

    const previousDetails = minimalImportDetails({
      profile: {
        name: website.profile.displayName,
        title: 'Prof',
        photoUrl: null,
        summary: null,
        meta: null,
      },
    });
    const candidateDetails = minimalImportDetails({
      profile: {
        name: 'Dr. Abolghasem Sadeghi',
        title: 'Prof',
        photoUrl: null,
        summary: null,
        meta: null,
      },
    });

    const changeSet = runGenerate({
      candidateDetails,
      previousBaseline: buildAcceptedCvNormalizedSnapshot({ details: previousDetails }),
      website,
      fieldLocks: [],
    });

    const nameItem = changeSet.items.find((i) => i.fieldPath === 'profile.displayName');
    expect(nameItem).toBeDefined();
    expect(nameItem?.safelyPrepared).toBe(false);
    expect(
      nameItem?.kind === 'truncated_candidate' || nameItem?.requiresReview === true,
    ).toBe(true);
  });

  it('flags truncated introduction as truncated_candidate requiring review', () => {
    const longIntro =
      'A distinguished researcher and educator dedicated to advancing the frontiers of Extended Reality and Artificial Intelligence in academic and industrial settings across geospatial systems.';
    const website = websiteFixture((site) => {
      site.profile.homeAboutIntro = longIntro;
    });

    const previousDetails = minimalImportDetails({
      profile: {
        name: 'Dr X',
        title: 'Prof',
        photoUrl: null,
        summary: longIntro,
        meta: null,
      },
    });
    const candidateDetails = minimalImportDetails({
      profile: {
        name: 'Dr X',
        title: 'Prof',
        photoUrl: null,
        summary: 'Research interests include spatia',
        meta: null,
      },
    });

    const changeSet = runGenerate({
      candidateDetails,
      previousBaseline: buildAcceptedCvNormalizedSnapshot({ details: previousDetails }),
      website,
      fieldLocks: [],
    });

    const introItem = changeSet.items.find((i) => i.fieldPath === 'profile.homeAboutIntro');
    expect(introItem?.kind).toBe('truncated_candidate');
    expect(introItem?.requiresReview).toBe(true);
    expect(introItem?.safelyPrepared).toBe(false);
  });

  it('detects conflict_manual when previous CV, candidate, and website summary all differ', () => {
    const website = websiteFixture((site) => {
      site.profile.homeAboutIntro = 'Manual edit';
      site.about.page.professionalSummaryParagraphs = ['Manual edit'];
    });

    const previousDetails = minimalImportDetails({
      profile: {
        name: 'Dr X',
        title: 'Prof',
        photoUrl: null,
        summary: 'Old CV',
        meta: null,
      },
    });
    const candidateDetails = minimalImportDetails({
      profile: {
        name: 'Dr X',
        title: 'Prof',
        photoUrl: null,
        summary: 'New CV text',
        meta: null,
      },
    });

    const changeSet = runGenerate({
      candidateDetails,
      previousBaseline: buildAcceptedCvNormalizedSnapshot({ details: previousDetails }),
      website,
      fieldLocks: [],
    });

    const introItem = changeSet.items.find((i) => i.fieldPath === 'profile.homeAboutIntro');
    expect(introItem?.kind).toBe('conflict_manual');
    expect(introItem?.requiresReview).toBe(true);
    expect(introItem?.previousCvValue).toBe('Old CV');
    expect(introItem?.candidateValue).toBe('New CV text');
    expect(introItem?.websiteValue).toBe('Manual edit');
  });

  it('marks removed awards as removed + requiresReview', () => {
    const website = websiteFixture();
    const previousDetails = minimalImportDetails({
      about: emptyAbout([award('W', 'Award W')]),
      counts: { publications: 0, patents: 0, projects: 0, awards: 1, students: 0 },
    });
    const candidateDetails = minimalImportDetails({
      about: emptyAbout([]),
      counts: { publications: 0, patents: 0, projects: 0, awards: 0, students: 0 },
    });

    const changeSet = runGenerate({
      candidateDetails,
      previousBaseline: buildAcceptedCvNormalizedSnapshot({ details: previousDetails }),
      website,
      fieldLocks: [],
    });

    const removed = changeSet.items.find(
      (i) => i.sectionKey === 'awards' && i.kind === 'removed' && i.itemKey === 'W',
    );
    expect(removed).toBeDefined();
    expect(removed?.requiresReview).toBe(true);
    expect(removed?.safelyPrepared).toBe(false);
  });

  it('proposes new_section for unmapped Invited Talks', () => {
    const website = websiteFixture();
    const candidateDetails = minimalImportDetails();
    const envelope = minimalEnvelope(candidateDetails, {
      rawSections: [
        {
          id: 'sec-invited',
          parentId: null,
          title: 'Invited Talks',
          normalizedTitle: 'invited talks',
          level: 1,
          startIndex: 0,
          endIndex: 40,
          rawText: 'Keynote at Foo Conference 2024.',
          sectionType: 'unknown',
          source: 'typescript',
          warnings: [],
        },
      ],
      unmappedSections: [
        { sectionId: 'sec-invited', title: 'Invited Talks', reason: 'unmapped' },
      ],
      reviewHint: 'NEEDS_REVIEW',
    });

    const changeSet = runGenerate({
      candidateDetails,
      candidateEnvelope: envelope,
      previousBaseline: buildAcceptedCvNormalizedSnapshot({ details: candidateDetails }),
      website,
      fieldLocks: [],
    });

    expect(changeSet.items.some((i) => i.kind === 'new_section')).toBe(true);
    expect(changeSet.unknownSections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sectionId: 'sec-invited',
          sourceTitle: 'Invited Talks',
        }),
      ]),
    );
  });

  it('does not emit modified cards for identical awards/patents with different ids/metadata', () => {
    const website = websiteFixture();
    const baselineDetails = minimalImportDetails({
      about: emptyAbout([
        award('A1', 'Best Paper Award', { organization: null, year: '2021' }),
      ]),
      patents: [
        patent('P1', 'Spatial Computing Apparatus', {
          country: 'KR',
          status: 'registered',
          number: '10-2021-0001',
        }),
      ],
      counts: { publications: 0, patents: 1, projects: 0, awards: 1, students: 0 },
    });
    // Candidate: different ids, null vs missing organization, Korea vs KR,
    // Registration completed vs registered (not bare "completed").
    const candidateAward = {
      id: 'B1',
      title: 'Best Paper Award',
      year: '2021',
      category: 'research' as const,
      details: null,
      raw: null,
      // organization intentionally absent (not null)
    };
    const candidateDetails = minimalImportDetails({
      about: emptyAbout([candidateAward as DetailsSchemaType['about']['awards'][number]]),
      patents: [
        patent('Q1', 'Spatial Computing Apparatus', {
          country: 'Korea',
          status: 'Registration completed' as 'registered',
          number: '10-2021-0001',
        }),
      ],
      counts: { publications: 0, patents: 1, projects: 0, awards: 1, students: 0 },
    });

    const changeSet = runGenerate({
      candidateDetails,
      previousBaseline: buildAcceptedCvNormalizedSnapshot({ details: baselineDetails }),
      website,
      fieldLocks: [],
    });

    expect(changeSet.items.filter((i) => i.sectionKey === 'awards')).toHaveLength(0);
    expect(changeSet.items.filter((i) => i.sectionKey === 'patents')).toHaveLength(0);
    expect(
      changeSet.items.some(
        (i) =>
          i.kind === 'modified' &&
          i.previousCvValue !== null &&
          i.candidateValue !== null &&
          JSON.stringify(i.previousCvValue) === JSON.stringify(i.candidateValue),
      ),
    ).toBe(false);

    const awardsSummary = changeSet.sectionSummaries.find((s) => s.sectionKey === 'awards');
    const patentsSummary = changeSet.sectionSummaries.find((s) => s.sectionKey === 'patents');
    expect(awardsSummary?.unchanged).toBe(1);
    expect(awardsSummary?.changes).toBe(0);
    expect(patentsSummary?.unchanged).toBe(1);
    expect(patentsSummary?.changes).toBe(0);
  });

  it('does not cross-match same-title patents with different numbers after ID churn', () => {
    const website = websiteFixture();
    const kr = patent('P-kr', 'Shared Invention Title', {
      number: '10-2025-0090232',
      country: 'KR',
      type: 'korean',
      status: 'pending',
    });
    const us = patent('P-us', '"Shared Invention Title"', {
      number: '19/326,984',
      country: 'US',
      type: 'international',
      status: 'registered',
    });
    const baselineDetails = minimalImportDetails({
      patents: [kr, us],
      counts: { publications: 0, patents: 2, projects: 0, awards: 0, students: 0 },
    });
    const candidateDetails = minimalImportDetails({
      patents: [
        { ...us, id: 'noise-us' },
        { ...kr, id: 'noise-kr', country: 'Korea' },
      ],
      counts: { publications: 0, patents: 2, projects: 0, awards: 0, students: 0 },
    });

    const changeSet = runGenerate({
      candidateDetails,
      previousBaseline: buildAcceptedCvNormalizedSnapshot({ details: baselineDetails }),
      website,
      fieldLocks: [],
    });

    expect(changeSet.items.filter((i) => i.sectionKey === 'patents')).toHaveLength(0);
  });

  it('emits exactly four visible items for a small realistic CV update', () => {
    const website = websiteFixture();
    const baselineAwards = [
      award('A1', 'IEEE Outstanding Young Researcher Award'),
      award('A2', 'Best Paper Award GeoAI Symposium'),
      award('A3', 'Sejong University Excellence in Teaching'),
      award('A4', 'Korean Society of Remote Sensing Award'),
      award('A5', 'ACM SIGSPATIAL Student Travel Grant'),
    ];
    const baselinePatents = [
      patent('P1', 'Method for Immersive Geospatial Visualization', { status: 'registered' }),
      patent('P2', 'XR Navigation System for Smart Cities', { status: 'pending' }),
      patent('P3', 'AI-based Land Cover Classification Device', { status: 'registered' }),
      patent('P4', 'Digital Twin Synchronization Apparatus', { status: 'registered' }),
      patent('P5', 'Multi-sensor Fusion Positioning Method', { status: 'registered' }),
    ];
    const baselinePubs = [
      pub('U1', 'Geo-AI for Urban Digital Twins'),
      pub('U2', 'Immersive XR Interfaces for Spatial Decision Support'),
      pub('U3', 'Semantic Segmentation of Satellite Imagery'),
      pub('U4', 'Human-Centered Design of Geospatial Dashboards'),
      pub('U5', 'Federated Learning for Privacy-Preserving GIS'),
    ];

    const baselineDetails = minimalImportDetails({
      about: emptyAbout(baselineAwards),
      patents: baselinePatents,
      publications: baselinePubs,
      counts: { publications: 5, patents: 5, projects: 0, awards: 5, students: 0 },
    });
    const candidateDetails = minimalImportDetails({
      about: emptyAbout([
        ...baselineAwards,
        award('A6', 'International Conference on GeoAI Best Demo Award'),
      ]),
      patents: baselinePatents.map((p) =>
        p.id === 'P2' ? patent('P2', p.title, { status: 'registered' }) : p,
      ),
      publications: [
        ...baselinePubs.filter((p) => p.id !== 'U5'),
        pub('U6', 'Cross-Modal Retrieval for Geospatial Knowledge Graphs'),
      ],
      counts: { publications: 5, patents: 5, projects: 0, awards: 6, students: 0 },
    });

    const changeSet = runGenerate({
      candidateDetails,
      previousBaseline: buildAcceptedCvNormalizedSnapshot({ details: baselineDetails }),
      website,
      fieldLocks: [],
    });

    expect(changeSet.items).toHaveLength(4);
    expect(changeSet.algorithmVersion).toBeGreaterThanOrEqual(1);

    const byTitleKind = changeSet.items.map((i) => {
      let title = i.label;
      if (i.candidateValue && typeof i.candidateValue === 'object' && 'title' in i.candidateValue) {
        title = String((i.candidateValue as { title: string }).title);
      } else if (
        i.previousCvValue &&
        typeof i.previousCvValue === 'object' &&
        'title' in i.previousCvValue
      ) {
        title = String((i.previousCvValue as { title: string }).title);
      }
      return { kind: i.kind, title };
    });

    expect(byTitleKind).toEqual(
      expect.arrayContaining([
        {
          kind: 'added',
          title: 'International Conference on GeoAI Best Demo Award',
        },
        {
          kind: 'modified',
          title: 'XR Navigation System for Smart Cities',
        },
        {
          kind: 'added',
          title: 'Cross-Modal Retrieval for Geospatial Knowledge Graphs',
        },
        {
          kind: 'removed',
          title: 'Federated Learning for Privacy-Preserving GIS',
        },
      ]),
    );

    const awardsSummary = changeSet.sectionSummaries.find((s) => s.sectionKey === 'awards');
    const patentsSummary = changeSet.sectionSummaries.find((s) => s.sectionKey === 'patents');
    const pubsSummary = changeSet.sectionSummaries.find((s) => s.sectionKey === 'publications');
    expect(awardsSummary?.unchanged).toBe(5);
    expect(patentsSummary?.unchanged).toBe(4);
    expect(pubsSummary?.unchanged).toBe(4);
    expect(changeSet.summary.unchangedItemCount).toBeGreaterThanOrEqual(13);
  });

  it('does not propose new_section for Preamble unmapped sections', () => {
    const website = websiteFixture();
    const candidateDetails = minimalImportDetails();
    const envelope = minimalEnvelope(candidateDetails, {
      rawSections: [
        {
          id: 'sec-preamble',
          parentId: null,
          title: 'Preamble',
          normalizedTitle: 'preamble',
          level: 1,
          startIndex: 0,
          endIndex: 20,
          rawText: 'Curriculum Vitae header block.',
          sectionType: 'unknown',
          source: 'typescript',
          warnings: [],
        },
      ],
      unmappedSections: [{ sectionId: 'sec-preamble', title: 'Preamble', reason: 'unmapped' }],
      reviewHint: 'NEEDS_REVIEW',
    });

    const changeSet = runGenerate({
      candidateDetails,
      candidateEnvelope: envelope,
      previousBaseline: buildAcceptedCvNormalizedSnapshot({ details: candidateDetails }),
      website,
      fieldLocks: [],
    });

    expect(changeSet.items.some((i) => i.kind === 'new_section')).toBe(false);
    expect(changeSet.unknownSections).toHaveLength(0);
  });

  it('reports noWebsiteRelevantChanges when baseline and candidate are identical', () => {
    const website = websiteFixture();
    const details = minimalImportDetails({
      profile: {
        name: website.profile.displayName,
        title: website.profile.roleLine,
        photoUrl: null,
        summary: website.profile.homeAboutIntro,
        meta: null,
      },
      publications: [pub('A', 'Paper A')],
      research: emptyResearch([project('P1', 'Project One', 'Desc')]),
      counts: { publications: 1, patents: 0, projects: 1, awards: 0, students: 0 },
    });
    const snapshot = buildAcceptedCvNormalizedSnapshot({ details });

    const changeSet = runGenerate({
      candidateDetails: details,
      previousBaseline: snapshot,
      website,
      fieldLocks: [],
    });

    expect(changeSet.items).toHaveLength(0);
    expect(changeSet.summary.noWebsiteRelevantChanges).toBe(true);
    expect(changeSet.summary.totalChanges).toBe(0);
    expect(changeSet.algorithmVersion).toBeGreaterThanOrEqual(1);
  });

  it('suppresses locked displayName downgrade so it does not appear as requiresReview', () => {
    const website = websiteFixture();
    const downgraded = 'Dr. Abolghasem Sadeghi';
    const previousDetails = minimalImportDetails({
      profile: {
        name: website.profile.displayName,
        title: 'Prof',
        photoUrl: null,
        summary: null,
        meta: null,
      },
    });
    const candidateDetails = minimalImportDetails({
      profile: {
        name: downgraded,
        title: 'Prof',
        photoUrl: null,
        summary: null,
        meta: null,
      },
    });

    const withoutLock = runGenerate({
      candidateDetails,
      previousBaseline: buildAcceptedCvNormalizedSnapshot({ details: previousDetails }),
      website,
      fieldLocks: [],
    });
    expect(withoutLock.items.some((i) => i.fieldPath === 'profile.displayName' && i.requiresReview)).toBe(
      true,
    );

    const withLock = runGenerate({
      candidateDetails,
      previousBaseline: buildAcceptedCvNormalizedSnapshot({ details: previousDetails }),
      website,
      fieldLocks: [
        {
          fieldPath: 'profile.displayName',
          lockedWebsiteFingerprint: fingerprintText(website.profile.displayName),
          rejectedSourceFingerprint: fingerprintText(downgraded),
        },
      ],
    });

    expect(withLock.items.some((i) => i.fieldPath === 'profile.displayName')).toBe(false);
    expect(withLock.items.some((i) => i.fieldPath === 'profile.displayName' && i.requiresReview)).toBe(
      false,
    );
  });
});
