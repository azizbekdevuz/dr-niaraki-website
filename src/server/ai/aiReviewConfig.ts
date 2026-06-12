import 'server-only';

import type { AiProviderId } from '@/server/ai/aiReviewTypes';

const PROVIDER_IDS: AiProviderId[] = ['none', 'ollama', 'openrouter', 'groq', 'openai'];

export function parseAiProviderId(raw: string | undefined): AiProviderId {
  const v = (raw ?? 'none').trim().toLowerCase();
  return PROVIDER_IDS.includes(v as AiProviderId) ? (v as AiProviderId) : 'none';
}

export function parseAllowlist(raw: string | undefined, fallback: string): string[] {
  const list = (raw ?? fallback)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : [fallback];
}

export type AiReviewRuntimeConfig = {
  provider: AiProviderId;
  timeoutMs: number;
  maxInputChars: number;
  rateLimitPerHour: number;
  ollama: {
    baseUrl: string;
    model: string;
    allowedModels: string[];
  };
  openrouter: {
    apiKey: string | null;
    model: string;
    allowedModels: string[];
  };
  groq: {
    apiKey: string | null;
    model: string;
    allowedModels: string[];
  };
  openai: {
    apiKey: string | null;
    model: string;
    allowedModels: string[];
  };
};

export function getAiReviewRuntimeConfig(): AiReviewRuntimeConfig {
  const ollamaDefaultModel = process.env.OLLAMA_MODEL?.trim() || 'llama3.1:8b';
  const openrouterDefaultModel = process.env.OPENROUTER_MODEL?.trim() || 'meta-llama/llama-3.1-8b-instruct:free';
  const groqDefaultModel = process.env.GROQ_MODEL?.trim() || 'llama-3.1-8b-instant';
  const openaiDefaultModel = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

  return {
    provider: parseAiProviderId(process.env.AI_PROVIDER),
    timeoutMs: Math.max(3000, Number(process.env.AI_IMPORT_REVIEW_TIMEOUT_MS ?? 15000) || 15000),
    maxInputChars: Math.max(5000, Number(process.env.AI_IMPORT_REVIEW_MAX_INPUT_CHARS ?? 30000) || 30000),
    rateLimitPerHour: Math.max(1, Number(process.env.AI_IMPORT_REVIEW_RATE_LIMIT_PER_HOUR ?? 10) || 10),
    ollama: {
      baseUrl: (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(/\/$/, ''),
      model: ollamaDefaultModel,
      allowedModels: parseAllowlist(process.env.OLLAMA_ALLOWED_MODELS, ollamaDefaultModel),
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY?.trim() || null,
      model: openrouterDefaultModel,
      allowedModels: parseAllowlist(process.env.OPENROUTER_ALLOWED_MODELS, openrouterDefaultModel),
    },
    groq: {
      apiKey: process.env.GROQ_API_KEY?.trim() || null,
      model: groqDefaultModel,
      allowedModels: parseAllowlist(process.env.GROQ_ALLOWED_MODELS, groqDefaultModel),
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY?.trim() || null,
      model: openaiDefaultModel,
      allowedModels: parseAllowlist(process.env.OPENAI_ALLOWED_MODELS, openaiDefaultModel),
    },
  };
}

export function resolveAllowlistedModel(model: string, allowed: string[]): string | null {
  const trimmed = model.trim();
  if (!trimmed) {
    return null;
  }
  return allowed.includes(trimmed) ? trimmed : null;
}

/** OpenRouter HTTP-Referer header (server-side only). */
export function getAiAppReferer(): string {
  return (
    process.env.AI_APP_REFERER?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    'https://www.abolghasemsadeghi-n.com'
  );
}

/** OpenRouter X-Title header (server-side only). */
export function getAiAppTitle(): string {
  return process.env.AI_APP_TITLE?.trim() || 'Dr Niaraki Import Review';
}
