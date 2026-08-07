'use client';

import React from 'react';

type Props = {
  children: React.ReactNode;
};

/**
 * Collapsed technical diagnostics — provenance, reconcile, AI, structured diffs, etc.
 */
export function AdvancedTechnicalDetails({ children }: Props) {
  return (
    <details className="card overflow-hidden">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-foreground hover:bg-surface-secondary/60">
        Advanced technical details
        <span className="ml-2 font-normal text-xs text-muted">
          Parser diagnostics, reconciliation, AI assistant, and merge safety internals
        </span>
      </summary>
      <div className="border-t border-primary/10 px-4 py-4 space-y-6">{children}</div>
    </details>
  );
}
