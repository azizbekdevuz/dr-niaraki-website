/**
 * Publications parser unit tests
 */

import { describe, it, expect } from 'vitest';

import { parsePublications } from '@/parser/publicationsParser';

describe('Publications Parser', () => {
  it('should parse publication entries', () => {
    const text = `
    1. Razavi-Termeh, S. V., Sadeghi-Niaraki, A. (2024). "Cutting-Edge Strategies for Flood Mapping". Journal of Hydrology, Vol. 15. DOI: 10.1016/j.jhydrol.2024.xxx
    
    2. Another Author (2023). "Another Paper Title". Sustainability Journal.
    `;
    
    const result = parsePublications(text);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0]?.year).toBe(2024);
  });

  it('should generate warnings for missing years', () => {
    const text = '1. Paper without a year mentioned in the text at all long enough entry';
    const result = parsePublications(text);
    expect(result.warnings.some(w => w.message.includes('year'))).toBe(true);
  });

  it('should extract DOIs', () => {
    const text = '1. Paper Title (2024). Journal Name. DOI: 10.1016/j.test.2024.001';
    const result = parsePublications(text);
    expect(result.data[0]?.doi).toBe('10.1016/j.test.2024.001');
  });
});

describe('Edge Cases', () => {
  it('should handle malformed entries gracefully', () => {
    const text = 'Short';
    const result = parsePublications(text);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should not crash on special characters', () => {
    const text = '1. Paper with special chars: ™ © ® € £ ¥ • – — " " \' \' (2024)';
    const result = parsePublications(text);
    expect(result.data).toBeDefined();
  });

  it('should handle Unicode text', () => {
    const text = '1. 한국어 제목 (2024). 한국 저널. Korean patent with special characters.';
    const result = parsePublications(text);
    expect(result.data).toBeDefined();
  });
});

describe('Warning Generation', () => {
  it('should generate warnings for ambiguous entries', () => {
    const text = '1. Entry without clear year or journal information - just a long text to test';
    const result = parsePublications(text);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should include entry index in warnings', () => {
    const text = '1. First entry without year longer text here\n2. Second entry also no year even longer text';
    const result = parsePublications(text);
    const warningsWithIndex = result.warnings.filter(w => w.index !== undefined);
    expect(warningsWithIndex.length).toBeGreaterThan(0);
  });
});
