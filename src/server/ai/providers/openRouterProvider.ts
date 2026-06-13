import 'server-only';

import { getAiAppReferer, getAiAppTitle, getAiReviewRuntimeConfig } from '@/server/ai/aiReviewConfig';
import { createOpenAiCompatibleAiReviewProvider } from '@/server/ai/providers/openAiCompatibleProviderFactory';

export const openRouterAiReviewProvider = createOpenAiCompatibleAiReviewProvider({
  id: 'openrouter',
  url: 'https://openrouter.ai/api/v1/chat/completions',
  apiKey: () => getAiReviewRuntimeConfig().openrouter.apiKey,
  allowedModels: () => getAiReviewRuntimeConfig().openrouter.allowedModels,
  missingKeyMessage: 'OpenRouter is not configured.',
  extraHeaders: () => ({
    'HTTP-Referer': getAiAppReferer(),
    'X-Title': getAiAppTitle(),
  }),
});
