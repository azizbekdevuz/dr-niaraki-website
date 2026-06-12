/** @vitest-environment happy-dom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ImportAiReviewAssistantPanel } from '@/app/admin/imports/ImportAiReviewAssistantPanel';

describe('ImportAiReviewAssistantPanel', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders disabled state when provider is none', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        settings: {
          activeProvider: 'none',
          activeModel: null,
          switchingMode: 'env_only',
          switchingNote: 'env driven',
          providers: [
            {
              id: 'none',
              label: 'Disabled',
              status: 'disabled',
              active: true,
              model: null,
              allowedModels: [],
              statusMessage: 'off',
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
    expect(screen.queryByTestId('ai-generate-button')).toBeNull();
    expect(screen.queryByRole('button', { name: /apply/i })).toBeNull();
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

  it('shows manual generate button and advisory results when enabled', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          settings: {
            activeProvider: 'ollama',
            activeModel: 'llama3.1:8b',
            switchingMode: 'env_only',
            switchingNote: 'env driven',
            providers: [
              {
                id: 'ollama',
                label: 'Ollama',
                status: 'configured',
                active: true,
                model: 'llama3.1:8b',
                allowedModels: ['llama3.1:8b'],
                statusMessage: 'ready',
              },
            ],
            disclaimers: ['Advisory only'],
          },
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
