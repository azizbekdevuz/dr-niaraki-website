/**
 * Structured duration instrumentation for CV import operations.
 * Logs safe counts only — never CV body text or secrets.
 */

export type ImportOpName =
  | 'upload_storage'
  | 'docx_extraction'
  | 'deterministic_parsing'
  | 'candidate_construction'
  | 'baseline_lookup'
  | 'change_set_generation'
  | 'reconciliation_generation'
  | 'import_detail_loading'
  | 'approval_persistence'
  | 'change_decision_persistence'
  | 'ai_review'
  | 'merge_create_draft';

export type ImportOpOutcome = 'ok' | 'error' | 'skipped';

export function logImportOperation(input: {
  importId?: string | null;
  operation: ImportOpName;
  durationMs: number;
  outcome: ImportOpOutcome;
  counts?: Record<string, number | boolean | string | null | undefined>;
}): void {
  const safeCounts: Record<string, number | boolean | string | null> = {};
  if (input.counts) {
    for (const [k, v] of Object.entries(input.counts)) {
      if (v === undefined) {continue;}
      if (typeof v === 'string' && v.length > 120) {
        safeCounts[k] = `${v.slice(0, 117)}...`;
      } else {
        safeCounts[k] = v as number | boolean | string | null;
      }
    }
  }
  console.warn(
    JSON.stringify({
      event: 'import_operation_timing',
      importId: input.importId ?? null,
      operation: input.operation,
      durationMs: input.durationMs,
      outcome: input.outcome,
      counts: safeCounts,
    }),
  );
}

export async function withImportOperationTiming<T>(
  input: {
    importId?: string | null;
    operation: ImportOpName;
    counts?: Record<string, number | boolean | string | null | undefined>;
  },
  fn: () => Promise<T>,
): Promise<T> {
  const started = Date.now();
  try {
    const result = await fn();
    logImportOperation({
      importId: input.importId,
      operation: input.operation,
      durationMs: Date.now() - started,
      outcome: 'ok',
      counts: input.counts,
    });
    return result;
  } catch (err) {
    logImportOperation({
      importId: input.importId,
      operation: input.operation,
      durationMs: Date.now() - started,
      outcome: 'error',
      counts: {
        ...input.counts,
        errorName: err instanceof Error ? err.name : 'unknown',
      },
    });
    throw err;
  }
}

export function withImportOperationTimingSync<T>(
  input: {
    importId?: string | null;
    operation: ImportOpName;
    counts?: Record<string, number | boolean | string | null | undefined>;
  },
  fn: () => T,
): T {
  const started = Date.now();
  try {
    const result = fn();
    logImportOperation({
      importId: input.importId,
      operation: input.operation,
      durationMs: Date.now() - started,
      outcome: 'ok',
      counts: input.counts,
    });
    return result;
  } catch (err) {
    logImportOperation({
      importId: input.importId,
      operation: input.operation,
      durationMs: Date.now() - started,
      outcome: 'error',
      counts: {
        ...input.counts,
        errorName: err instanceof Error ? err.name : 'unknown',
      },
    });
    throw err;
  }
}
