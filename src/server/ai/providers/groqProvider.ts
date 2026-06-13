import 'server-only';

import { getAiReviewRuntimeConfig } from '@/server/ai/aiReviewConfig';
import { createOpenAiCompatibleAiReviewProvider } from '@/server/ai/providers/openAiCompatibleProviderFactory';

export const groqAiReviewProvider = createOpenAiCompatibleAiReviewProvider({
  id: 'groq',
  url: 'https://api.groq.com/openai/v1/chat/completions',
  apiKey: () => getAiReviewRuntimeConfig().groq.apiKey,
  allowedModels: () => getAiReviewRuntimeConfig().groq.allowedModels,
  missingKeyMessage: 'Groq is not configured.',
});
