import { describe, expect, it } from 'vitest';

import {
  deduplicatePublications,
  isTruncatedPublicationTitle,
  publicationIdentityKeys,
  recoverPublicationTitleFromRaw,
} from '@/parser/publicationDeduplicate';
import type { Publication } from '@/types/details';

function pub(overrides: Partial<Publication> & Pick<Publication, 'id' | 'title'>): Publication {
  return {
    authors: 'Author, A.',
    journal: 'Journal',
    year: 2022,
    volume: null,
    issue: null,
    pages: null,
    doi: null,
    link: null,
    type: 'journal',
    impactFactor: null,
    quartile: null,
    raw: null,
    ...overrides,
  };
}

describe('recoverPublicationTitleFromRaw', () => {
  it('recovers full title from APA raw when title is truncated', () => {
    const raw =
      'Razavi-Termeh, S. V., Hatamiafkoueieh, J., Sadeghi-Niaraki, A., Choi, S. M., & Al-Kindi, K. M. (2023). A GIS-based multi-objective evolutionary algorithm for landslide susceptibility mapping. Stochastic Environmental Research and Risk Assessment, 1-26.';
    expect(recoverPublicationTitleFromRaw(raw)).toContain('landslide susceptibility');
  });
});

describe('deduplicatePublications', () => {
  it('collapses exact duplicate records', () => {
    const full =
      'Adnan, R. M., Yaseen, Z. M., Heddam, S., Shahid, S., Sadeghi-Niaraki, A., & Kisi, O. (2022). Predictability performance enhancement for suspended sediment in rivers: Inspection of newly developed hybrid adaptive neuro-fuzzy system model. International Journal of Sediment Research.';
    const a = pub({
      id: 'a1',
      title: 'Predictability performance enhancement for suspended sediment in rivers',
      authors: 'Adnan, R. M., Yaseen, Z. M., Heddam, S., Shahid, S., Sadeghi-Niaraki, A., & Kisi, O.',
      journal: 'International Journal of Sediment Research',
      year: 2022,
      raw: full,
    });
    const b = pub({ ...a, id: 'a2' });
    const result = deduplicatePublications([a, b]);
    expect(result.data).toHaveLength(1);
    expect(result.removedCount).toBe(1);
  });

  it('keeps truncated/full duplicate as one with recovered title', () => {
    const raw =
      'Razavi-Termeh, S. V., Hatamiafkoueieh, J., Sadeghi-Niaraki, A., Choi, S. M., & Al-Kindi, K. M. (2023). A GIS-based multi-objective evolutionary algorithm for landslide susceptibility mapping. Stochastic Environmental Research and Risk Assessment, 1-26.';
    const truncated = pub({
      id: 't1',
      title: 'M.',
      authors: 'Razavi-Termeh, S. V., Hatamiafkoueieh, J., Sadeghi-Niaraki, A., Choi, S. M., & Al-Kindi, K.',
      journal: 'Stochastic Environmental Research and Risk Assessment',
      year: 2023,
      raw,
    });
    const result = deduplicatePublications([truncated]);
    expect(result.data[0]?.title).toContain('landslide');
    expect(isTruncatedPublicationTitle(result.data[0]?.title ?? '')).toBe(false);
  });

  it('preserves richer metadata when merging duplicates', () => {
    const a = pub({
      id: 'r1',
      title: 'Shared publication title for merge metadata test case',
      year: 2020,
      doi: '10.1000/example',
      impactFactor: '4.0',
      raw: 'Author (2020). Shared publication title for merge metadata test case. Journal, 1(1). doi:10.1000/example',
    });
    const b = pub({
      id: 'r2',
      title: 'Shared publication title for merge metadata test case',
      year: 2020,
      quartile: 'Q1',
      raw: 'Author (2020). Shared publication title for merge metadata test case. Journal, 1(1).',
    });
    const result = deduplicatePublications([a, b]);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.doi).toBe('10.1000/example');
    expect(result.data[0]?.quartile).toBe('Q1');
  });

  it('does not merge similar titles with different years', () => {
    const a = pub({
      id: 'u1',
      title: 'Ubiquitous City',
      year: 2011,
      authors: 'Sadeghi-Niaraki, A.',
    });
    const b = pub({
      id: 'u2',
      title: 'Ubiquitous City',
      year: 2017,
      authors: 'Rokhsaritalemi, S.',
    });
    const result = deduplicatePublications([a, b]);
    expect(result.data).toHaveLength(2);
  });

  it('does not merge similar titles with different authors', () => {
    const a = pub({
      id: 's1',
      title: 'Spatial modeling using machine learning in urban environments',
      year: 2021,
      authors: 'Author, A.',
    });
    const b = pub({
      id: 's2',
      title: 'Spatial modeling using machine learning in rural environments',
      year: 2021,
      authors: 'Author, B.',
    });
    const result = deduplicatePublications([a, b]);
    expect(result.data).toHaveLength(2);
  });

  it('uses DOI as high-confidence identity', () => {
    const keys = publicationIdentityKeys({
      title: 'Any',
      authors: 'A',
      year: 2022,
      doi: '10.1234/abc',
      raw: null,
    });
    expect(keys.some((k) => k.key.startsWith('doi:') && k.confidence === 'high')).toBe(true);
  });
});
