import 'server-only';

import { resolveAllowlistedModel } from '@/server/ai/aiReviewConfig';
import { advisoryErrorResult, parseLlmJsonContent } from '@/server/ai/aiReviewParse';
import { AI_REVIEW_SYSTEM_PROMPT, buildAiReviewUserPrompt } from '@/server/ai/aiReviewPrompt';
import type { AiProviderId, AiReviewInput, AiReviewSuggestionResult } from '@/server/ai/aiReviewTypes';
import { AI_REVIEW_DISCLAIMERS } from '@/server/ai/aiReviewTypes';

export function isAiProviderTimeoutError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('abort') || msg.includes('timeout');
  }
  const msg = String(error).toLowerCase();
  return msg.includes('abort') || msg.includes('timeout');
}

export async function runLlmAiReview(opts: {
  provider: AiProviderId;
  model: string;
  input: AiReviewInput;
  inputHash: string;
  call: (messages: { role: 'system' | 'user'; content: string }[]) => Promise<string>;
}): Promise<AiReviewSuggestionResult> {
  try {
    const content = await opts.call([
      { role: 'system', content: AI_REVIEW_SYSTEM_PROMPT },
      { role: 'user', content: buildAiReviewUserPrompt(opts.input) },
    ]);
    const parsed = parseLlmJsonContent(content);
    if (!parsed) {
      return advisoryErrorResult({
        provider: opts.provider,
        model: opts.model,
        inputHash: opts.inputHash,
        status: 'error',
        error: 'Provider returned malformed JSON',
      });
    }
    return {
      advisory: true,
      enabled: true,
      provider: opts.provider,
      model: opts.model,
      status: 'ok',
      generatedAt: new Date().toISOString(),
      inputHash: opts.inputHash,
      summary: parsed.summary,
      sectionNotes: parsed.sectionNotes,
      disclaimers: [...AI_REVIEW_DISCLAIMERS],
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return advisoryErrorResult({
      provider: opts.provider,
      model: opts.model,
      inputHash: opts.inputHash,
      status: isAiProviderTimeoutError(e) ? 'timeout' : 'error',
      error: msg,
    });
  }
}

export function misconfiguredResult(
  provider: AiProviderId,
  inputHash: string,
  error: string,
): AiReviewSuggestionResult {
  return advisoryErrorResult({ provider, inputHash, status: 'misconfigured', error });
}

export function resolveProviderModel(
  provider: AiProviderId,
  model: string,
  allowed: string[],
  inputHash: string,
): string | AiReviewSuggestionResult {
  const resolved = resolveAllowlistedModel(model, allowed);
  if (!resolved) {
    return misconfiguredResult(provider, inputHash, `Model not in allowlist for ${provider}`);
  }
  return resolved;
}
