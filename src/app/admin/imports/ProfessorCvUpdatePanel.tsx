'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ChangeBucket,
  partitionChangeItems,
  renderChangeCards,
  SummaryStrip,
} from './professorCvUpdatePanelUi';
import type { ProfessorChangeSet, ProfessorLocalDecision } from './professorCvUpdateTypes';
import { ProfessorUnknownSectionCard } from './ProfessorUnknownSectionCard';

type Props = {
  importId: string;
  hasDraft: boolean;
  merging: boolean;
  onApplyToDraft: () => void;
};

type LoadState = 'loading' | 'ready' | 'error';

export function ProfessorCvUpdatePanel({ importId, hasDraft, merging, onApplyToDraft }: Props) {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [changeSet, setChangeSet] = useState<ProfessorChangeSet | null>(null);
  const [decisions, setDecisions] = useState<Record<string, ProfessorLocalDecision>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadState('loading');
    setError(null);
    try {
      const res = await fetch(`/api/admin/imports/${importId}/changes`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || data.error || 'Failed to load changes');
        setLoadState('error');
        return;
      }
      setChangeSet((data.changeSet as ProfessorChangeSet | null) ?? null);
      const next: Record<string, ProfessorLocalDecision> = {};
      if (Array.isArray(data.decisions)) {
        for (const d of data.decisions as ProfessorLocalDecision[]) {
          next[d.changeId] = d;
        }
      }
      setDecisions(next);
      setLoadState('ready');
    } catch {
      setError('Failed to load changes');
      setLoadState('error');
    }
  }, [importId]);

  useEffect(() => {
    void load();
  }, [load]);

  const setDecision = useCallback((decision: ProfessorLocalDecision) => {
    setDecisions((prev) => ({ ...prev, [decision.changeId]: decision }));
    setSaveMsg(null);
  }, []);

  const decisionList = useMemo(() => Object.values(decisions), [decisions]);

  const saveDecisions = useCallback(async (): Promise<boolean> => {
    if (!changeSet) {return false;}
    setSaving(true);
    setSaveMsg(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/imports/${importId}/change-decisions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changeSetRevision: changeSet.changeSetRevision,
          decisions: decisionList,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || data.error || 'Failed to save choices');
        return false;
      }
      setSaveMsg('Choices saved.');
      return true;
    } catch {
      setError('Failed to save choices');
      return false;
    } finally {
      setSaving(false);
    }
  }, [changeSet, decisionList, importId]);

  const handleApply = useCallback(async () => {
    const ok = decisionList.length === 0 ? true : await saveDecisions();
    if (!ok) {return;}
    onApplyToDraft();
  }, [decisionList.length, onApplyToDraft, saveDecisions]);

  const buckets = useMemo(
    () => (changeSet ? partitionChangeItems(changeSet) : { review: [], ready: [] }),
    [changeSet],
  );

  if (loadState === 'loading') {
    return (
      <div className="card p-6 space-y-3" aria-busy="true" aria-live="polite">
        <div className="flex items-center gap-3 text-sm text-foreground">
          <Loader2 className="w-5 h-5 animate-spin text-accent-primary flex-shrink-0" />
          <p>CV received. Checking what changed since your previous accepted CV…</p>
        </div>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="card p-4 space-y-3 border-error/30">
        <p className="text-sm text-error">{error ?? 'Could not load changes'}</p>
        <button type="button" className="btn-secondary text-sm px-3 py-1.5" onClick={() => void load()}>
          Try again
        </button>
      </div>
    );
  }

  if (!changeSet) {
    return (
      <div className="card p-4 text-sm text-muted">
        Change review is not ready yet. Parsing may still be in progress.
      </div>
    );
  }

  return (
    <section className="card p-4 space-y-5" aria-labelledby="cv-update-heading">
      <div>
        <h2 id="cv-update-heading" className="text-lg font-semibold text-foreground">
          Review CV updates
        </h2>
        <p className="text-xs text-muted mt-1">
          Review what changed in this CV compared with your previous accepted version and the current website.
        </p>
      </div>

      <SummaryStrip changeSet={changeSet} />

      {error ? <p className="text-sm text-error">{error}</p> : null}
      {saveMsg ? <p className="text-sm text-success">{saveMsg}</p> : null}

      {changeSet.unknownSections.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Unrecognized sections</h3>
          {changeSet.unknownSections.map((section) => (
            <ProfessorUnknownSectionCard
              key={section.sectionId}
              section={section}
              decision={decisions[`change:unknown_section:${section.sectionId}`]}
              onDecide={setDecision}
            />
          ))}
        </div>
      ) : null}

      <ChangeBucket title="Needs your review" count={buckets.review.length} defaultOpen>
        {renderChangeCards(buckets.review, decisions, setDecision)}
      </ChangeBucket>

      <ChangeBucket
        title="Ready to apply"
        count={buckets.ready.length}
        defaultOpen={buckets.ready.length <= 8}
      >
        {renderChangeCards(buckets.ready, decisions, setDecision)}
      </ChangeBucket>

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-primary/10">
        <button
          type="button"
          className="btn-secondary text-sm px-4 py-2 disabled:opacity-40"
          disabled={saving || decisionList.length === 0}
          onClick={() => void saveDecisions()}
        >
          {saving ? 'Saving…' : 'Save choices'}
        </button>
        <button
          type="button"
          className="btn-primary text-sm px-4 py-2 disabled:opacity-40"
          disabled={merging || saving}
          onClick={() => void handleApply()}
        >
          {merging ? 'Applying…' : 'Apply approved changes to draft'}
        </button>
        <Link href="/admin/content" className="text-sm text-accent-primary hover:underline">
          Preview draft
        </Link>
        {hasDraft ? (
          <span className="text-xs text-muted">A working draft already exists — apply will update it.</span>
        ) : null}
      </div>
    </section>
  );
}