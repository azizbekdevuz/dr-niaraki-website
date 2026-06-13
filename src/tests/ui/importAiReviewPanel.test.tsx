/** @vitest-environment happy-dom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ImportAiReviewAssistantPanel } from '@/app/admin/imports/ImportAiReviewAssistantPanel';

const enabledSettings = {
  enabled: true,
  activeProvider: 'ollama',
  activeModel: 'llama3.1:8b',
  source: 'database' as const,
  revision: 1,
  savedEnabled: true,
  savedProvider: 'ollama',
  savedModel: 'llama3.1:8b',
  switchingMode: 'runtime_database' as const,
  switchingNote: 'saved',
  providers: [
    {
      id: 'ollama',
      label: 'Ollama - Private/self-hosted',
      status: 'configured',
      active: true,
      selectable: true,
      model: 'llama3.1:8b',
      allowedModels: ['llama3.1:8b'],
      statusMessage: 'Available',
    },
  ],
  disclaimers: ['Advisory only'],
};

describe('ImportAiReviewAssistantPanel', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders disabled state when AI review is turned off', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        settings: {
          enabled: false,
          activeProvider: 'none',
          activeModel: null,
          source: 'database',
          revision: 1,
          savedEnabled: false,
          savedProvider: 'groq',
          savedModel: 'llama-3.1-8b-instant',
          switchingMode: 'runtime_database',
          switchingNote: 'saved',
          providers: [
            {
              id: 'groq',
              label: 'Groq',
              status: 'configured',
              active: false,
              selectable: true,
              model: null,
              allowedModels: ['llama-3.1-8b-instant'],
              statusMessage: 'Available',
            },
          ],
          disclaimers: ['Advisory only'],
        },
      }),
    });
    render(<ImportAiReviewAssistantPanel importId="imp1" baselineMode="auto" />);
    await waitFor(() => {
      expect(screen.getByTestId('ai-disabled-message')).toBeTruthy();
    });
    expect(screen.getByText(/AI review is turned off/i)).toBeTruthy();
    expect(screen.queryByTestId('ai-generate-button')).toBeNull();
    expect(screen.queryByRole('button', { name: /apply/i })).toBeNull();
    expect(screen.queryByText(/AI_PROVIDER/)).toBeNull();
  });

  it('shows misconfigured provider message', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        settings: {
          enabled: true,
          activeProvider: 'openai',
          activeModel: 'gpt-4o-mini',
          source: 'database',
          revision: 1,
          savedEnabled: true,
          savedProvider: 'openai',
          savedModel: 'gpt-4o-mini',
          switchingMode: 'runtime_database',
          switchingNote: 'saved',
          providers: [
            {
              id: 'openai',
              label: 'OpenAI',
              status: 'misconfigured',
              active: true,
              selectable: false,
              model: 'gpt-4o-mini',
              allowedModels: ['gpt-4o-mini'],
              statusMessage: 'Not available - setup is incomplete.',
            },
          ],
          disclaimers: ['Advisory only'],
        },
      }),
    });
    render(<ImportAiReviewAssistantPanel importId="imp1" baselineMode="auto" />);
    await waitFor(() => {
      expect(screen.getByTestId('ai-disabled-message')).toBeTruthy();
    });
    expect(screen.getByText(/currently unavailable/i)).toBeTruthy();
    expect(screen.queryByTestId('ai-generate-button')).toBeNull();
    expect(screen.queryByRole('button', { name: /apply/i })).toBeNull();
  });

  it('shows unavailable label when enabled but no matching provider option', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        settings: {
          enabled: true,
          activeProvider: 'none',
          activeModel: null,
          source: 'database',
          revision: 1,
          savedEnabled: true,
          savedProvider: 'groq',
          savedModel: 'llama-3.1-8b-instant',
          switchingMode: 'runtime_database',
          switchingNote: 'saved',
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
          ],
          disclaimers: ['Advisory only'],
        },
      }),
    });
    render(<ImportAiReviewAssistantPanel importId="imp1" baselineMode="auto" />);
    await waitFor(() => {
      expect(screen.getByText(/Active:/)).toBeTruthy();
    });
    expect(screen.getByText(/Unavailable/)).toBeTruthy();
    expect(screen.queryByText(/^Configured$/)).toBeNull();
    expect(screen.queryByTestId('ai-generate-button')).toBeNull();
  });

  it('shows provider settings unavailable message on settings load failure', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, message: 'server error' }),
    });
    render(<ImportAiReviewAssistantPanel importId="imp1" baselineMode="auto" />);
    await waitFor(() => {
      expect(screen.getByTestId('ai-provider-settings-error')).toBeTruthy();
    });
    expect(screen.getByText('Provider status is currently unavailable.')).toBeTruthy();
    expect(screen.queryByTestId('ai-disabled-message')).toBeNull();
    expect(screen.queryByTestId('ai-generate-button')).toBeNull();
  });

  it('shows fallback disabled message when settings payload is absent', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    });
    render(<ImportAiReviewAssistantPanel importId="imp1" baselineMode="auto" />);
    await waitFor(() => {
      expect(screen.getByTestId('ai-disabled-message')).toBeTruthy();
    });
    expect(screen.getByText(/AI review is currently unavailable/i)).toBeTruthy();
    expect(screen.queryByTestId('ai-provider-settings-error')).toBeNull();
    expect(screen.queryByTestId('ai-generate-button')).toBeNull();
    expect(screen.queryByRole('button', { name: /apply/i })).toBeNull();
  });

  it('shows manual generate button and advisory results when enabled', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          settings: enabledSettings,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          result: {
            advisory: true,
            enabled: true,
            provider: 'ollama',
            model: 'llama3.1:8b',
            status: 'ok',
            generatedAt: new Date().toISOString(),
            inputHash: 'abc',
            summary: 'Review patent counts manually.',
            sectionNotes: [
              {
                sectionId: 'patents',
                severity: 'warning',
                message: 'Count mismatch',
                suggestedAction: 'check_counts',
              },
            ],
            disclaimers: ['Advisory only'],
          },
        }),
      });

    render(<ImportAiReviewAssistantPanel importId="imp1" baselineMode="auto" />);
    await waitFor(() => {
      expect(screen.getByTestId('ai-generate-button')).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId('ai-generate-button'));
    await waitFor(() => {
      expect(screen.getByText(/Review patent counts manually/i)).toBeTruthy();
    });
    expect(screen.getByText(/Count mismatch/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /apply/i })).toBeNull();
  });
});
