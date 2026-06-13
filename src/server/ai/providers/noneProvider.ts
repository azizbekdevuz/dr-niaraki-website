import 'server-only';

import type { AiReviewProvider, AiReviewRuntimeCall, AiReviewSuggestionResult } from '@/server/ai/aiReviewTypes';
import { AI_REVIEW_DISCLAIMERS } from '@/server/ai/aiReviewTypes';

export const noneAiReviewProvider: AiReviewProvider = {
  id: 'none',
  async generateSuggestions(_input, inputHash, _runtime: AiReviewRuntimeCall): Promise<AiReviewSuggestionResult> {
    return {
      advisory: true,
      enabled: false,
      provider: 'none',
      status: 'disabled',
      generatedAt: new Date().toISOString(),
      inputHash,
      disclaimers: [...AI_REVIEW_DISCLAIMERS],
      error: 'AI_PROVIDER is none. Set AI_PROVIDER and provider credentials to enable suggestions.',
    };
  },
};
