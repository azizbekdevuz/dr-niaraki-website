/** Pure normalization helpers for `mergeCvDetailsIntoSiteContent` — no I/O. */

export function nonEmptyLines(text: string | null | undefined): string[] {
  if (!text?.trim()) {
    return [];
  }
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

export type PublicationSiteType = 'journal' | 'conference' | 'book' | 'other';

/**
 * Maps parser publication types to public site types.
 * Unknown/null/`other` stay `other` — never promoted to journal or book.
 */
export function publicationType(t: string | null | undefined): PublicationSiteType {
  if (t === 'chapter' || t === 'book') {
    return 'book';
  }
  if (t === 'conference') {
    return 'conference';
  }
  if (t === 'journal') {
    return 'journal';
  }
  return 'other';
}

export function normalizedPublicationYear(year: number | null | undefined, ceilingYear: number): number {
  if (typeof year === 'number' && !Number.isNaN(year) && year >= 1900 && year <= ceilingYear) {
    return year;
  }
  return Math.min(ceilingYear, new Date().getFullYear());
}

export function awardImpactFrom(
  detailsText: string | null | undefined,
  raw: string | null | undefined,
  title: string,
  org: string,
  y: string,
): string {
  const body = (raw?.trim() || detailsText?.trim() || '').trim();
  if (body.length > 0) {
    return body.slice(0, 500);
  }
  if (org.trim() && y.trim()) {
    return `${title.trim()} (${org.trim()}, ${y.trim()})`.slice(0, 500);
  }
  return detailsText?.trim().slice(0, 500) || '—';
}

const REGISTRATION_COMPLETED = /\b(?:patent\s+)?registration\s+completed\b/i;

export type PatentSiteStatus = 'registered' | 'pending' | 'unknown' | 'expired';

/**
 * Maps parser patent status to public site status.
 * Null/unsupported values stay `unknown` — never promoted to pending.
 * Legacy `completed` upgrades to registered only when raw proves registration completed.
 */
export function patentStatus(
  s: string | null | undefined,
  raw?: string | null,
): PatentSiteStatus {
  if (s === 'registered') {
    return 'registered';
  }
  if (s === 'pending') {
    return 'pending';
  }
  if (s === 'expired') {
    return 'expired';
  }
  if (s === 'completed') {
    if (raw && REGISTRATION_COMPLETED.test(raw)) {
      return 'registered';
    }
    return 'unknown';
  }
  return 'unknown';
}

export function patentType(t: string | null | undefined): 'international' | 'korean' {
  return t === 'korean' ? 'korean' : 'international';
}
