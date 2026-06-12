import 'server-only';

import { z } from 'zod';

import type { AiReviewSectionNote, AiReviewSuggestionResult } from '@/server/ai/aiReviewTypes';
import { AI_REVIEW_DISCLAIMERS } from '@/server/ai/aiReviewTypes';

const LlmJsonSchema = z.object({
  summary: z.string().min(1),
  sectionNotes: z
    .array(
      z.object({
        sectionId: z.string(),
        severity: z.enum(['info', 'warning', 'danger']),
        message: z.string(),
        suggestedAction: z.enum(['review_manually', 'safe_to_proceed', 'do_not_full_replace', 'check_counts']),
      }),
    )
    .optional(),
});

export function parseLlmJsonContent(raw: string): { summary: string; sectionNotes?: AiReviewSectionNote[] } | null {
  const trimmed = raw.trim();
  const jsonText = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    : trimmed;
  try {
    const parsed = LlmJsonSchema.parse(JSON.parse(jsonText));
    return parsed;
  } catch {
    return null;
  }
}

export function advisoryErrorResult(
  partial: Pick<AiReviewSuggestionResult, 'provider' | 'model' | 'inputHash' | 'status' | 'error'>,
): AiReviewSuggestionResult {
  return {
    advisory: true,
    enabled: partial.status !== 'disabled',
    provider: partial.provider,
    model: partial.model,
    status: partial.status,
    generatedAt: new Date().toISOString(),
    inputHash: partial.inputHash,
    disclaimers: [...AI_REVIEW_DISCLAIMERS],
    error: partial.error,
  };
}
