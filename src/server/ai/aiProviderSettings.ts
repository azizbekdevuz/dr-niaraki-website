import 'server-only';

import { getAiReviewRuntimeConfig, resolveAllowlistedModel } from '@/server/ai/aiReviewConfig';
import type { AiProviderId, AiProviderOptionView, AiProviderSettingsView, AiProviderStatus } from '@/server/ai/aiReviewTypes';
import { AI_REVIEW_DISCLAIMERS } from '@/server/ai/aiReviewTypes';

function providerStatus(id: AiProviderId, configured: boolean): AiProviderStatus {
  if (id === 'none') {
    return 'disabled';
  }
  if (!configured) {
    return 'misconfigured';
  }
  return 'configured';
}

function buildOllamaView(active: boolean): AiProviderOptionView {
  const cfg = getAiReviewRuntimeConfig();
  const modelOk = Boolean(resolveAllowlistedModel(cfg.ollama.model, cfg.ollama.allowedModels));
  const configured = modelOk && Boolean(cfg.ollama.baseUrl);
  return {
    id: 'ollama',
    label: 'Ollama (self-hosted)',
    status: providerStatus('ollama', configured),
    active,
    model: modelOk ? cfg.ollama.model : null,
    allowedModels: cfg.ollama.allowedModels,
    statusMessage: configured
      ? 'Self-hosted inference via OLLAMA_BASE_URL. Best free/open-source option when you control the server.'
      : 'Set OLLAMA_BASE_URL and an allowlisted OLLAMA_MODEL.',
    hostedNote: 'Runs on your machine or VPS - not a third-party hosted API.',
  };
}

function buildHostedView(
  id: Extract<AiProviderId, 'openrouter' | 'groq' | 'openai'>,
  label: string,
  active: boolean,
  apiKey: string | null,
  model: string,
  allowed: string[],
  keyName: string,
  hostedNote: string,
): AiProviderOptionView {
  const modelOk = Boolean(resolveAllowlistedModel(model, allowed));
  const configured = Boolean(apiKey) && modelOk;
  let statusMessage = `Set ${keyName} and an allowlisted model.`;
  if (configured) {
    statusMessage = 'API key and model configured (server-side env only).';
  } else if (apiKey && !modelOk) {
    statusMessage = 'API key set but model is not in allowlist.';
  } else if (!apiKey) {
    statusMessage = `Missing ${keyName}.`;
  }
  return {
    id,
    label,
    status: providerStatus(id, configured),
    active,
    model: modelOk ? model : null,
    allowedModels: allowed,
    statusMessage,
    hostedNote,
  };
}

export function getAiProviderSettingsView(): AiProviderSettingsView {
  const cfg = getAiReviewRuntimeConfig();
  const active = cfg.provider;

  const providers: AiProviderOptionView[] = [
    {
      id: 'none',
      label: 'Disabled',
      status: 'disabled',
      active: active === 'none',
      model: null,
      allowedModels: [],
      statusMessage: 'AI review assistant off (default).',
    },
    buildOllamaView(active === 'ollama'),
    buildHostedView(
      'openrouter',
      'OpenRouter',
      active === 'openrouter',
      cfg.openrouter.apiKey,
      cfg.openrouter.model,
      cfg.openrouter.allowedModels,
      'OPENROUTER_API_KEY',
      'Hosted service; free/open models may be rate-limited and subject to provider policies - not unlimited.',
    ),
    buildHostedView(
      'groq',
      'Groq',
      active === 'groq',
      cfg.groq.apiKey,
      cfg.groq.model,
      cfg.groq.allowedModels,
      'GROQ_API_KEY',
      'Hosted service; free tier and model access are rate-limited and may change.',
    ),
    buildHostedView(
      'openai',
      'OpenAI',
      active === 'openai',
      cfg.openai.apiKey,
      cfg.openai.model,
      cfg.openai.allowedModels,
      'OPENAI_API_KEY',
      'Paid hosted API; optional for higher-quality suggestions.',
    ),
  ];

  function activeModelForProvider(): string | null {
    if (active === 'ollama') {
      return resolveAllowlistedModel(cfg.ollama.model, cfg.ollama.allowedModels);
    }
    if (active === 'openrouter') {
      return resolveAllowlistedModel(cfg.openrouter.model, cfg.openrouter.allowedModels);
    }
    if (active === 'groq') {
      return resolveAllowlistedModel(cfg.groq.model, cfg.groq.allowedModels);
    }
    if (active === 'openai') {
      return resolveAllowlistedModel(cfg.openai.model, cfg.openai.allowedModels);
    }
    return null;
  }
  const activeModel = activeModelForProvider();

  return {
    activeProvider: active,
    activeModel,
    switchingMode: 'env_only',
    switchingNote:
      'Active provider and model are set via AI_PROVIDER and provider env vars. Change env and redeploy to switch. API keys never appear in the browser.',
    providers,
    disclaimers: [...AI_REVIEW_DISCLAIMERS],
  };
}
