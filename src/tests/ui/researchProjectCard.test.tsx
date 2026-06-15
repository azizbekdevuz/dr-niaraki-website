/** @vitest-environment happy-dom */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ResearchProjectCard } from '@/components/research/ResearchProjectCard';
import type { SiteContent } from '@/content/schema';

type ResearchProject = SiteContent['research']['projects'][number];

function project(overrides: Partial<ResearchProject> = {}): ResearchProject {
  return {
    id: 'r1',
    title: 'XR Project',
    description: 'Line one.\nLine two.',
    period: 'March 2022 - February 2030',
    funding: 'IITP',
    amount: '$9.3M',
    status: 'ongoing',
    role: 'Lead',
    ...overrides,
  };
}

describe('ResearchProjectCard', () => {
  it('preserves newline-separated description paragraphs', () => {
    const { container } = render(<ResearchProjectCard project={project()} />);
    const desc = container.querySelector('.whitespace-pre-line');
    expect(desc?.textContent).toContain('Line one.');
    expect(desc?.textContent).toContain('Line two.');
  });

  it('hides placeholder metadata rows', () => {
    render(
      <ResearchProjectCard
        project={project({ role: '\u2014', amount: '—', funding: '  ' })}
      />,
    );
    expect(screen.queryByText('Lead')).toBeNull();
    expect(screen.getByText('March 2022 - February 2030')).toBeTruthy();
  });
});
