import { describe, expect, it } from 'vitest';

import { fillPublicationTitleFromCitation } from '@/parser/publicationEntryCore';
import { parsePublications } from '@/parser/publicationsParser';
import { splitPublicationApaBlocks } from '@/parser/publicationsParserApa';
import { isMalformedPublicationVenue } from '@/parser/publicationVenueQuality';
import type { MutablePublication } from '@/types/details';

describe('splitPublicationApaBlocks', () => {
  const merged2026 = `Bazargani, J. S., Rahimi, F., Sadeghi-Niaraki, A., & Choi, S. M. (2026). Which Strategy When? Designing an Adaptive Search System for Virtual Reality. IEEE Transactions on Visualization and Computer Graphics.
Trung, D.T., Sadeghi-Niaraki, A., Bazargani, J. S., & Choi, S. M. (2026, March). CoPianist: Co-Playing with a Virtual Pianist in an Interactive VR System for Piano Practice. In 2026 IEEE Conference on Virtual Reality and 3D User Interfaces Abstracts and Workshops (VRW) (pp. 1309-1310). IEEE.`;

  it('splits month-form APA citation into two records', () => {
    const blocks = splitPublicationApaBlocks(merged2026);
    expect(blocks).toHaveLength(2);
  });

  it('parses two separate publication records from merged 2026 block', () => {
    const result = parsePublications(merged2026);
    expect(result.data).toHaveLength(2);
    const authors =
      'Bazargani, J. S., Rahimi, F., Sadeghi-Niaraki, A., & Choi, S. M.';
    expect(result.data[0]?.title).not.toBe(authors);
    expect(result.data[0]?.title).toContain('Which Strategy When');
    expect(result.data[0]?.title).not.toContain('IEEE Transactions');
    expect(result.data[1]?.title).toContain('CoPianist');
  });
});

describe('fillPublicationTitleFromCitation', () => {
  it('never uses author list as title', () => {
    const trimmed =
      'Bazargani, J. S., Rahimi, F., Sadeghi-Niaraki, A., & Choi, S. M. (2026). Which Strategy When? Designing an Adaptive Search System for Virtual Reality. IEEE Transactions on Visualization and Computer Graphics.';
    const pub: MutablePublication = {
      id: 't',
      title: '',
      authors: null,
      journal: null,
      year: null,
      volume: null,
      issue: null,
      pages: null,
      doi: null,
      link: null,
      type: null,
      impactFactor: null,
      quartile: null,
      raw: trimmed,
    };
    fillPublicationTitleFromCitation(trimmed, pub);
    expect(pub.title).toContain('Which Strategy When');
    expect(pub.title).not.toMatch(/^Bazargani,/);
  });

  it('parses alternate APA form Author, A. Title (YYYY). Journal', () => {
    const trimmed =
      'Ghodosi, M., & Sadeghi-Niaraki, A. Site Selection of the Public Libraries of Bojnourd City in Iran Using FAHP (2019). Research on Information Science and Public Libraries, Vol. 25, No.2, pp. 257-290 (ISC).';
    const pub: MutablePublication = {
      id: 't',
      title: '',
      authors: null,
      journal: null,
      year: null,
      volume: null,
      issue: null,
      pages: null,
      doi: null,
      link: null,
      type: null,
      impactFactor: null,
      quartile: null,
      raw: trimmed,
    };
    fillPublicationTitleFromCitation(trimmed, pub);
    expect(pub.title).toContain('Site Selection');
    expect(pub.title).not.toContain('Research on Information Science');
    expect(pub.authors).toBe('Ghodosi, M., & Sadeghi-Niaraki, A.');
  });
});

describe('parsePublications — books subsection', () => {
  const booksBlock = `BOOKS AND BOOK CHAPTERS
Sadeghi-Niaraki, A. (2009). Ontology-based and User-centric Spatial Modeling in GIS: Basics, Concepts, Methods, Applications. VDM - The Publisher, Saarbrücken, Germany.
Sadeghi-Niaraki, A., Shakeri, M. (2015). Python Programming for Engineering especially for GIS Engineering. K.N.Toosi University Publication (in Persian).`;

  it('does not emit a single aggregate mega-blob publication', () => {
    const result = parsePublications(booksBlock);
    expect(result.data.every((p) => !/^BOOKS AND BOOK CHAPTERS/i.test(p.title))).toBe(true);
    expect(result.data.every((p) => !/^BOOKS AND BOOK CHAPTERS/i.test(p.authors ?? ''))).toBe(true);
    expect(result.data.length).toBeGreaterThanOrEqual(2);
  });
});

describe('isMalformedPublicationVenue', () => {
  it('does not flag remote sensing methodology phrase in title', () => {
    const title =
      'Spatial modeling of asthma-prone areas using remote sensing and ensemble machine learning algorithms';
    expect(isMalformedPublicationVenue(title, 'Remote Sensing')).toBe(false);
  });

  it('does not flag Water journal when title contains Groundwater', () => {
    const title =
      'Groundwater Potential Mapping Using an Integrated Ensemble of Three Bivariate Statistical Models';
    expect(isMalformedPublicationVenue(title, 'Water')).toBe(false);
  });
});
