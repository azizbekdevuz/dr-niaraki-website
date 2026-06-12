'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

import type { AiProviderSettingsModel } from '@/app/admin/imports/importDetailTypes';
import { TW_ACCENT_SOFT_GRADIENT } from '@/lib/ui/chromeClassStrings';

export default function AdminAiSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AiProviderSettingsModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
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
      setSettings(data.settings as AiProviderSettingsModel);
    } catch {
      setError('Failed to load AI settings');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

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

        <h1 className="text-2xl font-semibold text-foreground">AI review assistant</h1>
        <p className="text-sm text-muted">
          Review-only suggestions for DOCX import review. AI never merges, publishes, or edits site content. Disabled by
          default (<code className="font-mono">AI_PROVIDER=none</code>).
        </p>

        {error ? <div className="card border-error/40 bg-error/5 p-4 text-sm text-error">{error}</div> : null}

        {settings ? (
          <>
            <div className="card p-4 text-sm">
              <p className="font-medium text-foreground">Active provider (env)</p>
              <p className="mt-2 text-muted">
                <span className="font-mono text-foreground">{settings.activeProvider}</span>
                {settings.activeModel ? (
                  <span>
                    {' '}
                    - model <span className="font-mono text-foreground">{settings.activeModel}</span>
                  </span>
                ) : null}
              </p>
              <p className="mt-2 text-xs text-muted">{settings.switchingNote}</p>
            </div>

            <div className="space-y-3">
              {settings.providers.map((p) => (
                <div
                  key={p.id}
                  className={`card p-4 text-sm ${p.active ? 'border-accent-primary/40' : 'border-primary/15'}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-foreground">
                      {p.label}
                      {p.active ? <span className="ml-2 text-xs text-accent-primary">(active)</span> : null}
                    </p>
                    <span className="rounded border border-primary/20 px-2 py-0.5 text-[10px] uppercase text-muted">
                      {p.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted">{p.statusMessage}</p>
                  {p.hostedNote ? <p className="mt-1 text-[11px] text-muted">{p.hostedNote}</p> : null}
                  {p.allowedModels.length > 0 ? (
                    <p className="mt-2 text-[11px] text-muted">
                      Allowlisted models: <span className="font-mono">{p.allowedModels.join(', ')}</span>
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            <ul className="list-disc space-y-1 pl-5 text-xs text-muted">
              {settings.disclaimers.map((d) => (
                <li key={d}>{d}</li>
              ))}
              <li>
                Ollama is the best free/open-source option when you self-host on a VPS or local machine.
              </li>
              <li>
                OpenRouter and Groq may offer free or low-cost hosted models, but access is rate-limited and controlled by
                the provider - not unlimited or guaranteed forever-free.
              </li>
              <li>OpenAI is optional paid hosted inference.</li>
              <li>
                External providers receive minimized review context only - never DOCX bytes or full raw document text. Do
                not enable for private CV data unless you accept provider privacy and logging terms.
              </li>
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}
