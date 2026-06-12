/**
 * Cross-parser edge case tests
 */

import { describe, it, expect } from 'vitest';

import { parseAwards } from '@/parser/awardsParser';
import { parseEducation } from '@/parser/educationParser';
import { parseExperience } from '@/parser/experienceParser';
import { parsePatents } from '@/parser/patentsParser';
import { parsePublications } from '@/parser/publicationsParser';

describe('Edge Cases', () => {
  it('should handle empty input', () => {
    expect(parsePublications('').data).toEqual([]);
    expect(parsePatents('').data).toEqual([]);
    expect(parseEducation('').data).toEqual([]);
    expect(parseExperience('').data).toEqual([]);
    expect(parseAwards('').data).toEqual([]);
  });
});
