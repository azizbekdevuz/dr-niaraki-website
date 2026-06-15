import { describe, expect, it } from 'vitest';

import { parseResearchSection } from '@/parser/docxParserResearch';
import { extractMonthYearPeriod } from '@/parser/periodExtract';

describe('extractMonthYearPeriod', () => {
  it('parses March 2022 - February 2030', () => {
    expect(extractMonthYearPeriod('March 2022 - February 2030')).toBe('March 2022 - February 2030');
  });
});

describe('parseResearchSection — Super-Realistic XR', () => {
  const xrBlock = `Super-Realistic XR Technology Research Center | IITP (Institute for Information and Communication Planning and Evaluation), Ministry of Science and Technology Information and Communication, South Korea

March 2022 - February 2030

Played a key role in multi-million-dollar national R&D projects (approx. $9.3M total) focusing on GeoAI, XR, and Physical AI frameworks.`;

  it('extracts period, amount, and ongoing status', () => {
    const projects = parseResearchSection(xrBlock);
    expect(projects).toHaveLength(1);
    const p = projects[0]!;
    expect(p.period).toBe('March 2022 - February 2030');
    expect(p.fundingAmount).toBe('$9.3M');
    expect(p.status).toBe('ongoing');
    expect(p.funding).toContain('IITP');
  });

  it('marks completed historical project', () => {
    const text = `Surveying Project | Tehran Municipality

April 1997 - December 1997

Produced 1/200 Topographic Map`;
    const projects = parseResearchSection(text);
    expect(projects[0]?.status).toBe('completed');
  });

  it('detects Present as ongoing', () => {
    const text = `Active Lab | Example University

2018 - Present

Ongoing collaboration.`;
    const projects = parseResearchSection(text);
    expect(projects[0]?.status).toBe('ongoing');
  });
});
