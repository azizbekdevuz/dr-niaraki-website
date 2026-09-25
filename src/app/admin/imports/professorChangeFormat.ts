/**
 * Human-readable display/edit helpers for professor CV change cards.
 */

import { formatChangeValue } from './professorCvUpdateTypes';

/** Shared theme-token form control (matches `.form-input` / merge override textarea). */
export const CHANGE_INPUT_CLASS =
  'form-input w-full rounded-lg border border-primary bg-surface-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/40 disabled:opacity-50';

const FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  year: 'Year',
  organization: 'Organization',
  status: 'Status',
  country: 'Country',
  authors: 'Authors',
  journal: 'Journal',
  doi: 'DOI',
  details: 'Details',
  number: 'Number',
  date: 'Date',
  inventors: 'Inventors',
  type: 'Type',
  impact: 'Impact',
  category: 'Category',
};

/** Keys shown as labeled inputs when editing structured list items. */
export const EDITABLE_OBJECT_KEYS = [
  'title',
  'year',
  'organization',
  'status',
  'country',
  'authors',
  'journal',
  'doi',
  'details',
] as const;

export type EditableObjectKey = (typeof EDITABLE_OBJECT_KEYS)[number];

const KNOWN_STRUCTURE_KEYS = new Set<string>([
  ...EDITABLE_OBJECT_KEYS,
  'number',
  'date',
  'inventors',
  'type',
  'impact',
  'category',
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isPlainStringValue(value: unknown): value is string {
  return typeof value === 'string';
}

/** True when value looks like an award / patent / publication-style object. */
export function isStructuredChangeObject(value: unknown): value is Record<string, unknown> {
  if (!isPlainObject(value)) {return false;}
  return Object.keys(value).some((k) => KNOWN_STRUCTURE_KEYS.has(k));
}

export function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

/** Prefer key: value lines; fall back to formatChangeValue for scalars / unknown shapes. */
export function displayChangeValue(value: unknown): string {
  if (isPlainStringValue(value)) {
    return value.length > 0 ? value : '—';
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'undefined' || Object.is(value, null)) {
    return '—';
  }
  if (isPlainObject(value)) {
    const keys = Object.keys(value).filter((k) => k !== 'id');
    if (keys.length === 0) {return '—';}
    const preferred = [
      'title',
      'year',
      'organization',
      'status',
      'country',
      'authors',
      'journal',
      'doi',
      'details',
      'number',
      'date',
      'inventors',
    ];
    const ordered = [
      ...preferred.filter((k) => keys.includes(k)),
      ...keys.filter((k) => !preferred.includes(k)),
    ];
    const lines = ordered.map((k) => {
      const raw = value[k];
      const shown =
        typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean'
          ? String(raw)
          : formatChangeValue(raw);
      return `${fieldLabel(k)}: ${shown}`;
    });
    return lines.join('\n');
  }
  return formatChangeValue(value);
}

export function editableKeysFor(value: Record<string, unknown>): EditableObjectKey[] {
  const present = EDITABLE_OBJECT_KEYS.filter((k) => k in value);
  return present.length > 0 ? present : ['title', 'year', 'details'];
}

export function objectDraftFromValue(value: unknown): Record<EditableObjectKey, string> {
  const src = isPlainObject(value) ? value : {};
  const draft = {} as Record<EditableObjectKey, string>;
  for (const key of EDITABLE_OBJECT_KEYS) {
    const v = src[key];
    draft[key] =
      typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v) : '';
  }
  return draft;
}

/** Merge edited fields onto the original candidate object (preserve id and other keys). */
export function mergeEditedObject(
  original: unknown,
  draft: Record<EditableObjectKey, string>,
): Record<string, unknown> {
  const base = isPlainObject(original) ? { ...original } : {};
  for (const key of EDITABLE_OBJECT_KEYS) {
    const next = draft[key].trim();
    if (next.length > 0 || key in base) {
      const prev = base[key];
      if (typeof prev === 'number' && next !== '' && !Number.isNaN(Number(next))) {
        base[key] = Number(next);
      } else {
        base[key] = next;
      }
    }
  }
  return base;
}
