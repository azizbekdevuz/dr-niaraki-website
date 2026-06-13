/** @vitest-environment happy-dom */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
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
});
