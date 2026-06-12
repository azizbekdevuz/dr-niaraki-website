import 'server-only';

import { getAiReviewRuntimeConfig } from '@/server/ai/aiReviewConfig';
import { openAiCompatibleChat } from '@/server/ai/aiReviewFetch';
import type { AiReviewProvider } from '@/server/ai/aiReviewTypes';
import { misconfiguredResult, resolveProviderModel, runLlmAiReview } from '@/server/ai/providers/llmProviderShared';

export const groqAiReviewProvider: AiReviewProvider = {
  id: 'groq',
  async generateSuggestions(input, inputHash) {
    const cfg = getAiReviewRuntimeConfig();
    if (!cfg.groq.apiKey) {
      return misconfiguredResult('groq', inputHash, 'GROQ_API_KEY is not set');
    }
    const modelOrErr = resolveProviderModel('groq', cfg.groq.model, cfg.groq.allowedModels, inputHash);
    if (typeof modelOrErr !== 'string') {
      return modelOrErr;
    }
    return runLlmAiReview({
      provider: 'groq',
      model: modelOrErr,
      input,
      inputHash,
      call: (messages) =>
        openAiCompatibleChat({
          url: 'https://api.groq.com/openai/v1/chat/completions',
          apiKey: cfg.groq.apiKey!,
          model: modelOrErr,
          messages,
          timeoutMs: cfg.timeoutMs,
          responseFormatJson: true,
        }),
    });
  },
};
