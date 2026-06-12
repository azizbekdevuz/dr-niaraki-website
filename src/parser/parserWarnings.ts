import type { ParseWarning } from '@/types/parser';

/**
 * Creates a warning message
 */
export function createWarning(
  field: string,
  message: string,
  severity: ParseWarning['severity'] = 'warning',
  index?: number,
  raw?: string
): ParseWarning {
  return { field, message, severity, index, raw };
}
