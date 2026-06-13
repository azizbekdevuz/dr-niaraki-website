'use client';

import { Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';

import type {
  AiProviderSettingsModel,
  AiReviewSectionNoteModel,
  AiReviewSuggestionModel,
  ReviewBaselineQuery,
} from './importDetailTypes';

type Props = {
  importId: string;
  baselineMode: ReviewBaselineQuery;
};

function severityClass(sev: string): string {
  if (sev === 'danger') {
    return 'border-error/40 bg-error/10 text-foreground';
  }
  if (sev === 'warning') {
    return 'border-warning/40 bg-warning/10 text-foreground';
  }
  return 'border-primary/20 bg-surface-secondary/60 text-foreground';
}

function resolveActiveProviderLabel(settings: AiProviderSettingsModel): string {
  if (!settings.enabled) {
    return 'Off';
  }
  const activeProvider = settings.providers.find((p) => p.active);
  if (activeProvider?.label) {
    return activeProvider.label;
  }
  if (activeProvider) {
    return 'Configured';
  }
  if (settings.activeProvider && settings.activeProvider !== 'none') {
    return settings.activeProvider;
  }
  return 'Unavailable';
}

function ProviderStatusBanner({
  settings,
  loading,
  providerSettingsError,
}: {
  settings: AiProviderSettingsModel | null;
  loading: boolean;
  providerSettingsError: string | null;
}) {
  if (loading) {
    return <p className="mt-3 text-xs text-muted">Loading provider status...</p>;
  }
  if (providerSettingsError) {
    return (
      <div
        className="mt-3 rounded-md border border-warning/35 bg-warning/10 px-3 py-2 text-xs text-foreground"
        data-testid="ai-provider-settings-error"
      >
        {providerSettingsError}
      </div>
    );
  }
  const activeProvider = settings?.providers.find((p) => p.active);
  return (
    <div className="mt-3 rounded-md border border-primary/15 bg-surface-secondary/50 px-3 py-2 text-xs text-muted">
      <span className="font-medium text-foreground">Active: </span>
      {settings ? resolveActiveProviderLabel(settings) : 'Unavailable'}
      {settings?.enabled && settings.activeModel ? (
        <span className="ml-1 text-foreground">({settings.activeModel})</span>
      ) : null}
      {activeProvider?.statusMessage && settings?.enabled ? <p className="mt-1">{activeProvider.statusMessage}</p> : null}
    </div>
  );
}

function AiReviewResults({ result }: { result: AiReviewSuggestionModel }) {
  if (result.status !== 'ok' || !result.summary) {
    return null;
  }
  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm text-foreground">{result.summary}</p>
      {result.sectionNotes && result.sectionNotes.length > 0 ? (
        <ul className="space-y-2">
          {result.sectionNotes.map((note: AiReviewSectionNoteModel, i: number) => (
            <li
              key={`${note.sectionId}-${i}`}
              className={`rounded-md border px-3 py-2 text-xs ${severityClass(note.severity)}`}
            >
              <span className="font-mono text-[10px] uppercase">{note.sectionId}</span>
              <span className="mx-1 text-muted">-</span>
              <span className="font-medium">{note.suggestedAction}</span>
              <p className="mt-1">{note.message}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function GenerateAction({
  message,
  providerSettingsError,
  loadingSettings,
  generating,
  onGenerate,
  showGenerate,
}: {
  message: string | null;
  providerSettingsError: string | null;
  loadingSettings: boolean;
  generating: boolean;
  onGenerate: () => void;
  showGenerate: boolean;
}) {
  if (showGenerate) {
    return (
      <button
        type="button"
        className="btn-primary text-sm disabled:opacity-50"
        disabled={generating}
        onClick={onGenerate}
        data-testid="ai-generate-button"
      >
        {generating ? (
          <>
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate AI suggestions'
        )}
      </button>
    );
  }
  if (providerSettingsError || loadingSettings) {
    return null;
  }
  const displayMessage = message ?? 'AI review is currently unavailable. Check';
  return (
    <p className="text-xs text-muted" data-testid="ai-disabled-message">
      {displayMessage}{' '}
      <Link href="/admin/ai" className="text-accent-primary hover:underline">
        AI settings
      </Link>
      .
    </p>
  );
}

function resolveDisabledMessage(
  settings: AiProviderSettingsModel | null,
  aiEnabled: boolean,
  providerSettingsError: string | null,
  loadingSettings: boolean,
  activeProvider: AiProviderSettingsModel['providers'][number] | undefined,
): string | null {
  if (aiEnabled || providerSettingsError || loadingSettings) {
    return null;
  }
  if (!settings) {
    return 'AI review is currently unavailable. Check';
  }
  if (!settings.enabled) {
    return 'AI review is turned off. You can enable it in';
  }
  if (activeProvider?.status === 'misconfigured' || settings.activeProvider === 'none') {
    return 'The selected AI provider is currently unavailable. Check';
  }
  return 'AI review is not available. Check';
}

export function ImportAiReviewAssistantPanel({ importId, baselineMode }: Props) {
  const [settings, setSettings] = useState<AiProviderSettingsModel | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [providerSettingsError, setProviderSettingsError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<AiReviewSuggestionModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoadingSettings(true);
    setProviderSettingsError(null);
    try {
      const res = await fetch('/api/admin/ai/settings', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.ok) {
        const next = data.settings as AiProviderSettingsModel | undefined;
        if (!next) {
          setSettings(null);
          return;
        }
        if (next.settingsUnavailable) {
          setSettings(null);
          setProviderSettingsError('Provider status is currently unavailable.');
        } else {
          setSettings(next);
        }
      } else {
        setSettings(null);
        setProviderSettingsError('Provider status is currently unavailable.');
      }
    } catch {
      setSettings(null);
      setProviderSettingsError('Provider status is currently unavailable.');
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/imports/${importId}/ai-review`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseline: baselineMode }),
      });
      const data = await res.json();
      if (data.result) {
        setResult(data.result as AiReviewSuggestionModel);
        if (data.result.status !== 'ok' && data.result.error) {
          setError(data.result.error);
        }
      } else {
        setError(data.message || 'AI review request failed');
      }
    } catch {
      setError('AI review request failed');
    } finally {
      setGenerating(false);
    }
  };

  const activeProvider = settings?.providers.find((p) => p.active);
  const aiEnabled =
    !providerSettingsError &&
    !loadingSettings &&
    !settings?.settingsUnavailable &&
    settings?.enabled === true &&
    settings?.activeProvider !== 'none' &&
    activeProvider?.status === 'configured';

  const disabledMessage = resolveDisabledMessage(
    settings,
    aiEnabled,
    providerSettingsError,
    loadingSettings,
    activeProvider,
  );

  const disclaimers = result?.disclaimers ?? settings?.disclaimers ?? [];

  return (
    <div className="card border-primary/20 p-4" data-testid="import-ai-review-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-accent-primary" aria-hidden />
          <div>
            <p className="text-sm font-medium text-foreground">AI review assistant</p>
            <p className="mt-1 text-xs text-muted">
              AI suggestions are advisory, may be wrong, and never change drafts, merge behavior, or the public site.
            </p>
          </div>
        </div>
        <Link href="/admin/ai" className="text-xs text-accent-primary hover:underline">
          AI settings
        </Link>
      </div>

      <ProviderStatusBanner
        settings={settings}
        loading={loadingSettings}
        providerSettingsError={providerSettingsError}
      />

      <div className="mt-4">
        <GenerateAction
          message={disabledMessage}
          providerSettingsError={providerSettingsError}
          loadingSettings={loadingSettings}
          generating={generating}
          onGenerate={() => void generate()}
          showGenerate={aiEnabled}
        />
      </div>

      {error ? (
        <div className="mt-3 rounded-md border border-warning/35 bg-warning/10 px-3 py-2 text-xs text-foreground">
          {error}
        </div>
      ) : null}

      {result ? <AiReviewResults result={result} /> : null}

      {disclaimers.length > 0 ? (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-[11px] text-muted">
          {disclaimers.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
