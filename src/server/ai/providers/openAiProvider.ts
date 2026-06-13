import 'server-only';

import { getAiReviewRuntimeConfig } from '@/server/ai/aiReviewConfig';
import { createOpenAiCompatibleAiReviewProvider } from '@/server/ai/providers/openAiCompatibleProviderFactory';

export const openAiAiReviewProvider = createOpenAiCompatibleAiReviewProvider({
  id: 'openai',
  url: 'https://api.openai.com/v1/chat/completions',
  apiKey: () => getAiReviewRuntimeConfig().openai.apiKey,
  allowedModels: () => getAiReviewRuntimeConfig().openai.allowedModels,
  missingKeyMessage: 'OpenAI is not configured.',
});
