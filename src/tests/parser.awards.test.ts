/**
 * Awards parser unit tests
 */

import { describe, it, expect } from 'vitest';

import { parseAwards } from '@/parser/awardsParser';

describe('Awards Parser', () => {
  it('should parse award entries', () => {
    const text = `
    Best Paper Award 2023
    From International Conference on GIS
    For outstanding research contribution
    `;
    
    const result = parseAwards(text);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0]?.year).toBe('2023');
  });

  it('should detect award categories', () => {
    const text = 'Excellence in Teaching Award 2022 - University Award';
    const result = parseAwards(text);
    expect(result.data[0]?.category).toBe('teaching');
  });
});
