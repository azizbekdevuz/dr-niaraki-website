import 'server-only';

import { getAiReviewRuntimeConfig } from '@/server/ai/aiReviewConfig';
import { openAiCompatibleChat } from '@/server/ai/aiReviewFetch';
import type { AiReviewProvider, AiReviewRuntimeCall } from '@/server/ai/aiReviewTypes';
import { misconfiguredResult, resolveProviderModel, runLlmAiReview } from '@/server/ai/providers/llmProviderShared';

export function createOpenAiCompatibleAiReviewProvider(opts: {
  id: 'openai' | 'groq' | 'openrouter';
  url: string;
  apiKey: () => string | null;
  allowedModels: () => string[];
  missingKeyMessage: string;
  extraHeaders?: () => Record<string, string>;
}): AiReviewProvider {
  return {
    id: opts.id,
    async generateSuggestions(input, inputHash, runtime: AiReviewRuntimeCall) {
      const cfg = getAiReviewRuntimeConfig();
      const apiKey = opts.apiKey();
      if (!apiKey) {
        return misconfiguredResult(opts.id, inputHash, opts.missingKeyMessage);
      }
      const modelOrErr = resolveProviderModel(opts.id, runtime.model, opts.allowedModels(), inputHash);
      if (typeof modelOrErr !== 'string') {
        return modelOrErr;
      }
      return runLlmAiReview({
        provider: opts.id,
        model: modelOrErr,
        input,
        inputHash,
        call: (messages) =>
          openAiCompatibleChat({
            url: opts.url,
            apiKey,
            extraHeaders: opts.extraHeaders?.(),
            model: modelOrErr,
            messages,
            timeoutMs: cfg.timeoutMs,
            responseFormatJson: true,
          }),
      });
    },
  };
}
