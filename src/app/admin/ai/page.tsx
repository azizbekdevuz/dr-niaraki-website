'use client';

import { ChevronDown, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import type { AiProviderSettingsModel } from '@/app/admin/imports/importDetailTypes';
import { TW_ACCENT_SOFT_GRADIENT } from '@/lib/ui/chromeClassStrings';

export default function AdminAiSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AiProviderSettingsModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);

  const [formEnabled, setFormEnabled] = useState(false);
  const [formProvider, setFormProvider] = useState('');
  const [formModel, setFormModel] = useState<string | null>(null);

  const applySettingsToForm = useCallback((s: AiProviderSettingsModel) => {
    setFormEnabled(s.savedEnabled);
    setFormProvider(s.savedProvider);
    setFormModel(s.savedModel);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const statusRes = await fetch('/api/admin/status', { credentials: 'include' });
      const status = await statusRes.json();
      if (!status.isLoggedIn) {
        router.push('/admin');
        return;
      }
      if (!status.hasValidDevice) {
        router.push('/admin/devices');
        return;
      }
      const res = await fetch('/api/admin/ai/settings', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || 'Failed to load AI settings');
        return;
      }
      const next = data.settings as AiProviderSettingsModel;
      setSettings(next);
      applySettingsToForm(next);
    } catch {
      setError('Failed to load AI settings');
    } finally {
      setLoading(false);
    }
  }, [applySettingsToForm, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedProviderOption = settings?.providers.find((p) => p.id === formProvider);
  const modelOptions = selectedProviderOption?.allowedModels ?? [];

  const formDirty = useMemo(() => {
    if (!settings) {
      return false;
    }
    return (
      formEnabled !== settings.savedEnabled ||
      formProvider !== settings.savedProvider ||
      (formModel ?? null) !== (settings.savedModel ?? null)
    );
  }, [formEnabled, formModel, formProvider, settings]);

  const saveDisabledReason = useMemo(() => {
    if (!settings || saving || !formDirty) {
      return 'no_changes';
    }
    if (formEnabled) {
      const provider = settings.providers.find((p) => p.id === formProvider);
      if (!provider?.selectable) {
        return 'invalid_provider';
      }
      if (!formModel || !provider.allowedModels.includes(formModel)) {
        return 'invalid_model';
      }
    }
    return null;
  }, [formDirty, formEnabled, formModel, formProvider, saving, settings]);

  const save = async () => {
    if (!settings || saveDisabledReason) {
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/admin/ai/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: formEnabled,
          provider: formProvider,
          model: formModel,
          expectedRevision: settings.revision,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setSaveError('These settings changed in another session. Reloading the latest settings.');
        const reloadRes = await fetch('/api/admin/ai/settings', { credentials: 'include' });
        const reloadData = await reloadRes.json();
        if (reloadRes.ok && reloadData.ok) {
          const next = reloadData.settings as AiProviderSettingsModel;
          setSettings(next);
          applySettingsToForm(next);
        }
        return;
      }
      if (!res.ok || !data.ok) {
        setSaveError(data.message || 'Failed to save AI settings');
        return;
      }
      const next = data.settings as AiProviderSettingsModel;
      setSettings(next);
      applySettingsToForm(next);
      setSaveSuccess(true);
    } catch {
      setSaveError('Failed to save AI settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleFormEnabled = () => {
    const next = !formEnabled;
    setFormEnabled(next);
    if (next) {
      const providerId = formProvider || settings?.savedProvider || '';
      if (!formProvider && settings?.savedProvider) {
        setFormProvider(settings.savedProvider);
      }
      const option = settings?.providers.find((p) => p.id === providerId);
      if (option && (!formModel || !option.allowedModels.includes(formModel))) {
        setFormModel(option.allowedModels[0] ?? formModel);
      }
    }
  };

  const onProviderChange = (nextProvider: string) => {
    setFormProvider(nextProvider);

    const option = settings?.providers.find((p) => p.id === nextProvider);

    if (!option || option.allowedModels.length === 0) {
      setFormModel(null);
      return;
    }

    const keepModel = Boolean(formModel && option.allowedModels.includes(formModel));
    setFormModel(keepModel && formModel ? formModel : (option.allowedModels[0] ?? null));
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
      </div>
    );
  }

  return (
    <div className={`min-h-[60vh] px-4 py-8 ${TW_ACCENT_SOFT_GRADIENT}`}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/admin/upload" className="text-accent-primary hover:underline">
            &lt; Admin
          </Link>
          <Link href="/admin/imports" className="text-accent-primary hover:underline">
            Imports
          </Link>
        </div>

        <h1 className="text-2xl font-semibold text-foreground">AI Review Assistant</h1>
        <p className="text-sm text-muted">
          Turn on advisory suggestions during DOCX import review. AI never merges, publishes, or edits site content.
        </p>

        {error ? <div className="card border-error/40 bg-error/5 p-4 text-sm text-error">{error}</div> : null}
        {saveError ? (
          <div className="card border-warning/40 bg-warning/5 p-4 text-sm text-foreground" data-testid="ai-save-error">
            {saveError}
          </div>
        ) : null}
        {saveSuccess ? (
          <div className="card border-success/40 bg-success/5 p-4 text-sm text-foreground" data-testid="ai-save-success">
            AI settings saved.
          </div>
        ) : null}

        {settings?.settingsUnavailable ? (
          <div className="card border-warning/40 bg-warning/5 p-4 text-sm text-foreground" data-testid="ai-settings-unavailable">
            AI settings are temporarily unavailable.
          </div>
        ) : null}

        {settings && !settings.settingsUnavailable ? (
          <>
            <div className="card p-4 text-sm" data-testid="ai-current-status">
              <p className="font-medium text-foreground">Currently active</p>
              <p className="mt-2 text-muted">
                AI review is <span className="font-medium text-foreground">{settings.enabled ? 'on' : 'off'}</span>.
                {settings.enabled && settings.activeProvider !== 'none' ? (
                  <span>
                    {' '}
                    Using {settings.providers.find((p) => p.active)?.label ?? settings.activeProvider}
                    {settings.activeModel ? (
                      <span>
                        {' '}
                        with model <span className="text-foreground">{settings.activeModel}</span>
                      </span>
                    ) : null}
                    .
                  </span>
                ) : null}
              </p>
              <p className="mt-2 text-xs text-muted">{settings.switchingNote}</p>
            </div>

            <div className="card space-y-5 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">AI review</p>
                  <p className="text-xs text-muted">Generate suggestions on import review pages.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formEnabled}
                  aria-label="Enable AI review"
                  data-testid="ai-enabled-switch"
                  className={`relative h-7 w-12 rounded-full transition-colors ${formEnabled ? 'bg-accent-primary' : 'bg-primary/25'}`}
                  onClick={toggleFormEnabled}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${formEnabled ? 'translate-x-5' : 'translate-x-0.5'}`}
                  />
                </button>
              </div>

              <div>
                <label htmlFor="ai-provider" className="text-sm font-medium text-foreground">
                  Provider
                </label>
                <select
                  id="ai-provider"
                  data-testid="ai-provider-select"
                  className="mt-1 w-full rounded-md border border-primary/20 bg-surface px-3 py-2 text-sm"
                  value={formProvider}
                  onChange={(e) => onProviderChange(e.target.value)}
                >
                  {settings.providers.map((p) => (
                    <option key={p.id} value={p.id} disabled={!p.selectable}>
                      {p.label}
                      {!p.selectable ? ' — Not available' : ''}
                    </option>
                  ))}
                </select>
                {selectedProviderOption && !selectedProviderOption.selectable ? (
                  <p className="mt-1 text-xs text-muted">{selectedProviderOption.statusMessage}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="ai-model" className="text-sm font-medium text-foreground">
                  Model
                </label>
                <select
                  id="ai-model"
                  data-testid="ai-model-select"
                  className="mt-1 w-full rounded-md border border-primary/20 bg-surface px-3 py-2 text-sm"
                  value={formModel ?? ''}
                  onChange={(e) => setFormModel(e.target.value)}
                >
                  {modelOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="btn-primary text-sm disabled:opacity-50"
                data-testid="ai-save-button"
                disabled={Boolean(saveDisabledReason)}
                onClick={() => void save()}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save settings'
                )}
              </button>
            </div>

            <div className="card p-4 text-xs text-muted">
              <p className="font-medium text-foreground">Technical setup</p>
              <p className="mt-2">
                Providers must first be configured by the site administrator before they appear as available here.
                Changing connection credentials or approved models still requires administrator environment
                configuration.
              </p>
              <button
                type="button"
                className="mt-3 flex items-center gap-1 text-accent-primary hover:underline"
                onClick={() => setShowTechnical((v) => !v)}
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${showTechnical ? 'rotate-180' : ''}`} />
                Developer documentation
              </button>
              {showTechnical ? (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Secrets (API keys, Ollama URL) stay in server environment variables only.</li>
                  <li>Database stores only on/off, provider id, and model name.</li>
                  <li>Until the first save here, administrator env defaults apply.</li>
                  <li>Env vars: AI_PROVIDER, provider keys, allowlists — see .env.example.</li>
                </ul>
              ) : null}
            </div>

            <ul className="list-disc space-y-1 pl-5 text-xs text-muted">
              {settings.disclaimers.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}
