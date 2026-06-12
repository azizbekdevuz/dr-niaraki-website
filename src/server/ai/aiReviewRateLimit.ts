import 'server-only';

import crypto from 'node:crypto';

type Entry = { count: number; resetTime: number };

/** Best-effort in-memory buckets; not shared across serverless instances or cold starts. */
const buckets = new Map<string, Entry>();

function pruneExpiredBuckets(now: number): void {
  for (const [key, entry] of buckets) {
    if (now > entry.resetTime) {
      buckets.delete(key);
    }
  }
}

export function aiReviewRateLimitKey(sessionCookie: string | undefined): string {
  if (!sessionCookie) {
    return 'anonymous';
  }
  return crypto.createHash('sha256').update(sessionCookie).digest('hex').slice(0, 16);
}

export function checkAiReviewRateLimit(
  key: string,
  maxPerHour: number,
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  pruneExpiredBuckets(now);
  const entry = buckets.get(key);

  if (!entry || now > entry.resetTime) {
    const resetTime = now + windowMs;
    buckets.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: maxPerHour - 1, resetTime };
  }

  if (entry.count >= maxPerHour) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxPerHour - entry.count, resetTime: entry.resetTime };
}

/** Test-only: clear in-memory buckets. */
export function resetAiReviewRateLimitsForTests(): void {
  buckets.clear();
}

/** Test-only: inspect bucket count after pruning. */
export function aiReviewRateLimitBucketCountForTests(): number {
  pruneExpiredBuckets(Date.now());
  return buckets.size;
}
