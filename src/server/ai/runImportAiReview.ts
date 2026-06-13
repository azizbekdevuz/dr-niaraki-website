import 'server-only';

import { cookies } from 'next/headers';

import { getAiReviewRuntimeConfig } from '@/server/ai/aiReviewConfig';
import { advisoryErrorResult } from '@/server/ai/aiReviewParse';
import { aiReviewRateLimitKey, checkAiReviewRateLimit } from '@/server/ai/aiReviewRateLimit';
import { AI_REVIEW_DISCLAIMERS, type AiReviewSuggestionResult } from '@/server/ai/aiReviewTypes';
import { resolveEffectiveAiRuntimeSelection } from '@/server/ai/aiRuntimeSettings';
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
    error: 'AI review is turned off. You can enable it in AI settings.',
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
  const effective = await resolveEffectiveAiRuntimeSelection();

  if (!effective.enabled) {
    return { ok: true, result: disabledAiReviewResult() };
  }

  if (effective.misconfigured) {
    return {
      ok: true,
      result: advisoryErrorResult({
        provider: effective.provider === 'none' ? 'openai' : effective.provider,
        inputHash: '',
        status: 'misconfigured',
        error:
          effective.misconfiguredMessage ??
          'The selected AI provider is currently unavailable. Check AI settings.',
      }),
    };
  }

  if (effective.provider === 'none') {
    return { ok: true, result: disabledAiReviewResult() };
  }

  if (!effective.model) {
    return {
      ok: true,
      result: advisoryErrorResult({
        provider: effective.provider,
        inputHash: '',
        status: 'misconfigured',
        error: 'The selected AI model is not approved. Check AI settings.',
      }),
    };
  }

  const built = await buildAiReviewInput(importId, baseline);
  if (!built) {
    return { ok: false, notFound: true };
  }

  const cfg = getAiReviewRuntimeConfig();
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
        provider: effective.provider,
        status: 'error',
        generatedAt: new Date().toISOString(),
        inputHash: '',
        disclaimers: [...AI_REVIEW_DISCLAIMERS],
        error: 'AI review rate limit exceeded. Try again later.',
      },
    };
  }

  const provider = getAiReviewProvider(effective.provider);
  const result = await provider.generateSuggestions(built.input, built.inputHash, { model: effective.model });

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
