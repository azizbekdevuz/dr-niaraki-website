/**
 * Filter professor-facing import warnings: successful recoveries become resolved diagnostics.
 */

export type ClassifiedImportWarning = {
  message: string;
  code?: string;
  path?: string;
  severity: 'info' | 'warning' | 'error';
  /** When true, show only under Advanced technical details. */
  resolvedDiagnostic: boolean;
};

const UNCLEAR_TITLE_RE = /Publication (\d+): title unclear/i;
const RECOVERED_TITLE_RE = /Publication (\d+): recovered truncated title/i;
const REMOVED_DUP_RE = /Removed duplicate publication/i;
const PREAMBLE_WARNING_RE = /Unrecognized section:\s*"?Preamble"?/i;

/**
 * Pair "title unclear" with successful recovery for the same publication index.
 * Recovered items drop the active unclear warning and keep a resolved diagnostic summary.
 * Preamble is document header evidence — not an active professor warning.
 */
export function classifyProfessorImportWarnings(
  warnings: ReadonlyArray<{ message: string; code?: string; path?: string; severity?: string }>,
): {
  active: ClassifiedImportWarning[];
  resolved: ClassifiedImportWarning[];
  resolvedSummary: string[];
} {
  const recoveredIndexes = new Set<number>();
  for (const w of warnings) {
    const m = w.message.match(RECOVERED_TITLE_RE);
    if (m) {
      recoveredIndexes.add(Number(m[1]));
    }
  }

  const active: ClassifiedImportWarning[] = [];
  const resolved: ClassifiedImportWarning[] = [];
  let recoveredCount = 0;
  let dedupCount = 0;
  let preambleConsumed = 0;

  for (const w of warnings) {
    if (PREAMBLE_WARNING_RE.test(w.message)) {
      preambleConsumed += 1;
      resolved.push({
        message: w.message,
        code: w.code,
        path: w.path,
        severity: 'info',
        resolvedDiagnostic: true,
      });
      continue;
    }
    const unclear = w.message.match(UNCLEAR_TITLE_RE);
    if (unclear && recoveredIndexes.has(Number(unclear[1]))) {
      continue;
    }
    if (RECOVERED_TITLE_RE.test(w.message)) {
      recoveredCount += 1;
      resolved.push({
        message: w.message,
        code: w.code,
        path: w.path,
        severity: 'info',
        resolvedDiagnostic: true,
      });
      continue;
    }
    if (REMOVED_DUP_RE.test(w.message)) {
      dedupCount += 1;
      resolved.push({
        message: w.message,
        code: w.code,
        path: w.path,
        severity: 'info',
        resolvedDiagnostic: true,
      });
      continue;
    }
    active.push({
      message: w.message,
      code: w.code,
      path: w.path,
      severity: (w.severity as 'info' | 'warning' | 'error') || 'warning',
      resolvedDiagnostic: false,
    });
  }

  const resolvedSummary: string[] = [];
  if (preambleConsumed > 0) {
    resolvedSummary.push('CV header (Preamble) used as identity/contact source evidence');
  }
  if (recoveredCount > 0) {
    resolvedSummary.push(
      `${recoveredCount} publication title${recoveredCount === 1 ? ' was' : 's were'} automatically recovered`,
    );
  }
  if (dedupCount > 0) {
    resolvedSummary.push(
      `${dedupCount} duplicate publication${dedupCount === 1 ? ' was' : 's were'} removed automatically`,
    );
  }

  return { active, resolved, resolvedSummary };
}
