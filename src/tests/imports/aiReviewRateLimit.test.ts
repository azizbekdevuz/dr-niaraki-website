/** @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  aiReviewRateLimitBucketCountForTests,
  checkAiReviewRateLimit,
  resetAiReviewRateLimitsForTests,
} from '@/server/ai/aiReviewRateLimit';

describe('aiReviewRateLimit', () => {
  beforeEach(() => {
    resetAiReviewRateLimitsForTests();
    vi.useFakeTimers();
  });

  afterEach(() => {
    resetAiReviewRateLimitsForTests();
    vi.useRealTimers();
  });

  it('prunes expired unrelated buckets during check', () => {
    checkAiReviewRateLimit('expired-key', 10);
    vi.advanceTimersByTime(61 * 60 * 1000);
    checkAiReviewRateLimit('active-key', 10);
    expect(aiReviewRateLimitBucketCountForTests()).toBe(1);
    checkAiReviewRateLimit('active-key', 10);
    expect(aiReviewRateLimitBucketCountForTests()).toBe(1);
  });
});
