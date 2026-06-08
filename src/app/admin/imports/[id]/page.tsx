'use client';

/**
 * Single import review: warnings, summary, section comparison, merge-to-draft (create or replace).
 */

import { Loader2, Package } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

import { TW_ACCENT_SOFT_GRADIENT } from '@/lib/ui/chromeClassStrings';

import { ImportDetailBody, type ImportDetailModel, type ReviewBaselineQuery, type ReviewPayloadModel } from '../importDetailBody';

export default function AdminImportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imp, setImp] = useState<ImportDetailModel | null>(null);
  const [review, setReview] = useState<ReviewPayloadModel | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [merging, setMerging] = useState(false);
  const [mergeMsg, setMergeMsg] = useState<string | null>(null);
  const [baselineMode, setBaselineMode] = useState<ReviewBaselineQuery>('auto');

  const load = useCallback(async () => {
    if (!id) {
      return;
    }
    setLoading(true);
    setError(null);
    setMergeMsg(null);
    try {
      const statusRes = await fetch('/api/admin/status', { credentials: 'include' });
      const statusData = await statusRes.json();
      if (!statusData.isLoggedIn) {
        router.push('/admin');
        return;
      }
      if (!statusData.hasValidDevice) {
        router.push('/admin/devices');
        return;
      }
      const qs = new URLSearchParams();
      qs.set('baseline', baselineMode);
      const [revRes, draftRes] = await Promise.all([
        fetch(`/api/admin/imports/${id}/review?${qs.toString()}`, { credentials: 'include' }),
        fetch('/api/admin/content/draft', { credentials: 'include' }),
      ]);
      const revJson = await revRes.json();
      if (!revRes.ok || !revJson.ok) {
        setError(revJson.message || revJson.error || 'Failed to load import');
        return;
      }
      setImp(revJson.import as ImportDetailModel);
      setReview(revJson.review as ReviewPayloadModel);
      const dJson = await draftRes.json();
      setHasDraft(Boolean(dJson.ok && dJson.draft));
    } catch {
      setError('Failed to load import');
    } finally {
      setLoading(false);
    }
  }, [id, router, baselineMode]);

  useEffect(() => {
    void load();
  }, [load]);

  const discardDraft = useCallback(async () => {
    if (
      !globalThis.confirm(
        'Discard the working draft? This permanently deletes the draft database row. Published content and imports are not changed.',
      )
    ) {
      return;
    }
    setError(null);
    try {
      const res = await fetch('/api/admin/content/draft/discard', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || data.error || 'Discard failed');
        return;
      }
      await load();
    } catch {
      setError('Discard request failed');
    }
  }, [load]);

  const merge = useCallback(
    async (
      action: 'create' | 'replace',
      opts: { mergeMode: 'safe_update' | 'full_replace'; acknowledgeHighRisk: boolean },
    ) => {
      setMerging(true);
      setMergeMsg(null);
      setError(null);
      try {
        const res = await fetch(`/api/admin/imports/${id}/merge-to-draft`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            mergeMode: opts.mergeMode,
            acknowledgeHighRisk: opts.acknowledgeHighRisk ? true : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setError(data.message || data.error || 'Merge failed');
          return;
        }
        setError(null);
        setMergeMsg(
          data.alreadyMerged
            ? 'This import was already merged into a draft — showing the linked version below.'
            : 'Draft updated. Open Site content to review and publish separately.',
        );
        await load();
      } catch {
        setMergeMsg('Merge request failed');
      } finally {
        setMerging(false);
      }
    },
    [id, load],
  );

  if (loading || !imp) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
      </div>
    );
  }

  const cap = review?.baselineCapabilities;

  return (
    <div>
      <div className="px-4 pt-8 max-w-5xl mx-auto">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${TW_ACCENT_SOFT_GRADIENT}`}>
            <Package className="w-6 h-6 text-accent-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-foreground">Import review</h1>
            <p className="text-muted text-sm">{imp.originalFileName}</p>
            <p className="text-xs text-muted mt-1">
              Status: <span className="text-foreground">{imp.status}</span> · Baseline:{' '}
              <span className="text-foreground">{review?.baselineSource ?? '—'}</span>
              {review?.baselineLabel ? (
                <>
                  {' '}
                  — <span className="text-foreground">{review.baselineLabel}</span>
                </>
              ) : null}
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs text-muted">
                <span>Compare import against</span>
                <select
                  className="rounded-md border border-primary/20 bg-surface-secondary px-2 py-1.5 text-sm text-foreground"
                  value={baselineMode}
                  onChange={(e) => setBaselineMode(e.target.value as ReviewBaselineQuery)}
                >
                  <option value="auto">Auto (working draft if it exists, else canonical)</option>
                  <option value="working_draft">Working draft</option>
                  <option value="canonical">In-repo canonical</option>
                  <option value="published" disabled={!cap?.hasPublished}>
                    Latest published (database)
                  </option>
                </select>
              </label>
              {hasDraft ? (
                <button
                  type="button"
                  className="btn-secondary px-3 py-1.5 text-xs"
                  onClick={() => void discardDraft()}
                >
                  Discard working draft
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <ImportDetailBody
        imp={imp}
        review={review}
        hasDraft={hasDraft}
        merging={merging}
        mergeMsg={mergeMsg}
        error={error}
        onMerge={(a, o) => void merge(a, o)}
      />
    </div>
  );
}
