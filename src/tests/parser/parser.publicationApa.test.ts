import { describe, expect, it } from 'vitest';

import { fillPublicationTitleFromCitation } from '@/parser/publicationEntryCore';
import { parsePublications } from '@/parser/publicationsParser';
import { splitPublicationApaBlocks } from '@/parser/publicationsParserApa';
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
});
