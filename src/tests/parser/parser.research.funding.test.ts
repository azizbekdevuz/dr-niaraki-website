import { describe, expect, it } from 'vitest';

import { extractFundingAmount } from '@/parser/docxParserResearch';

describe('extractFundingAmount', () => {
  it('extracts explicit dollar amounts', () => {
    expect(extractFundingAmount('approx. $9.3M total for the national program')).toBe('$9.3M');
  });

  it('extracts contextual magnitude when funding wording is present', () => {
    expect(extractFundingAmount('multi-million-dollar national R&D projects (9.3M total)')).toBe('$9.3M');
  });

  it('rejects unrelated magnitude tokens', () => {
    expect(extractFundingAmount('The dataset contains 9.3M users and 2.1M data points')).toBeNull();
  });
});
