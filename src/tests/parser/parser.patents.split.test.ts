import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { parsePatents } from '@/parser/patentsParser';

describe('Patents section splitting', () => {
  const fiveUs = `US International Patent (US11,816,804B2) - Nov 14, 2023
Title: "Granted patent example"
Status: Registration completed
US International Patent (US 2025/0166525 A1) - May 22, 2025
Title: "IoT-based learning method"
Status: Application completed
US International Patent (US 2025/0166317 A1) - May 22, 2025
Title: "Semantic retrieval method"
Status: Application completed
US International Patent (US 19/326,960) - Sep 12, 2025
Title: "Alzheimer diagnosis method"
Status: Application completed
US International Patent (US 19/326,984) - Sep 12, 2025
Title: "Mixed reality object placement"
Status: Application completed`;

  it('splits five US patents from one newline-separated block', () => {
    const result = parsePatents(fiveUs);
    expect(result.data).toHaveLength(5);
  });

  it('keeps a single Korean single-line patent as one entry', () => {
    const text =
      '10-2828547 – 2025-06-27 Spatial-temporal distribution analysis method and apparatus of school';
    const result = parsePatents(text);
    expect(result.data).toHaveLength(1);
  });

  it('parses wellformed fixture with expected patent count', () => {
    const fixture = readFileSync(
      join(process.cwd(), 'src/tests/fixtures/cv/patents-wellformed.txt'),
      'utf8',
    );
    const result = parsePatents(fixture);
    expect(result.data.length).toBeGreaterThanOrEqual(10);
  });
});
