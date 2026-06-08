'use client';

import React, { useMemo, useState } from 'react';

import type {
  ImportDetailModel,
  ImportMergeSafetyModel,
  ImportMergeSectionRiskLabel,
  ImportMergeSectionSafetyModel,
  ReviewPayloadModel,
} from './importDetailTypes';

type Props = {
  imp: ImportDetailModel;
  review: ReviewPayloadModel | null;
  hasDraft: boolean;
  merging: boolean;
  onMerge: (
    action: 'create' | 'replace',
    opts: { mergeMode: 'safe_update' | 'full_replace'; acknowledgeHighRisk: boolean },
  ) => void;
};

function riskBadgeClass(risk: ImportMergeSectionRiskLabel): string {
  switch (risk) {
    case 'safe_to_merge':
      return 'border-success/40 bg-success/10 text-foreground';
    case 'needs_review':
      return 'border-warning/45 bg-warning/10 text-foreground';
    case 'review_only_default':
      return 'border-warning/50 bg-warning/[0.12] text-foreground';
    case 'requires_explicit_replace':
      return 'border-error/40 bg-error/10 text-foreground';
    default:
      return 'border-primary/20 bg-surface-secondary text-foreground';
  }
}

function ReviewHintBanner({ hint }: { hint: string | undefined }) {
  const show = hint === 'NEEDS_REVIEW' || hint === 'RAW_CHANGED_ONLY';
  if (!show) {
    return null;
  }
  return (
    <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground">
      <strong className="text-warning">Review recommended:</strong> envelope <code className="font-mono">reviewHint</code> is{' '}
      <code className="font-mono">{hint}</code>. Inspect parser warnings, count checks, and structured diffs before merging.
    </div>
  );
}

function MergeSafetyNotes({ notes }: { notes: readonly string[] }) {
  if (notes.length === 0) {
    return null;
  }
  return (
    <ul className="list-disc space-y-1 pl-5 text-xs text-muted">
      {notes.map((n) => (
        <li key={n}>{n}</li>
      ))}
    </ul>
  );
}

function MergeSafetySectionTable({ sections }: { sections: readonly ImportMergeSectionSafetyModel[] }) {
  return (
    <div className="max-h-48 overflow-y-auto rounded-md border border-primary/15">
      <table className="w-full text-left text-[11px]">
        <thead className="sticky top-0 bg-surface-secondary text-muted">
          <tr>
            <th className="px-2 py-1 font-medium">Section</th>
            <th className="px-2 py-1 font-medium">Risk</th>
            <th className="px-2 py-1 font-medium">Safe merge</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((s) => (
            <tr key={s.id} className="border-t border-primary/10 align-top">
              <td className="px-2 py-1 text-foreground">{s.title}</td>
              <td className="px-2 py-1">
                <span className={`inline-block rounded border px-1.5 py-0.5 ${riskBadgeClass(s.risk)}`}>{s.risk}</span>
              </td>
              <td className="px-2 py-1 text-muted">{s.includeInSafeMerge ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type MergeModeControlsProps = {
  safety: ImportMergeSafetyModel;
  mergeMode: 'safe_update' | 'full_replace';
  setMergeMode: (m: 'safe_update' | 'full_replace') => void;
  acknowledgeHighRisk: boolean;
  setAcknowledgeHighRisk: (v: boolean) => void;
  needsAck: boolean;
  fullReplaceBlocked: boolean;
};

function MergeModeControls({
  safety,
  mergeMode,
  setMergeMode,
  acknowledgeHighRisk,
  setAcknowledgeHighRisk,
  needsAck,
  fullReplaceBlocked,
}: MergeModeControlsProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Merge safety (working draft baseline)</p>
      <MergeSafetyNotes notes={safety.notes} />
      <MergeSafetySectionTable sections={safety.sections} />
      <div className="flex flex-col gap-2 text-xs text-muted">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="mergeMode"
            checked={mergeMode === 'safe_update'}
            onChange={() => {
              setMergeMode('safe_update');
              setAcknowledgeHighRisk(false);
            }}
          />
          <span>
            <strong className="text-foreground">Safe update (default)</strong> — skips list sections marked “No” above;
            profile/summary still merge when allowed.
          </span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="mergeMode"
            checked={mergeMode === 'full_replace'}
            onChange={() => setMergeMode('full_replace')}
          />
          <span>
            <strong className="text-foreground">Full replace</strong> — maps all import lists into the draft like before.
            {needsAck ? ' Requires acknowledgement below.' : ''}
          </span>
        </label>
        {mergeMode === 'full_replace' && needsAck ? (
          <label className="ml-6 flex items-start gap-2 rounded border border-warning/35 bg-warning/5 p-2 text-foreground">
            <input type="checkbox" checked={acknowledgeHighRisk} onChange={(e) => setAcknowledgeHighRisk(e.target.checked)} />
            <span>I understand this can overwrite curated lists (publications, patents, experience, etc.) and may remove site content.</span>
          </label>
        ) : null}
        {fullReplaceBlocked ? (
          <p className="text-warning">Choose acknowledgement to enable full replace, or stay on safe update.</p>
        ) : null}
      </div>
    </div>
  );
}

export function ImportMergeDraftCard({ imp, review, hasDraft, merging, onMerge }: Props) {
  const hint = imp.candidateReview?.reviewHint;
  const [mergeMode, setMergeMode] = useState<'safe_update' | 'full_replace'>('safe_update');
  const [acknowledgeHighRisk, setAcknowledgeHighRisk] = useState(false);

  const safety = review?.mergeSafety;
  const needsAck = Boolean(safety?.fullReplaceRequiresAck);
  const fullReplaceBlocked = mergeMode === 'full_replace' && needsAck && !acknowledgeHighRisk;

  const mergeOpts = useMemo(
    () => ({ mergeMode, acknowledgeHighRisk: mergeMode === 'full_replace' && acknowledgeHighRisk }),
    [mergeMode, acknowledgeHighRisk],
  );

  return (
    <div className="card p-4 space-y-3">
      <ReviewHintBanner hint={hint} />

      {safety ? (
        <MergeModeControls
          safety={safety}
          mergeMode={mergeMode}
          setMergeMode={setMergeMode}
          acknowledgeHighRisk={acknowledgeHighRisk}
          setAcknowledgeHighRisk={setAcknowledgeHighRisk}
          needsAck={needsAck}
          fullReplaceBlocked={fullReplaceBlocked}
        />
      ) : null}

      <p className="font-medium text-foreground">Merge into working draft</p>
      <p className="text-xs text-muted">
        Creates or replaces the <strong>working draft</strong> only. Does not publish. Imports already merged cannot merge
        again. If a draft already exists, use <strong>Replace</strong> only when you intend to overwrite the whole draft
        payload.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={merging || hasDraft || imp.status === 'MERGED' || fullReplaceBlocked}
          onClick={() => onMerge('create', mergeOpts)}
          className="btn-primary px-4 py-2 text-sm disabled:opacity-40"
        >
          Create draft from import
        </button>
        <button
          type="button"
          disabled={merging || !hasDraft || imp.status === 'MERGED' || fullReplaceBlocked}
          onClick={() => onMerge('replace', mergeOpts)}
          className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
        >
          Replace current draft
        </button>
      </div>
      {!hasDraft ? (
        <p className="text-xs text-muted">No working draft yet — use &quot;Create&quot; first.</p>
      ) : (
        <p className="text-xs text-muted">
          A draft exists — &quot;Replace&quot; overwrites the working draft with the mapped import (still not published).
        </p>
      )}
    </div>
  );
}
