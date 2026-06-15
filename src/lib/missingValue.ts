/** Shared missing-value detection for merge output and public UI. */

const PLACEHOLDER_DASHES = new Set(['—', '\u2014', '-', '–', '\u2013']);
const SCHEMA_PLACEHOLDER = '\u2014';

export function isPlaceholderDisplayValue(value: string | null | undefined): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  const t = value.trim();
  if (!t) {
    return true;
  }
  return PLACEHOLDER_DASHES.has(t);
}

export function displayOrNull(value: string | null | undefined): string | null {
  if (isPlaceholderDisplayValue(value)) {
    return null;
  }
  return value!.trim();
}

/** Schema fields require min(1); use em dash internally when source value is absent. */
export function mergeRequiredField(value: string | null | undefined): string {
  const t = displayOrNull(value);
  return t ?? SCHEMA_PLACEHOLDER;
}
