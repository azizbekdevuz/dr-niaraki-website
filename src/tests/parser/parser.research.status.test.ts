import { describe, expect, it } from 'vitest';

import { resolveResearchProjectStatus } from '@/parser/periodExtract';

describe('resolveResearchProjectStatus', () => {
  const june2026 = new Date(2026, 5, 15);

  it('marks future month-year end as ongoing', () => {
    expect(
      resolveResearchProjectStatus(
        'National R&D project',
        'March 2022 - February 2030',
        june2026,
      ),
    ).toBe('ongoing');
  });

  it('marks past month-year end as completed', () => {
    expect(
      resolveResearchProjectStatus(
        'Historical mapping project',
        'April 1997 - December 1997',
        june2026,
      ),
    ).toBe('completed');
  });

  it('treats current-year year-only end as ongoing (ambiguous)', () => {
    expect(
      resolveResearchProjectStatus('Collaboration', '2018 - 2026', june2026),
    ).toBe('ongoing');
  });

  it('marks past year-only end as completed', () => {
    expect(
      resolveResearchProjectStatus('Old grant', '2016 - 2017', june2026),
    ).toBe('completed');
  });

  it('respects explicit Present wording', () => {
    expect(
      resolveResearchProjectStatus('Active lab', '2018 - Present', june2026),
    ).toBe('ongoing');
  });
});
