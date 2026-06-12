/**
 * Patents parser unit tests
 */

import { describe, it, expect } from 'vitest';

import { parsePatents } from '@/parser/patentsParser';

describe('Patents Parser', () => {
  it('should parse patent entries', () => {
    const text = `
    1. US Patent 11,816,804B2 - Nov 14, 2023
       "Tourist Accommodation Recommendation Method"
       Inventors: Abolghasem Sadeghi-Niaraki
    `;
    
    const result = parsePatents(text);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0]?.country).toBe('US');
  });

  it('should detect patent status', () => {
    const text = '1. Korean Patent 10-2356500 Registered Jan 2022 - Test Patent Title';
    const result = parsePatents(text);
    expect(result.data[0]?.status).toBe('registered');
  });

  it('should detect pending patents', () => {
    const text = '1. Patent Application No. 18/821,509 Pending Aug 2024 - Test Title';
    const result = parsePatents(text);
    expect(result.data[0]?.status).toBe('pending');
    expect(result.data[0]?.number).toBe('18/821,509');
  });

  it('parses US application-style entries without patent number warnings', () => {
    const text = `US International Patent (US11,816,804B2) - Nov 14, 2023
Title: "Granted patent example"
Status: Registration completed
US International Patent (US 2025/0166525 A1) - May 22, 2025
Title: "IoT-based learning method"
Status: Application completed
US International Patent (US 2025/0166317 A1) - May 22, 2025
Title: "Semantic retrieval method"
Status: Application completed
US International Patent (19/326,960) - Sep 12, 2025
Title: "Alzheimer diagnosis method"
Status: Application completed
US International Patent (19/326,984) - Sep 12, 2025
Title: "Mixed reality object placement"
Status: Application completed`;

    const result = parsePatents(text);
    expect(result.data).toHaveLength(5);
    expect(result.data.map((p) => p.number)).toEqual([
      '11,816,804B2',
      '2025/0166525 A1',
      '2025/0166317 A1',
      '19/326,960',
      '19/326,984',
    ]);
    expect(result.data.every((p) => p.country === 'US')).toBe(true);
    const numberWarnings = result.warnings.filter((w) => w.message.includes('patent number not found'));
    expect(numberWarnings).toHaveLength(0);
  });
});
