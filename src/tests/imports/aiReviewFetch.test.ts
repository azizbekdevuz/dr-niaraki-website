/** @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { openAiCompatibleChat } from '@/server/ai/aiReviewFetch';
import { isAiProviderTimeoutError } from '@/server/ai/providers/llmProviderShared';

describe('aiReviewFetch timeout', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('aborts when headers resolve but body read stalls', async () => {
    vi.mocked(fetch).mockImplementation((_url, init) => {
      const signal = init?.signal;
      return Promise.resolve({
        ok: true,
        json: () =>
          new Promise((_resolve, reject) => {
            signal?.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'));
            });
          }),
        text: () =>
          new Promise((_resolve, reject) => {
            signal?.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'));
            });
          }),
      } as Response);
    });

    await expect(
      openAiCompatibleChat({
        url: 'https://example.com/v1/chat/completions',
        apiKey: 'sk-test',
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'hi' }],
        timeoutMs: 50,
      }),
    ).rejects.toSatisfy((e) => isAiProviderTimeoutError(e));
  });
});
