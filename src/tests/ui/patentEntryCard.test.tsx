/** @vitest-environment happy-dom */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PatentEntryCard } from '@/components/patents/PatentEntryCard';
import type { PatentItem } from '@/content/schema';

function patent(overrides: Partial<PatentItem> = {}): PatentItem {
  return {
    id: 'p1',
    title: 'Test Patent',
    number: '10-1234567',
    country: 'Korea',
    date: '2025',
    inventors: 'A. Inventor',
    status: 'registered',
    type: 'korean',
    ...overrides,
  };
}

describe('PatentEntryCard', () => {
  it('renders inventors when present', () => {
    render(<PatentEntryCard patent={patent()} />);
    expect(screen.getByText(/Inventors: A\. Inventor/)).toBeTruthy();
  });

  it('omits inventors row when absent', () => {
    render(<PatentEntryCard patent={patent({ inventors: '\u2014' })} />);
    expect(screen.queryByText(/^Inventors:/)).toBeNull();
  });

  it('omits inventors row for legacy em dash placeholder', () => {
    render(<PatentEntryCard patent={patent({ inventors: '—' })} />);
    expect(screen.queryByText(/^Inventors:/)).toBeNull();
  });
});
