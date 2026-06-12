import 'server-only';

import { getAiReviewRuntimeConfig } from '@/server/ai/aiReviewConfig';
import { fetchWithTimeout, type ChatMessage } from '@/server/ai/aiReviewFetch';
import type { AiReviewProvider, AiReviewSuggestionResult } from '@/server/ai/aiReviewTypes';
import { misconfiguredResult, resolveProviderModel, runLlmAiReview } from '@/server/ai/providers/llmProviderShared';

async function ollamaChat(
  baseUrl: string,
  model: string,
  messages: ChatMessage[],
  timeoutMs: number,
): Promise<string> {
  return fetchWithTimeout(
    `${baseUrl}/api/chat`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        format: 'json',
        messages,
      }),
    },
    timeoutMs,
    async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Ollama HTTP ${res.status}: ${text.slice(0, 300)}`);
      }
      const data = (await res.json()) as { message?: { content?: string } };
      const content = data.message?.content;
      if (!content) {
        throw new Error('Ollama returned empty response');
      }
      return content;
    },
  );
}

export const ollamaAiReviewProvider: AiReviewProvider = {
  id: 'ollama',
  async generateSuggestions(input, inputHash): Promise<AiReviewSuggestionResult> {
    const cfg = getAiReviewRuntimeConfig();
    const modelOrErr = resolveProviderModel('ollama', cfg.ollama.model, cfg.ollama.allowedModels, inputHash);
    if (typeof modelOrErr !== 'string') {
      return modelOrErr;
    }

    return runLlmAiReview({
      provider: 'ollama',
      model: modelOrErr,
      input,
      inputHash,
      call: (messages) => ollamaChat(cfg.ollama.baseUrl, modelOrErr, messages, cfg.timeoutMs),
    });
  },
};

export function ollamaProviderMisconfigured(inputHash: string): AiReviewSuggestionResult {
  return misconfiguredResult('ollama', inputHash, 'Ollama is selected but not reachable or misconfigured');
}
