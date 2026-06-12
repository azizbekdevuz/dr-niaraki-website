import 'server-only';

import { getAiAppReferer, getAiAppTitle, getAiReviewRuntimeConfig } from '@/server/ai/aiReviewConfig';
import { openAiCompatibleChat } from '@/server/ai/aiReviewFetch';
import type { AiReviewProvider } from '@/server/ai/aiReviewTypes';
import { misconfiguredResult, resolveProviderModel, runLlmAiReview } from '@/server/ai/providers/llmProviderShared';

export const openRouterAiReviewProvider: AiReviewProvider = {
  id: 'openrouter',
  async generateSuggestions(input, inputHash) {
    const cfg = getAiReviewRuntimeConfig();
    if (!cfg.openrouter.apiKey) {
      return misconfiguredResult('openrouter', inputHash, 'OPENROUTER_API_KEY is not set');
    }
    const modelOrErr = resolveProviderModel(
      'openrouter',
      cfg.openrouter.model,
      cfg.openrouter.allowedModels,
      inputHash,
    );
    if (typeof modelOrErr !== 'string') {
      return modelOrErr;
    }
    return runLlmAiReview({
      provider: 'openrouter',
      model: modelOrErr,
      input,
      inputHash,
      call: (messages) =>
        openAiCompatibleChat({
          url: 'https://openrouter.ai/api/v1/chat/completions',
          apiKey: cfg.openrouter.apiKey!,
          extraHeaders: {
            'HTTP-Referer': getAiAppReferer(),
            'X-Title': getAiAppTitle(),
          },
          model: modelOrErr,
          messages,
          timeoutMs: cfg.timeoutMs,
          responseFormatJson: true,
        }),
    });
  },
};
