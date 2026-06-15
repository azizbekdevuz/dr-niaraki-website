import { describe, expect, it } from 'vitest';

import { SITE_CONTENT_RAW } from '@/content/defaults';
import { assertSiteContent, validateSiteContent } from '@/content/validators';
import { publicationType } from '@/server/imports/detailsMergeNormalize';
import { mergeCvDetailsIntoSiteContent } from '@/server/imports/detailsToSiteContentMerge';
import type { DetailsSchemaType } from '@/validators/detailsSchema';

describe('legacy published SiteContent compatibility', () => {
  it('validates v15-style payload without stats.others', () => {
    const legacy = structuredClone(assertSiteContent(SITE_CONTENT_RAW));
    const stats = { ...legacy.publications.stats } as Record<string, number>;
    delete stats.others;
    legacy.publications.stats = stats as typeof legacy.publications.stats;

    const result = validateSiteContent(legacy);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.publications.stats.others).toBe(0);
    }
  });

  it('validates v15-style patent stats without unknown/expired', () => {
    const legacy = structuredClone(assertSiteContent(SITE_CONTENT_RAW));
    const stats = { ...legacy.patents.stats } as Record<string, number>;
    delete stats.unknown;
    delete stats.expired;
    legacy.patents.stats = stats as typeof legacy.patents.stats;

    const result = validateSiteContent(legacy);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.patents.stats.unknown).toBe(0);
      expect(result.data.patents.stats.expired).toBe(0);
    }
  });
});

describe('publicationType chapter mapping and stats', () => {
  function miniDetails(pub: DetailsSchemaType['publications'][number]): DetailsSchemaType {
    return {
      profile: { name: 'N', title: null, photoUrl: null, summary: null, meta: null },
      about: {
        brief: null,
        full: null,
        education: [],
        positions: [],
        awards: [],
        languages: [],
        cvNarrativeSections: [],
      },
      research: { interests: [], projects: [], grants: [] },
      publications: [pub],
      patents: [],
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
      rawHtml: null,
      counts: { publications: 1, patents: 0, projects: 0, awards: 0, students: 0 },
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

  it('maps chapter to book in merge stats', () => {
    const base = assertSiteContent(SITE_CONTENT_RAW);
    const details = miniDetails({
      id: 'ch1',
      title: 'Chapter in edited volume',
      authors: 'A',
      journal: 'Springer',
      year: 2008,
      volume: null,
      issue: null,
      pages: null,
      doi: null,
      link: null,
      type: 'chapter',
      impactFactor: null,
      quartile: null,
      raw: null,
    });
    expect(publicationType('chapter')).toBe('book');
    const merged = mergeCvDetailsIntoSiteContent(details, base);
    expect(merged.publications.items[0]?.type).toBe('book');
    expect(merged.publications.stats.books).toBe(1);
    expect(merged.publications.stats.others).toBe(0);
    const sum =
      merged.publications.stats.journals +
      merged.publications.stats.conferences +
      merged.publications.stats.books +
      merged.publications.stats.others;
    expect(sum).toBe(merged.publications.stats.total);
  });
});
