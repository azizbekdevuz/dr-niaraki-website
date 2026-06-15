import { describe, expect, it } from 'vitest';

import { parseAwards } from '@/parser/awardsParser';

describe('Awards regression — forensic defects', () => {
  it('preserves Stanford dataset years in title', () => {
    const text =
      'Recognized among the TOP 2% OF SCIENTISTS WORLDWIDE (Stanford-Elsevier 2024,2025 dataset)';
    const result = parseAwards(text);
    expect(result.data[0]?.title).toContain('(Stanford-Elsevier 2024,2025 dataset)');
  });

  it('splits Harvard Fellowship and IETI award into two records', () => {
    const text = `Appointed as a FELLOW at the Spatial Data Lab (SDL), Center for Geographic Analysis, Harvard University (2024)
3rd IETI Young Researcher Award Winner 2024, International Engineering and Technology Institute (IETI). Recognized for cutting-edge research contributions in GeoAI.`;
    const result = parseAwards(text);
    expect(result.data.length).toBeGreaterThanOrEqual(2);
    expect(result.data.some((a) => a.title.includes('Harvard University'))).toBe(true);
    expect(result.data.some((a) => a.title.includes('IETI'))).toBe(true);
  });

  it('does not include Professional Memberships as an award', () => {
    const text = `Best Paper Award 2023
From International Conference on GIS
Professional Memberships
IEEE Member since 2010`;
    const result = parseAwards(text);
    expect(result.data.every((a) => !/professional memberships/i.test(a.title))).toBe(true);
    expect(result.data.every((a) => !/professional memberships/i.test(a.raw ?? ''))).toBe(true);
  });
});
