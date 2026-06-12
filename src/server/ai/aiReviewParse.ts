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

type ParsedLlmJson = { summary: string; sectionNotes?: AiReviewSectionNote[] };

function tryParseCandidate(jsonText: string): ParsedLlmJson | null {
  try {
    return LlmJsonSchema.parse(JSON.parse(jsonText));
  } catch {
    return null;
  }
}

function extractJsonCandidates(raw: string): string[] {
  const candidates: string[] = [];
  const trimmed = raw.trim();
  if (trimmed) {
    candidates.push(trimmed);
  }

  const fenceRe = /```(?:json)?\s*([\s\S]*?)```/gi;
  let match = fenceRe.exec(raw);
  while (match) {
    const block = match[1]?.trim();
    if (block) {
      candidates.push(block);
    }
    match = fenceRe.exec(raw);
  }

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) {
    candidates.push(raw.slice(start, end + 1).trim());
  }

  return candidates;
}

export function parseLlmJsonContent(raw: string): ParsedLlmJson | null {
  const seen = new Set<string>();
  for (const candidate of extractJsonCandidates(raw)) {
    if (!candidate || seen.has(candidate)) {
      continue;
    }
    seen.add(candidate);
    const parsed = tryParseCandidate(candidate);
    if (parsed) {
      return parsed;
    }
  }
  return null;
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
