import 'server-only';

import type { AiProviderId, AiReviewProvider } from '@/server/ai/aiReviewTypes';
import { groqAiReviewProvider } from '@/server/ai/providers/groqProvider';
import { noneAiReviewProvider } from '@/server/ai/providers/noneProvider';
import { ollamaAiReviewProvider } from '@/server/ai/providers/ollamaProvider';
import { openAiAiReviewProvider } from '@/server/ai/providers/openAiProvider';
import { openRouterAiReviewProvider } from '@/server/ai/providers/openRouterProvider';

const PROVIDERS: Record<AiProviderId, AiReviewProvider> = {
  none: noneAiReviewProvider,
  ollama: ollamaAiReviewProvider,
  openrouter: openRouterAiReviewProvider,
  groq: groqAiReviewProvider,
  openai: openAiAiReviewProvider,
};

export function getAiReviewProvider(id: AiProviderId): AiReviewProvider {
  return PROVIDERS[id] ?? noneAiReviewProvider;
}
