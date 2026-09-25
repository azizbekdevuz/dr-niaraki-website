'use client';

import { AlertTriangle } from 'lucide-react';
import React, { useMemo } from 'react';

import { ReviewableStringList } from '@/components/shared/ReviewableStringList';
import { classifyProfessorImportWarnings } from '@/server/imports/cvUpdate/professorWarningFilter';

import type { ReviewPayloadModel } from './importDetailTypes';

export function ImportReviewWarningsPanel({ review }: { review: ReviewPayloadModel }) {
  const classified = useMemo(
    () => classifyProfessorImportWarnings(review.warnings),
    [review.warnings],
  );

  if (classified.active.length === 0 && classified.resolvedSummary.length === 0) {
    return null;
  }

  const activeItems = classified.active.map((w) => (w.code ? `${w.code}: ${w.message}` : w.message));

  return (
    <div className="card border-warning/40 bg-warning/5 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <p className="font-medium text-foreground">Import review warnings</p>
          <p className="text-xs text-muted">Only items that may need your decision.</p>
        </div>
      </div>
      {activeItems.length > 0 ? (
        <ReviewableStringList title="Needs attention" items={activeItems} itemLabel="warnings" />
      ) : (
        <p className="text-sm text-foreground">No unresolved warnings requiring a decision.</p>
      )}
      {classified.resolvedSummary.length > 0 ? (
        <div className="rounded border border-primary/15 bg-surface-secondary/50 p-2 text-xs text-muted">
          <p className="font-medium text-foreground mb-1">Automatically resolved</p>
          <ul className="list-disc pl-4 space-y-0.5">
            {classified.resolvedSummary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
