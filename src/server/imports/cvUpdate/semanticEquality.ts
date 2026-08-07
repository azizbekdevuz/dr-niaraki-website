/**
 * Canonical semantic normalization/equality for CV change detection.
 * Excludes generated IDs, raw source, and other non-website fields.
 */

import { createHash } from 'node:crypto';

import { normalizeReviewTitle } from '@/server/imports/candidateReviewIdentity';

/** v3: rehydrate stored baseline list payloads so numeric years match string years. */
export const CV_CHANGE_ALGORITHM_VERSION = 3 as const;

const COUNTRY_ALIASES: Record<string, string> = {
  kr: 'korea',
  korea: 'korea',
  'south korea': 'korea',
  'republic of korea': 'korea',
  us: 'united states',
  usa: 'united states',
  'united states': 'united states',
  'united states of america': 'united states',
  jp: 'japan',
  japan: 'japan',
  cn: 'china',
  china: 'china',
  eu: 'europe',
  europe: 'europe',
  international: 'international',
};

const PATENT_TYPE_ALIASES: Record<string, string> = {
  korean: 'korean',
  international: 'international',
  other: 'other',
};

export function normalizeSemanticText(value: unknown): string | null {
  if (value === null || value === undefined) {return null;}
  const raw = typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? String(value)
    : JSON.stringify(value);
  let t = raw
    .normalize('NFKC')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
  // Strip a single layer of wrapping quotes (common in CV patent/publication titles).
  if (
    (t.startsWith('"') && t.endsWith('"') && t.length >= 2) ||
    (t.startsWith("'") && t.endsWith("'") && t.length >= 2)
  ) {
    t = t.slice(1, -1).trim();
  }
  return t.length ? t : null;
}

/** Normalize patent / publication numbers for identity matching (ignore punctuation/case). */
export function normalizeIdentityNumber(value: unknown): string | null {
  const t = normalizeSemanticText(value);
  if (!t) {return null;}
  const compact = t.replace(/[\s,./_-]+/g, '').toLowerCase();
  return compact.length ? compact : null;
}

function normalizeCountry(value: unknown): string | null {
  const t = normalizeSemanticText(value);
  if (!t) {return null;}
  return COUNTRY_ALIASES[t.toLowerCase()] ?? t.toLowerCase();
}

function normalizePatentStatus(value: unknown): string | null {
  const t = normalizeSemanticText(value);
  if (!t) {return null;}
  const lower = t.toLowerCase();

  // Phrase-specific before bare tokens (matches parser determinePatentStatus).
  if (/\b(?:patent\s+)?registration\s+completed\b/.test(lower)) {
    return 'registered';
  }
  if (/\b(?:patent\s+)?application\s+completed\b/.test(lower)) {
    return 'pending';
  }
  if (
    lower === 'registered' ||
    lower === 'granted' ||
    lower === 'issued' ||
    lower.includes('registration completed')
  ) {
    return 'registered';
  }
  if (
    lower === 'pending' ||
    lower === 'under examination' ||
    lower.includes('application completed')
  ) {
    return 'pending';
  }
  if (lower === 'expired') {
    return 'expired';
  }
  if (lower === 'unknown') {
    return 'unknown';
  }
  // Bare "completed" is ambiguous — do not map to registered (would hide Application completed).
  if (lower === 'completed') {
    return 'completed';
  }
  return lower;
}

function normalizePatentType(value: unknown): string | null {
  const t = normalizeSemanticText(value);
  if (!t) {return null;}
  return PATENT_TYPE_ALIASES[t.toLowerCase()] ?? t.toLowerCase();
}

function normalizeYear(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {return null;}
  if (typeof value === 'number' && Number.isFinite(value)) {return String(Math.trunc(value));}
  const t = normalizeSemanticText(value);
  if (!t) {return null;}
  const m = t.match(/\b(19|20)\d{2}\b/);
  return m?.[0] ?? t;
}

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) {return 'null';}
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(',')}]`;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
  }
  return JSON.stringify(String(value));
}

export function semanticFingerprint(payload: unknown): string {
  return createHash('sha256').update(stableStringify(payload)).digest('hex').slice(0, 24);
}

export function semanticEqual(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b);
}

/** Paths that differ between two semantic payloads (for diagnostics/tests). */
export function semanticDiffPaths(a: unknown, b: unknown, prefix = ''): string[] {
  if (semanticEqual(a, b)) {return [];}
  if (a === null || a === undefined || b === null || b === undefined || typeof a !== 'object' || typeof b !== 'object') {
    return [prefix || '(root)'];
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    return [prefix || '(root)'];
  }
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const keys = new Set([...Object.keys(ao), ...Object.keys(bo)]);
  const paths: string[] = [];
  for (const key of [...keys].sort()) {
    const next = prefix ? `${prefix}.${key}` : key;
    paths.push(...semanticDiffPaths(ao[key], bo[key], next));
  }
  return paths.length ? paths : [prefix || '(root)'];
}

export type SemanticPublication = {
  title: string;
  authors: string | null;
  journal: string | null;
  year: string | null;
  type: string | null;
  doi: string | null;
};

export type SemanticPatent = {
  title: string;
  number: string | null;
  country: string | null;
  date: string | null;
  inventors: string | null;
  status: string | null;
  type: string | null;
};

export type SemanticAward = {
  title: string;
  organization: string | null;
  year: string | null;
  details: string | null;
};

export type SemanticEducation = {
  degree: string;
  institution: string;
  year: string | null;
  details: string | null;
};

export type SemanticAppointment = {
  title: string;
  institution: string;
  period: string | null;
  type: string | null;
  details: string | null;
};

export type SemanticProject = {
  title: string;
  description: string | null;
  period: string | null;
  status: string | null;
  role: string | null;
};

export function semanticPublication(input: {
  title?: unknown;
  authors?: unknown;
  journal?: unknown;
  year?: unknown;
  type?: unknown;
  doi?: unknown;
}): SemanticPublication {
  return {
    title: normalizeSemanticText(input.title) ?? '',
    authors: normalizeSemanticText(input.authors),
    journal: normalizeSemanticText(input.journal),
    year: normalizeYear(input.year),
    type: normalizeSemanticText(input.type)?.toLowerCase() ?? null,
    doi: normalizeSemanticText(input.doi)?.toLowerCase() ?? null,
  };
}

export function semanticPatent(input: {
  title?: unknown;
  number?: unknown;
  country?: unknown;
  date?: unknown;
  inventors?: unknown;
  status?: unknown;
  type?: unknown;
}): SemanticPatent {
  return {
    title: normalizeSemanticText(input.title) ?? '',
    number: normalizeSemanticText(input.number),
    country: normalizeCountry(input.country),
    date: normalizeSemanticText(input.date),
    inventors: normalizeSemanticText(input.inventors),
    status: normalizePatentStatus(input.status),
    type: normalizePatentType(input.type),
  };
}

export function semanticAward(input: {
  title?: unknown;
  organization?: unknown;
  year?: unknown;
  details?: unknown;
}): SemanticAward {
  return {
    title: normalizeSemanticText(input.title) ?? '',
    organization: normalizeSemanticText(input.organization),
    year: normalizeYear(input.year),
    details: normalizeSemanticText(input.details),
  };
}

export function semanticEducation(input: {
  degree?: unknown;
  title?: unknown;
  institution?: unknown;
  year?: unknown;
  period?: unknown;
  details?: unknown;
}): SemanticEducation {
  return {
    degree: normalizeSemanticText(input.degree ?? input.title) ?? '',
    institution: normalizeSemanticText(input.institution) ?? '',
    year: normalizeYear(input.year ?? input.period),
    details: normalizeSemanticText(input.details),
  };
}

export function semanticAppointment(input: {
  title?: unknown;
  position?: unknown;
  institution?: unknown;
  period?: unknown;
  duration?: unknown;
  type?: unknown;
  details?: unknown;
}): SemanticAppointment {
  return {
    title: normalizeSemanticText(input.title ?? input.position) ?? '',
    institution: normalizeSemanticText(input.institution) ?? '',
    period: normalizeSemanticText(input.period ?? input.duration),
    type: normalizeSemanticText(input.type)?.toLowerCase() ?? null,
    details: normalizeSemanticText(input.details),
  };
}

export function semanticProject(input: {
  title?: unknown;
  description?: unknown;
  period?: unknown;
  status?: unknown;
  role?: unknown;
}): SemanticProject {
  return {
    title: normalizeSemanticText(input.title) ?? '',
    description: normalizeSemanticText(input.description),
    period: normalizeSemanticText(input.period),
    status: normalizeSemanticText(input.status)?.toLowerCase() ?? null,
    role: normalizeSemanticText(input.role),
  };
}

export function matchTitleKey(title: string): string {
  return normalizeReviewTitle(title);
}

/**
 * Assert helper for tests: modified items must have semantic display diffs.
 */
export function assertModifiedHasSemanticDiff(
  previousPayload: unknown,
  candidatePayload: unknown,
): void {
  if (semanticEqual(previousPayload, candidatePayload)) {
    throw new Error(
      'BUG: modified change item has semantically equal previous/candidate payloads',
    );
  }
}
