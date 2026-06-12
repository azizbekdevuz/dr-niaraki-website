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
      {activeProvider?.label ?? 'Disabled'}
      {settings?.activeModel ? (
        <span className="ml-1 font-mono text-foreground">({settings.activeModel})</span>
      ) : null}
      {activeProvider?.statusMessage ? <p className="mt-1">{activeProvider.statusMessage}</p> : null}
      {settings?.switchingMode === 'env_only' ? (
        <p className="mt-1 text-[11px]">{settings.switchingNote}</p>
      ) : null}
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
  aiEnabled,
  providerSettingsError,
  loadingSettings,
  generating,
  onGenerate,
}: {
  aiEnabled: boolean;
  providerSettingsError: string | null;
  loadingSettings: boolean;
  generating: boolean;
  onGenerate: () => void;
}) {
  if (aiEnabled) {
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
  return (
    <p className="text-xs text-muted" data-testid="ai-disabled-message">
      AI is disabled or misconfigured. Set <code className="font-mono">AI_PROVIDER</code> and provider env vars, then
      redeploy. See{' '}
      <Link href="/admin/ai" className="text-accent-primary hover:underline">
        provider settings
      </Link>
      .
    </p>
  );
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
        setSettings(data.settings as AiProviderSettingsModel);
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
    settings?.activeProvider !== 'none' &&
    activeProvider?.status === 'configured';
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
          Provider settings
        </Link>
      </div>

      <ProviderStatusBanner
        settings={settings}
        loading={loadingSettings}
        providerSettingsError={providerSettingsError}
      />

      <div className="mt-4">
        <GenerateAction
          aiEnabled={aiEnabled}
          providerSettingsError={providerSettingsError}
          loadingSettings={loadingSettings}
          generating={generating}
          onGenerate={() => void generate()}
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
