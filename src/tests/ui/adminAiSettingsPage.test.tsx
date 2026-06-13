/** @vitest-environment happy-dom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const routerPush = vi.fn();
const mockRouter = { push: routerPush };
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

import AdminAiSettingsPage from '@/app/admin/ai/page';

const baseSettings = {
  enabled: false,
  activeProvider: 'none',
  activeModel: null,
  source: 'environment_fallback' as const,
  revision: null,
  savedEnabled: false,
  savedProvider: 'groq',
  savedModel: 'llama-3.1-8b-instant',
  switchingMode: 'runtime_database' as const,
  switchingNote: 'Using administrator default settings until you save your first preference here.',
  providers: [
    {
      id: 'groq',
      label: 'Groq - Hosted, fast',
      status: 'configured',
      active: false,
      selectable: true,
      model: null,
      allowedModels: ['llama-3.1-8b-instant'],
      statusMessage: 'Available',
    },
    {
      id: 'openai',
      label: 'OpenAI - Hosted, paid',
      status: 'misconfigured',
      active: false,
      selectable: false,
      model: null,
      allowedModels: ['gpt-4o-mini'],
      statusMessage: 'Not available - setup is incomplete.',
    },
  ],
  disclaimers: ['Advisory only'],
};

describe('Admin AI settings page', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/admin/status') {
        return { ok: true, json: async () => ({ isLoggedIn: true, hasValidDevice: true }) };
      }
      if (url === '/api/admin/ai/settings') {
        return { ok: true, json: async () => ({ ok: true, settings: baseSettings }) };
      }
      return { ok: false, json: async () => ({ ok: false }) };
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders professor-friendly controls without env variable names in main UI', async () => {
    render(<AdminAiSettingsPage />);
    await waitFor(() => {
      expect(screen.getByText('AI Review Assistant')).toBeTruthy();
    });
    expect(screen.getByTestId('ai-enabled-switch')).toBeTruthy();
    expect(screen.getByTestId('ai-provider-select')).toBeTruthy();
    expect(screen.getByTestId('ai-model-select')).toBeTruthy();
    expect(screen.getByTestId('ai-save-button')).toBeTruthy();
    expect(screen.getByText(/Currently active/i)).toBeTruthy();
    expect(screen.queryByText(/AI_PROVIDER/)).toBeNull();
    expect(screen.queryByText(/GROQ_API_KEY/)).toBeNull();
    expect(screen.queryByText(/redeploy/i)).toBeNull();
  });

  it('disables unconfigured providers in dropdown', async () => {
    render(<AdminAiSettingsPage />);
    await waitFor(() => {
      expect(screen.getByTestId('ai-provider-select')).toBeTruthy();
    });
    const openAiOption = screen.getByRole('option', { name: /OpenAI/ }) as HTMLOptionElement;
    const groqOption = screen.getByRole('option', { name: /Groq/ }) as HTMLOptionElement;
    expect(openAiOption.disabled).toBe(true);
    expect(groqOption.disabled).toBe(false);
  });

  it('shows unavailable message when settings cannot be loaded from database', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/admin/status') {
        return { ok: true, json: async () => ({ isLoggedIn: true, hasValidDevice: true }) };
      }
      if (url === '/api/admin/ai/settings') {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            settings: {
              ...baseSettings,
              settingsUnavailable: true,
              source: 'database_error',
              switchingNote: 'AI settings are temporarily unavailable.',
            },
          }),
        };
      }
      return { ok: false, json: async () => ({ ok: false }) };
    });
    render(<AdminAiSettingsPage />);
    await waitFor(() => {
      expect(screen.getByTestId('ai-settings-unavailable')).toBeTruthy();
    });
    expect(screen.getByText('AI settings are temporarily unavailable.')).toBeTruthy();
    expect(screen.queryByTestId('ai-save-button')).toBeNull();
  });

  it('keeps or resets model when switching providers', async () => {
    const multiProviderSettings = {
      ...baseSettings,
      savedEnabled: true,
      savedProvider: 'groq',
      savedModel: 'llama-3.1-8b-instant',
      providers: [
        {
          id: 'groq',
          label: 'Groq - Hosted, fast',
          status: 'configured',
          active: false,
          selectable: true,
          model: null,
          allowedModels: ['llama-3.1-8b-instant', 'llama-3.1-70b-versatile'],
          statusMessage: 'Available',
        },
        {
          id: 'openrouter',
          label: 'OpenRouter - Hosted model gateway',
          status: 'configured',
          active: false,
          selectable: true,
          model: null,
          allowedModels: ['llama-3.1-8b-instant', 'meta-llama/llama-3.1-8b-instruct:free'],
          statusMessage: 'Available',
        },
        {
          id: 'ollama',
          label: 'Ollama - Private/self-hosted',
          status: 'configured',
          active: false,
          selectable: true,
          model: null,
          allowedModels: ['llama3.1:8b'],
          statusMessage: 'Available',
        },
        {
          id: 'openai',
          label: 'OpenAI - Hosted, paid',
          status: 'misconfigured',
          active: false,
          selectable: false,
          model: null,
          allowedModels: ['gpt-4o-mini'],
          statusMessage: 'Not available - setup is incomplete.',
        },
      ],
    };
    fetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/admin/status') {
        return { ok: true, json: async () => ({ isLoggedIn: true, hasValidDevice: true }) };
      }
      if (url === '/api/admin/ai/settings') {
        return { ok: true, json: async () => ({ ok: true, settings: multiProviderSettings }) };
      }
      return { ok: false, json: async () => ({ ok: false }) };
    });

    render(<AdminAiSettingsPage />);
    const providerSelect = await waitFor(
      () => screen.getByTestId('ai-provider-select') as HTMLSelectElement,
    );
    const modelSelect = screen.getByTestId('ai-model-select') as HTMLSelectElement;

    expect(providerSelect.value).toBe('groq');
    expect(modelSelect.value).toBe('llama-3.1-8b-instant');

    fireEvent.change(providerSelect, { target: { value: 'openrouter' } });
    await waitFor(() => {
      expect(providerSelect.value).toBe('openrouter');
      expect(modelSelect.value).toBe('llama-3.1-8b-instant');
    });

    fireEvent.change(providerSelect, { target: { value: 'ollama' } });
    await waitFor(() => {
      expect(providerSelect.value).toBe('ollama');
      expect(modelSelect.value).toBe('llama3.1:8b');
    });
  });

  it('clears model and disables save when provider has no approved models', async () => {
    const emptyModelProviderSettings = {
      ...baseSettings,
      savedEnabled: true,
      savedProvider: 'groq',
      savedModel: 'llama-3.1-8b-instant',
      providers: [
        {
          id: 'groq',
          label: 'Groq - Hosted, fast',
          status: 'configured',
          active: false,
          selectable: true,
          model: null,
          allowedModels: ['llama-3.1-8b-instant'],
          statusMessage: 'Available',
        },
        {
          id: 'ollama',
          label: 'Ollama - Private/self-hosted',
          status: 'misconfigured',
          active: false,
          selectable: true,
          model: null,
          allowedModels: [],
          statusMessage: 'Not available - setup is incomplete.',
        },
        {
          id: 'openai',
          label: 'OpenAI - Hosted, paid',
          status: 'misconfigured',
          active: false,
          selectable: false,
          model: null,
          allowedModels: ['gpt-4o-mini'],
          statusMessage: 'Not available - setup is incomplete.',
        },
      ],
    };
    fetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/admin/status') {
        return { ok: true, json: async () => ({ isLoggedIn: true, hasValidDevice: true }) };
      }
      if (url === '/api/admin/ai/settings') {
        return { ok: true, json: async () => ({ ok: true, settings: emptyModelProviderSettings }) };
      }
      return { ok: false, json: async () => ({ ok: false }) };
    });

    render(<AdminAiSettingsPage />);
    const providerSelect = await waitFor(
      () => screen.getByTestId('ai-provider-select') as HTMLSelectElement,
    );
    const modelSelect = screen.getByTestId('ai-model-select') as HTMLSelectElement;
    const saveButton = screen.getByTestId('ai-save-button') as HTMLButtonElement;

    expect(providerSelect.value).toBe('groq');
    expect(modelSelect.value).toBe('llama-3.1-8b-instant');
    expect(saveButton.disabled).toBe(true);

    fireEvent.change(providerSelect, { target: { value: 'ollama' } });
    await waitFor(() => {
      expect(providerSelect.value).toBe('ollama');
      expect(modelSelect.value).toBe('');
      expect(saveButton.disabled).toBe(true);
    });
  });
});
