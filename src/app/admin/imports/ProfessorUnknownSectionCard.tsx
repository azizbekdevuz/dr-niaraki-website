'use client';

import React, { useState } from 'react';

import type {
  ProfessorLocalDecision,
  ProfessorUnknownSection,
  UnknownSectionPresentation,
} from './professorCvUpdateTypes';

type Props = {
  section: ProfessorUnknownSection;
  decision: ProfessorLocalDecision | undefined;
  onDecide: (decision: ProfessorLocalDecision) => void;
};

const OPTIONS: Array<{ value: UnknownSectionPresentation; label: string }> = [
  { value: 'RICH_TEXT', label: 'Rich text' },
  { value: 'BULLET_LIST', label: 'List' },
  { value: 'TIMELINE', label: 'Timeline' },
  { value: 'GROUPED_CARDS', label: 'Cards' },
  { value: 'KEEP_IN_CV', label: 'Keep in CV only' },
  { value: 'IGNORE', label: 'Ignore' },
];

const PRESENTATIONS_SET = new Set<string>(OPTIONS.map((o) => o.value));

function changeIdFor(section: ProfessorUnknownSection): string {
  return `change:unknown_section:${section.sectionId}`;
}

export function ProfessorUnknownSectionCard({ section, decision, onDecide }: Props) {
  const [title, setTitle] = useState(section.sourceTitle);
  const edited = decision?.editedValue as
    | { presentation?: UnknownSectionPresentation; displayTitle?: string; sourceTitle?: string }
    | undefined;
  const remembered = section.rememberedPresentation;
  const presentation: UnknownSectionPresentation | '' =
    edited?.presentation ??
    (remembered && PRESENTATIONS_SET.has(remembered as UnknownSectionPresentation)
      ? (remembered as UnknownSectionPresentation)
      : '');

  const apply = (next: UnknownSectionPresentation) => {
    const action = next === 'IGNORE' ? 'ignore' : 'accept';
    onDecide({
      changeId: changeIdFor(section),
      action,
      editedValue: {
        presentation: next,
        displayTitle: title.trim() || section.sourceTitle,
        sourceTitle: section.sourceTitle,
      },
    });
  };

  return (
    <article className="rounded-md border border-warning/30 bg-warning/5 p-3 space-y-3">
      <div>
        <h4 className="text-sm font-medium text-foreground">New section in CV</h4>
        <p className="text-xs text-muted mt-0.5">
          Choose how to show “{section.sourceTitle}” on the website, or keep it in the CV only.
        </p>
      </div>
      {section.textPreview ? (
        <pre className="text-xs whitespace-pre-wrap break-words rounded border border-primary/10 bg-background/50 p-2 font-sans text-foreground max-h-28 overflow-y-auto">
          {section.textPreview}
        </pre>
      ) : null}
      <label className="block text-xs text-muted" htmlFor={`unk-title-${section.sectionId}`}>
        Display title
      </label>
      <input
        id={`unk-title-${section.sectionId}`}
        className="input w-full text-sm"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (presentation) {
            onDecide({
              changeId: changeIdFor(section),
              action: presentation === 'IGNORE' ? 'ignore' : 'accept',
              editedValue: {
                presentation,
                displayTitle: e.target.value.trim() || section.sourceTitle,
                sourceTitle: section.sourceTitle,
              },
            });
          }
        }}
      />
      <div className="flex flex-wrap gap-2" role="group" aria-label="How to present this section">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`text-xs px-3 py-1.5 rounded border ${
              presentation === opt.value
                ? 'border-accent-primary bg-accent-primary/10 text-foreground'
                : 'border-primary/20 bg-surface-secondary text-foreground'
            }`}
            onClick={() => apply(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </article>
  );
}
