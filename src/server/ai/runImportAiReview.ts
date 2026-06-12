import 'server-only';

import { cookies } from 'next/headers';

import { getAiReviewRuntimeConfig } from '@/server/ai/aiReviewConfig';
import { aiReviewRateLimitKey, checkAiReviewRateLimit } from '@/server/ai/aiReviewRateLimit';
import { AI_REVIEW_DISCLAIMERS, type AiReviewSuggestionResult } from '@/server/ai/aiReviewTypes';
import { buildAiReviewInput } from '@/server/ai/buildAiReviewInput';
import { getAiReviewProvider } from '@/server/ai/providerRegistry';
import { recordContentEvent } from '@/server/content/contentEvents';
import type { ReviewBaselineMode } from '@/server/imports/reviewBaseline';

export type RunImportAiReviewResult =
  | { ok: true; result: AiReviewSuggestionResult; rateLimited?: false }
  | { ok: false; rateLimited: true; result: AiReviewSuggestionResult };

function disabledAiReviewResult(): AiReviewSuggestionResult {
  return {
    advisory: true,
    enabled: false,
    provider: 'none',
    status: 'disabled',
    generatedAt: new Date().toISOString(),
    inputHash: '',
    disclaimers: [...AI_REVIEW_DISCLAIMERS],
    error: 'AI_PROVIDER is none. Set AI_PROVIDER and provider credentials to enable suggestions.',
  };
}

async function logAiReviewAttempt(input: {
  importId: string;
  provider: string;
  model?: string;
  inputHash: string;
  status: string;
  suggestionCount: number;
}) {
  try {
    await recordContentEvent({
      eventType: 'SYSTEM_NOTE',
      payload: {
        kind: 'AI_IMPORT_REVIEW',
        importId: input.importId,
        provider: input.provider,
        model: input.model ?? null,
        inputHash: input.inputHash,
        status: input.status,
        suggestionCount: input.suggestionCount,
      },
    });
  } catch (e) {
    console.warn('[ai-review] audit log failed', e);
  }
}

export async function runImportAiReview(
  importId: string,
  baseline: ReviewBaselineMode,
): Promise<RunImportAiReviewResult | { ok: false; notFound: true }> {
  const cfg = getAiReviewRuntimeConfig();

  if (cfg.provider === 'none') {
    return { ok: true, result: disabledAiReviewResult() };
  }

  const cookieStore = await cookies();
  const sessionKey = aiReviewRateLimitKey(cookieStore.get('admin_session')?.value);
  const limit = checkAiReviewRateLimit(sessionKey, cfg.rateLimitPerHour);

  if (!limit.allowed) {
    return {
      ok: false,
      rateLimited: true,
      result: {
        advisory: true,
        enabled: true,
        provider: cfg.provider,
        status: 'error',
        generatedAt: new Date().toISOString(),
        inputHash: '',
        disclaimers: [...AI_REVIEW_DISCLAIMERS],
        error: 'AI review rate limit exceeded. Try again later.',
      },
    };
  }

  const built = await buildAiReviewInput(importId, baseline);
  if (!built) {
    return { ok: false, notFound: true };
  }

  const provider = getAiReviewProvider(cfg.provider);
  const result = await provider.generateSuggestions(built.input, built.inputHash);

  await logAiReviewAttempt({
    importId,
    provider: result.provider,
    model: result.model,
    inputHash: result.inputHash,
    status: result.status,
    suggestionCount: result.sectionNotes?.length ?? 0,
  });

  return { ok: true, result };
}
