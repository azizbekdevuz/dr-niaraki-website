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
    expect(result.data[0]?.status).toBe('registered');
    expect(result.data[1]?.status).toBe('pending');
    const numberWarnings = result.warnings.filter((w) => w.message.includes('patent number not found'));
    expect(numberWarnings).toHaveLength(0);
  });

  it('parses Korean single-line patent with apparatus as korean type', () => {
    const text =
      '10-2828547 – 2025-06-27 Spatial-temporal distribution analysis method and apparatus of school';
    const result = parsePatents(text);
    expect(result.data[0]?.country).toBe('Korea');
    expect(result.data[0]?.type).toBe('korean');
  });

  it('extracts inventors from US patent with Inventors label', () => {
    const text = `US International Patent (US11,816,804B2) - Nov 14, 2023
Title: "Tourist Accommodation Recommendation Method"
Inventors: Abolghasem Sadeghi-Niaraki, Soo-Mi Choi
Status: Registration completed`;
    const result = parsePatents(text);
    expect(result.data[0]?.inventors).toContain('Sadeghi-Niaraki');
  });

  it('leaves inventors null when not present on Korean single-line patent', () => {
    const text =
      '10-2828547 – 2025-06-27 Spatial-temporal distribution analysis method and apparatus of school';
    const result = parsePatents(text);
    expect(result.data[0]?.inventors).toBeNull();
  });
});
