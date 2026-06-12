import 'server-only';

import { getAiReviewRuntimeConfig } from '@/server/ai/aiReviewConfig';
import { openAiCompatibleChat } from '@/server/ai/aiReviewFetch';
import type { AiReviewProvider } from '@/server/ai/aiReviewTypes';
import { misconfiguredResult, resolveProviderModel, runLlmAiReview } from '@/server/ai/providers/llmProviderShared';

export const openAiAiReviewProvider: AiReviewProvider = {
  id: 'openai',
  async generateSuggestions(input, inputHash) {
    const cfg = getAiReviewRuntimeConfig();
    if (!cfg.openai.apiKey) {
      return misconfiguredResult('openai', inputHash, 'OPENAI_API_KEY is not set');
    }
    const modelOrErr = resolveProviderModel('openai', cfg.openai.model, cfg.openai.allowedModels, inputHash);
    if (typeof modelOrErr !== 'string') {
      return modelOrErr;
    }
    return runLlmAiReview({
      provider: 'openai',
      model: modelOrErr,
      input,
      inputHash,
      call: (messages) =>
        openAiCompatibleChat({
          url: 'https://api.openai.com/v1/chat/completions',
          apiKey: cfg.openai.apiKey!,
          model: modelOrErr,
          messages,
          timeoutMs: cfg.timeoutMs,
          responseFormatJson: true,
        }),
    });
  },
};
