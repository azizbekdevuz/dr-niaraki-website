'use client';

import React from 'react';

import { ProfessorChangeCard } from './ProfessorChangeCard';
import type {
  ProfessorChangeItem,
  ProfessorChangeSet,
  ProfessorLocalDecision,
} from './professorCvUpdateTypes';

export function uniqueSectionLabels(changeSet: ProfessorChangeSet): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const section of changeSet.sectionSummaries) {
    if (section.changes <= 0 || seen.has(section.label)) {continue;}
    seen.add(section.label);
    labels.push(section.label);
  }
  return labels;
}

export function SummaryStrip({ changeSet }: { changeSet: ProfessorChangeSet }) {
  const { summary } = changeSet;
  if (summary.noWebsiteRelevantChanges || summary.totalChanges === 0) {
    return (
      <div className="rounded-md border border-success/35 bg-success/5 px-3 py-3 text-sm text-foreground">
        No website-relevant changes detected
      </div>
    );
  }
  const sectionLabels = uniqueSectionLabels(changeSet);
  return (
    <div className="rounded-md border border-primary/15 bg-surface-secondary/50 px-3 py-3 text-sm text-foreground space-y-1">
      <p>
        <strong>{summary.totalChanges}</strong> change{summary.totalChanges === 1 ? '' : 's'}
        {summary.safelyPrepared > 0 ? (
          <>
            {' '}
            · <strong>{summary.safelyPrepared}</strong> safely prepared
          </>
        ) : null}
        {summary.requiresReview > 0 ? (
          <>
            {' '}
            · <strong>{summary.requiresReview}</strong> need review
          </>
        ) : null}
      </p>
      {sectionLabels.length > 0 ? (
        <p className="text-xs text-muted">Sections with changes: {sectionLabels.join(', ')}</p>
      ) : null}
      <p className="text-xs text-muted">
        {summary.unchangedItemCount} unchanged item{summary.unchangedItemCount === 1 ? '' : 's'}
      </p>
    </div>
  );
}

export function ChangeBucket({
  title,
  count,
  defaultOpen,
  children,
}: {
  title: string;
  count: number;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  if (count === 0) {return null;}
  return (
    <details
      open={open}
      onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}
      className="space-y-3 rounded-md border border-primary/10 p-3"
    >
      <summary className="cursor-pointer text-sm font-medium text-foreground list-none flex items-center justify-between gap-2">
        <span>
          {title}
          <span className="ml-2 font-normal text-xs text-muted">({count})</span>
        </span>
      </summary>
      <div className="space-y-3 pt-2">{children}</div>
    </details>
  );
}

export function renderChangeCards(
  items: ProfessorChangeItem[],
  decisions: Record<string, ProfessorLocalDecision>,
  onDecide: (d: ProfessorLocalDecision) => void,
) {
  return items.map((item) => (
    <ProfessorChangeCard key={item.id} item={item} decision={decisions[item.id]} onDecide={onDecide} />
  ));
}

export function partitionChangeItems(
  changeSet: ProfessorChangeSet,
): { review: ProfessorChangeItem[]; ready: ProfessorChangeItem[] } {
  const unknownIds = new Set(
    changeSet.unknownSections.map((s) => `change:unknown_section:${s.sectionId}`),
  );
  const review: ProfessorChangeItem[] = [];
  const ready: ProfessorChangeItem[] = [];
  for (const item of changeSet.items) {
    if (unknownIds.has(item.id)) {continue;}
    if (item.requiresReview || !item.safelyPrepared) {
      review.push(item);
    } else {
      ready.push(item);
    }
  }
  return { review, ready };
}