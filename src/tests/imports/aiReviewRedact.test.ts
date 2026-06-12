/** @vitest-environment node */

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { redactSensitiveText } from '@/server/ai/aiReviewRedact';

describe('redactSensitiveText', () => {
  it('preserves ISO and DMY dates', () => {
    expect(redactSensitiveText('Published 2020-01-15 and 15/01/2020')).toBe(
      'Published 2020-01-15 and 15/01/2020',
    );
    expect(redactSensitiveText('Updated 2020.01.15')).toBe('Updated 2020.01.15');
    expect(redactSensitiveText('Deadline 31-12-2024')).toBe('Deadline 31-12-2024');
  });

  it('preserves year ranges and standalone years', () => {
    expect(redactSensitiveText('Experience 2010-2020 and year 2019')).toBe(
      'Experience 2010-2020 and year 2019',
    );
  });

  it('redacts international and Korean-style phone numbers', () => {
    expect(redactSensitiveText('Call +1-555-123-4567')).toContain('[redacted-phone]');
    expect(redactSensitiveText('Mobile 010-1234-5678')).toContain('[redacted-phone]');
    expect(redactSensitiveText('KR +82-10-1234-5678')).toContain('[redacted-phone]');
  });

  it('does not redact short ordinary numbers', () => {
    expect(redactSensitiveText('5 publications and 3 awards')).toBe('5 publications and 3 awards');
  });

  it('redacts emails and urls', () => {
    const out = redactSensitiveText('Email a@b.co url https://x.test/y');
    expect(out).toContain('[redacted-email]');
    expect(out).toContain('[redacted-url]');
  });
});
