import 'server-only';

import { getAiReviewRuntimeConfig } from '@/server/ai/aiReviewConfig';
import { fetchWithTimeout } from '@/server/ai/aiReviewFetch';
import { advisoryErrorResult, parseLlmJsonContent } from '@/server/ai/aiReviewParse';
import { AI_REVIEW_SYSTEM_PROMPT, buildAiReviewUserPrompt } from '@/server/ai/aiReviewPrompt';
import type { AiReviewProvider, AiReviewInput, AiReviewSuggestionResult } from '@/server/ai/aiReviewTypes';
import { AI_REVIEW_DISCLAIMERS } from '@/server/ai/aiReviewTypes';
import { misconfiguredResult, resolveProviderModel } from '@/server/ai/providers/llmProviderShared';

async function ollamaChat(baseUrl: string, model: string, input: AiReviewInput, timeoutMs: number): Promise<string> {
  const res = await fetchWithTimeout(
    `${baseUrl}/api/chat`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        format: 'json',
        messages: [
          { role: 'system', content: AI_REVIEW_SYSTEM_PROMPT },
          { role: 'user', content: buildAiReviewUserPrompt(input) },
        ],
      }),
    },
    timeoutMs,
  );
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
}

export const ollamaAiReviewProvider: AiReviewProvider = {
  id: 'ollama',
  async generateSuggestions(input, inputHash): Promise<AiReviewSuggestionResult> {
    const cfg = getAiReviewRuntimeConfig();
    const modelOrErr = resolveProviderModel('ollama', cfg.ollama.model, cfg.ollama.allowedModels, inputHash);
    if (typeof modelOrErr !== 'string') {
      return modelOrErr;
    }

    try {
      const content = await ollamaChat(cfg.ollama.baseUrl, modelOrErr, input, cfg.timeoutMs);
      const parsed = parseLlmJsonContent(content);
      if (!parsed) {
        return advisoryErrorResult({
          provider: 'ollama',
          model: modelOrErr,
          inputHash,
          status: 'error',
          error: 'Ollama returned malformed JSON',
        });
      }
      return {
        advisory: true,
        enabled: true,
        provider: 'ollama',
        model: modelOrErr,
        status: 'ok',
        generatedAt: new Date().toISOString(),
        inputHash,
        summary: parsed.summary,
        sectionNotes: parsed.sectionNotes,
        disclaimers: [...AI_REVIEW_DISCLAIMERS],
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const isTimeout = msg.includes('abort');
      return advisoryErrorResult({
        provider: 'ollama',
        model: modelOrErr,
        inputHash,
        status: isTimeout ? 'timeout' : 'error',
        error: msg,
      });
    }
  },
};

export function ollamaProviderMisconfigured(inputHash: string): AiReviewSuggestionResult {
  return misconfiguredResult('ollama', inputHash, 'Ollama is selected but not reachable or misconfigured');
}
