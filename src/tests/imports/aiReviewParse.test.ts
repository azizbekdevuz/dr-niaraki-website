/** @vitest-environment node */

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { parseLlmJsonContent } from '@/server/ai/aiReviewParse';

const validPayload = {
  summary: 'Review patents manually.',
  sectionNotes: [
    {
      sectionId: 'patents',
      severity: 'warning' as const,
      message: 'Count mismatch',
      suggestedAction: 'check_counts' as const,
    },
  ],
};

describe('parseLlmJsonContent', () => {
  it('parses raw JSON', () => {
    const parsed = parseLlmJsonContent(JSON.stringify(validPayload));
    expect(parsed?.summary).toBe('Review patents manually.');
  });

  it('parses fenced JSON', () => {
    const parsed = parseLlmJsonContent(`\`\`\`json\n${JSON.stringify(validPayload)}\n\`\`\``);
    expect(parsed?.sectionNotes?.[0]?.sectionId).toBe('patents');
  });

  it('parses prose before and after fenced JSON', () => {
    const parsed = parseLlmJsonContent(
      `Here is the review:\n\`\`\`json\n${JSON.stringify(validPayload)}\n\`\`\`\nThanks.`,
    );
    expect(parsed?.summary).toBe('Review patents manually.');
  });

  it('parses JSON object embedded in prose', () => {
    const parsed = parseLlmJsonContent(`Analysis complete. ${JSON.stringify(validPayload)} End.`);
    expect(parsed?.summary).toBe('Review patents manually.');
  });

  it('returns null for malformed JSON', () => {
    expect(parseLlmJsonContent('not json at all')).toBeNull();
  });

  it('returns null for wrong schema', () => {
    expect(parseLlmJsonContent(JSON.stringify({ summary: '' }))).toBeNull();
    expect(parseLlmJsonContent(JSON.stringify({ nope: true }))).toBeNull();
  });
});
