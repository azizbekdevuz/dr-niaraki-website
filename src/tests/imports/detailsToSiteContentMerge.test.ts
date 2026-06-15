import { describe, expect, it } from 'vitest';

import { SITE_CONTENT_RAW } from '@/content/defaults';
import { assertSiteContent, validateSiteContent } from '@/content/validators';
import { mergeCvDetailsIntoSiteContent } from '@/server/imports/detailsToSiteContentMerge';
import type { DetailsSchemaType } from '@/validators/detailsSchema';

/** Minimal Details fixture that satisfies `DetailsSchema` for merge tests. */
function sampleDetails(): DetailsSchemaType {
  return {
    profile: {
      name: 'Imported Name',
      title: 'Imported Title',
      photoUrl: null,
      summary: 'First summary paragraph.\n\nSecond paragraph.',
      meta: null,
    },
    about: {
      brief: 'Brief line for tagline.',
      full: 'Full narrative paragraph one.\n\nParagraph two.',
      education: [
        {
          id: 'ed1',
          degree: 'Ph.D. in Example',
          institution: 'Example University',
          location: null,
          year: '2000',
          period: '2000–2004',
          thesis: null,
          supervisor: null,
          details: 'Dissertation work.',
          raw: null,
        },
      ],
      positions: [
        {
          id: 'pos1',
          title: 'Professor',
          institution: 'Example U',
          location: null,
          period: '2010 – Present',
          type: 'academic',
          details: 'Teaching and research.',
          achievements: ['A1', 'A2'],
          raw: null,
        },
      ],
      awards: [
        {
          id: 'aw1',
          title: 'Best Paper',
          organization: 'Org',
          year: '2020',
          category: 'research',
          details: 'Details',
          raw: null,
        },
      ],
      languages: [],
      cvNarrativeSections: [],
    },
    research: {
      interests: [],
      projects: [],
      grants: [],
    },
    publications: [
      {
        id: 'pub1',
        title: 'Paper One',
        authors: 'A, B',
        journal: 'J',
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
    patents: [
      {
        id: 'pat1',
        title: 'Patent One',
        inventors: 'A',
        number: 'KR1',
        country: 'KR',
        date: '2020',
        status: 'registered',
        type: 'korean',
        raw: null,
      },
    ],
    contact: {
      email: 'imported@example.com',
      personalEmail: 'personal@example.com',
      phone: null,
      fax: null,
      cellPhone: null,
      address: null,
      department: null,
      university: null,
      website: 'example.com',
      cvUrl: null,
      social: {},
    },
    rawHtml: null,
    counts: {
      publications: 1,
      patents: 1,
      projects: 0,
      awards: 1,
      students: 0,
    },
    meta: {
      sourceFileName: 'x.docx',
      parsedAt: '2026-01-01T00:00:00.000Z',
      parserVersion: 't',
      commitSha: null,
      uploader: null,
      warnings: [],
    },
  };
}

describe('mergeCvDetailsIntoSiteContent', () => {
  it('produces valid SiteContent when layered on canonical baseline', () => {
    const base = assertSiteContent(SITE_CONTENT_RAW);
    const merged = mergeCvDetailsIntoSiteContent(sampleDetails(), base);
    const v = validateSiteContent(merged);
    expect(v.success).toBe(true);
    if (v.success) {
      expect(v.data.profile.displayName).toBe('Imported Name');
      expect(v.data.contact.info.email).toBe('imported@example.com');
      expect(v.data.about.journey).toHaveLength(1);
      expect(v.data.about.journey[0]?.title).toBe('Ph.D. in Example');
      expect(v.data.publications.items).toHaveLength(1);
      expect(v.data.publications.stats.total).toBe(1);
    }
  });

  it('preserves baseline experience projects when import position shares the same id', () => {
    const base = assertSiteContent(SITE_CONTENT_RAW);
    const details = sampleDetails();
    details.about.positions = [
      {
        id: 'assoc-prof-sejong',
        title: 'Updated title only',
        institution: base.about.experiences[0]!.institution,
        location: null,
        period: base.about.experiences[0]!.duration,
        type: 'academic',
        details: 'Updated details.',
        achievements: [],
        raw: null,
      },
    ];
    const merged = mergeCvDetailsIntoSiteContent(details, base);
    const row = merged.about.experiences.find((e) => e.id === 'assoc-prof-sejong');
    expect(row?.projects).toEqual(base.about.experiences[0]!.projects);
  });

  it('maps award impact from raw text when details are empty', () => {
    const base = assertSiteContent(SITE_CONTENT_RAW);
    const details = sampleDetails();
    details.about.awards = [
      {
        id: 'aw1',
        title: 'Prize',
        organization: 'Org',
        year: '2021',
        category: 'research',
        details: null,
        raw: 'Citation text for this honor.',
      },
    ];
    const merged = mergeCvDetailsIntoSiteContent(details, base);
    expect(merged.about.awards[0]?.impact).toContain('Citation text');
  });

  it('maps chapter publications to book type and clamps impossible years', () => {
    const base = assertSiteContent(SITE_CONTENT_RAW);
    const details = sampleDetails();
    const ceiling = new Date().getFullYear() + 1;
    details.publications = [
      {
        id: 'ch1',
        title: 'Book Chapter',
        authors: 'A',
        journal: 'Some Series',
        year: 2100,
        volume: null,
        issue: null,
        pages: null,
        doi: null,
        link: null,
        type: 'chapter',
        impactFactor: null,
        quartile: null,
        raw: null,
      },
    ];
    const merged = mergeCvDetailsIntoSiteContent(details, base);
    const item = merged.publications.items.find((p) => p.id === 'ch1');
    expect(item?.type).toBe('book');
    expect(item?.year).toBeLessThanOrEqual(ceiling);
    expect(item?.year).toBeGreaterThanOrEqual(1900);
  });

  it('merges research interests by index and keeps baseline chrome fields', () => {
    const base = assertSiteContent(SITE_CONTENT_RAW);
    const details = sampleDetails();
    details.research.interests = [
      {
        id: 'cand-1',
        name: 'Imported first interest title',
        description: 'New description for slot 0.',
        keywords: ['Alpha', 'Beta'],
      },
    ];
    const merged = mergeCvDetailsIntoSiteContent(details, base);
    expect(merged.research.interests[0]?.name).toBe('Imported first interest title');
    expect(merged.research.interests[0]?.description).toContain('New description');
    expect(merged.research.interests[0]?.keywords).toEqual(['Alpha', 'Beta']);
    expect(merged.research.interests[0]?.iconName).toBe(base.research.interests[0]?.iconName);
    expect(merged.research.interests[1]?.name).toBe(base.research.interests[1]?.name);
  });

  it('keeps US patent 11,816,804B2 registered after merge when parser emits registered', () => {
    const base = assertSiteContent(SITE_CONTENT_RAW);
    const details = sampleDetails();
    details.patents = [
      {
        id: 'us-international-patent-us11-8-3c7806e6',
        title: 'Method and system of recommending accommodation for tourists',
        inventors: 'Abolghasem Sadeghi-Niaraki, Soo-Mi Choi, Somaieh Rokhsaritalemi',
        number: '11,816,804B2',
        country: 'US',
        date: 'Nov 14, 2023',
        status: 'registered',
        type: 'international',
        raw: 'Status: Registration completed',
      },
    ];
    const merged = mergeCvDetailsIntoSiteContent(details, base);
    const p = merged.patents.items.find((x) => x.number === '11,816,804B2');
    expect(p?.status).toBe('registered');
  });

  it('maps legacy completed patent status using raw registration proof', () => {
    const base = assertSiteContent(SITE_CONTENT_RAW);
    const details = sampleDetails();
    details.patents[0]!.status = 'completed';
    details.patents[0]!.raw = 'Status: Registration completed';
    const merged = mergeCvDetailsIntoSiteContent(details, base);
    expect(merged.patents.items[0]?.status).toBe('registered');
  });

  it('maps legacy completed without raw proof as unknown for review', () => {
    const base = assertSiteContent(SITE_CONTENT_RAW);
    const details = sampleDetails();
    details.patents[0]!.status = 'completed';
    details.patents[0]!.raw = 'Status: Application completed';
    const merged = mergeCvDetailsIntoSiteContent(details, base);
    expect(merged.patents.items[0]?.status).toBe('unknown');
  });

  it('maps null patent status to unknown not pending', () => {
    const base = assertSiteContent(SITE_CONTENT_RAW);
    const details = sampleDetails();
    details.patents[0]!.status = null;
    const merged = mergeCvDetailsIntoSiteContent(details, base);
    expect(merged.patents.items[0]?.status).toBe('unknown');
  });

  it('maps publication other type to other not journal', () => {
    const base = assertSiteContent(SITE_CONTENT_RAW);
    const details = sampleDetails();
    details.publications = [
      {
        id: 'book1',
        title: 'Ontology-based GIS Modeling',
        authors: 'A. Author',
        journal: 'VDM Publisher',
        year: 2009,
        volume: null,
        issue: null,
        pages: null,
        doi: null,
        link: null,
        type: 'other',
        impactFactor: null,
        quartile: null,
        raw: 'VDM - The Publisher',
      },
    ];
    const merged = mergeCvDetailsIntoSiteContent(details, base);
    expect(merged.publications.items[0]?.type).toBe('other');
    expect(merged.publications.stats.others).toBe(1);
    expect(merged.publications.stats.journals).toBe(0);
  });

  it('maps parser book type to book and keeps other separate', () => {
    const base = assertSiteContent(SITE_CONTENT_RAW);
    const details = sampleDetails();
    details.publications = [
      {
        id: 'book2',
        title: 'Monograph',
        authors: 'A',
        journal: 'VDM',
        year: 2009,
        volume: null,
        issue: null,
        pages: null,
        doi: null,
        link: null,
        type: 'book',
        impactFactor: null,
        quartile: null,
        raw: null,
      },
    ];
    const merged = mergeCvDetailsIntoSiteContent(details, base);
    expect(merged.publications.items[0]?.type).toBe('book');
    expect(merged.publications.stats.books).toBe(1);
  });
});
