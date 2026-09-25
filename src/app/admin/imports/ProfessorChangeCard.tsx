'use client';

import React, { useState } from 'react';

import {
  CHANGE_INPUT_CLASS,
  displayChangeValue,
  editableKeysFor,
  fieldLabel,
  isPlainStringValue,
  isStructuredChangeObject,
  mergeEditedObject,
  objectDraftFromValue,
  type EditableObjectKey,
} from './professorChangeFormat';
import {
  formatChangeValue,
  type ProfessorChangeItem,
  type ProfessorLocalDecision,
} from './professorCvUpdateTypes';

type Props = {
  item: ProfessorChangeItem;
  decision: ProfessorLocalDecision | undefined;
  onDecide: (decision: ProfessorLocalDecision) => void;
};

const ACTION_LABELS: Record<string, string> = {
  accept: 'Accept',
  keep_website: 'Keep current website value',
  edit: 'Edit',
  ignore: 'Ignore',
  lock_website: 'Keep current website value',
};

export function ProfessorChangeCard({ item, decision, onDecide }: Props) {
  const baseCandidate = item.candidateValue;
  const objectEdit = isStructuredChangeObject(baseCandidate);
  const [editing, setEditing] = useState(false);
  const [stringDraft, setStringDraft] = useState(() =>
    isPlainStringValue(baseCandidate) ? baseCandidate : formatChangeValue(baseCandidate),
  );
  const [objectDraft, setObjectDraft] = useState(() => objectDraftFromValue(baseCandidate));

  const selected = decision?.action;
  const lockFuture = Boolean(decision?.lockForFutureImports) || selected === 'lock_website';

  const choose = (action: ProfessorLocalDecision['action'], extra?: Partial<ProfessorLocalDecision>) => {
    onDecide({ changeId: item.id, action, ...extra });
  };

  const beginEdit = () => {
    const source = decision?.editedValue ?? item.candidateValue;
    if (objectEdit) {
      setObjectDraft(objectDraftFromValue(source));
    } else {
      setStringDraft(isPlainStringValue(source) ? source : formatChangeValue(source));
    }
    setEditing(true);
  };

  const saveEdit = () => {
    if (objectEdit) {
      choose('edit', { editedValue: mergeEditedObject(item.candidateValue, objectDraft) });
    } else {
      choose('edit', { editedValue: stringDraft });
    }
    setEditing(false);
  };

  const setObjectField = (key: EditableObjectKey, value: string) => {
    setObjectDraft((prev) => ({ ...prev, [key]: value }));
  };

  const editKeys: EditableObjectKey[] = objectEdit
    ? editableKeysFor(isStructuredChangeObject(baseCandidate) ? baseCandidate : {})
    : [];

  return (
    <article
      className="rounded-md border border-primary/15 bg-surface-secondary/40 p-3 space-y-3"
      aria-labelledby={`change-${item.id}-label`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 id={`change-${item.id}-label`} className="text-sm font-medium text-foreground">
            {item.label}
          </h4>
          <p className="text-xs text-muted mt-0.5">{item.summary}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {item.safelyPrepared ? (
            <span className="rounded border border-success/35 bg-success/10 px-1.5 py-0.5 text-foreground">
              Safely prepared
            </span>
          ) : null}
          {item.requiresReview ? (
            <span className="rounded border border-warning/40 bg-warning/10 px-1.5 py-0.5 text-foreground">
              Needs review
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 text-xs">
        <div className="rounded border border-primary/10 bg-background/50 p-2">
          <p className="text-muted mb-1 font-medium">Previous / website</p>
          <pre className="whitespace-pre-wrap break-words font-sans text-foreground">
            {displayChangeValue(item.websiteValue ?? item.previousCvValue)}
          </pre>
        </div>
        <div className="rounded border border-primary/10 bg-background/50 p-2">
          <p className="text-muted mb-1 font-medium">From this CV</p>
          <pre className="whitespace-pre-wrap break-words font-sans text-foreground">
            {displayChangeValue(item.candidateValue)}
          </pre>
        </div>
      </div>

      {item.warnings.length > 0 ? (
        <ul className="list-disc pl-4 text-xs text-warning space-y-0.5">
          {item.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      {editing ? (
        <div className="space-y-2">
          {objectEdit ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {editKeys.map((key) => (
                <label key={key} className="block text-xs text-muted space-y-1">
                  <span>{fieldLabel(key)}</span>
                  <input
                    type="text"
                    className={CHANGE_INPUT_CLASS}
                    aria-label={fieldLabel(key)}
                    value={objectDraft[key]}
                    onChange={(e) => setObjectField(key, e.target.value)}
                  />
                </label>
              ))}
            </div>
          ) : (
            <>
              <label className="block text-xs text-muted" htmlFor={`edit-${item.id}`}>
                Edited value
              </label>
              <textarea
                id={`edit-${item.id}`}
                className={CHANGE_INPUT_CLASS}
                rows={4}
                value={stringDraft}
                onChange={(e) => setStringDraft(e.target.value)}
              />
            </>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary text-xs px-3 py-1.5" onClick={saveEdit}>
              Save edit
            </button>
            <button type="button" className="btn-secondary text-xs px-3 py-1.5" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2" role="group" aria-label={`Actions for ${item.label}`}>
          {(['accept', 'keep_website', 'edit', 'ignore'] as const).map((action) => (
            <button
              key={action}
              type="button"
              className={`text-xs px-3 py-1.5 rounded border ${
                selected === action || (action === 'keep_website' && selected === 'lock_website')
                  ? 'border-accent-primary bg-accent-primary/10 text-foreground'
                  : 'border-primary/20 bg-surface-secondary text-foreground hover:border-primary/40'
              }`}
              onClick={() => {
                if (action === 'edit') {
                  beginEdit();
                  return;
                }
                choose(action, action === 'keep_website' ? { lockForFutureImports: lockFuture } : undefined);
              }}
            >
              {ACTION_LABELS[action]}
            </button>
          ))}
        </div>
      )}

      {selected === 'keep_website' || selected === 'lock_website' ? (
        <label className="flex items-start gap-2 text-xs text-foreground">
          <input
            type="checkbox"
            checked={lockFuture}
            onChange={(e) => choose('keep_website', { lockForFutureImports: e.target.checked })}
          />
          <span>Keep this website value for future CV imports</span>
        </label>
      ) : null}

      {selected ? (
        <p className="text-[11px] text-muted" aria-live="polite">
          Choice: {ACTION_LABELS[selected] ?? selected}
          {selected === 'edit' && decision?.editedValue !== undefined && decision?.editedValue !== null
            ? ` — ${displayChangeValue(decision.editedValue).slice(0, 80)}`
            : ''}
        </p>
      ) : null}
    </article>
  );
}