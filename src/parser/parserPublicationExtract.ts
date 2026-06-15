/**
 * APA-style venue/journal extraction from citation text.
 */

import { parseApaCitationParts } from './publicationApaStructure';

const MONTH_IN_YEAR = /\(\d{4}(?:,\s*[A-Za-z]+)?\)/;

/**
 * Extracts journal/venue name from publication text using citation structure.
 */
export function extractJournalName(text: string): string | null {
  const publishedIn = text.match(/\bPublished\s+in:?\s*([^,\.\n]+)/i);
  if (publishedIn?.[1]) {
    return publishedIn[1].trim();
  }

  const inLabel = text.match(/\bIn:\s*([^,\.\n]+)/i);
  if (inLabel?.[1]) {
    return inLabel[1].trim();
  }

  const apaStart = text.match(MONTH_IN_YEAR);
  if (!apaStart || apaStart.index === undefined) {
    return extractJournalNameFallback(text);
  }

  const body = text.slice(apaStart.index + apaStart[0].length).replace(/^\.\s*/, '').trim();
  if (!body) {
    return extractJournalNameFallback(text);
  }

  const conference = body.match(
    /\bIn\s+(\d{4}\s+)?([A-Z][^.]*?(?:Conference|Proceedings|Symposium|Workshops)[^.]*)/i,
  );
  if (conference?.[2]) {
    return conference[2].trim();
  }

  const journalBeforeVolume = body.match(
    /\.\s*([A-Z][A-Za-z0-9&\s,.-]{3,120}?),\s*\d{1,4}\s*\(/,
  );
  if (journalBeforeVolume?.[1]) {
    return journalBeforeVolume[1].trim();
  }

  const journalBeforeIssue = body.match(/\.\s*([A-Z][A-Za-z0-9&\s,.-]{3,100}?),\s*\d{1,4}\s*,/);
  if (journalBeforeIssue?.[1]) {
    return journalBeforeIssue[1].trim();
  }

  const sciE = body.match(/\.\s*([A-Z][A-Za-z0-9&\s,.-]{4,90}?)\s*(?:,\s*\d|\.\s*\(SCIE|\.\s*\(SSCI)/);
  if (sciE?.[1]) {
    const candidate = sciE[1].trim();
    if (!/^g\s/i.test(candidate) && candidate.length > 3) {
      return candidate;
    }
  }

  const journalEndPeriod = body.match(
    /\.\s+((?:IEEE\s+)?[A-Z][A-Za-z0-9&][A-Za-z0-9&\s,.-]{8,120}?)\.\s*(?:\(SCIE|\(SSCI|$)/i,
  );
  if (journalEndPeriod?.[1]) {
    return journalEndPeriod[1].trim();
  }

  return extractJournalNameFallback(text);
}

function extractJournalNameFallback(text: string): string | null {
  const named = text.match(
    /([A-Z][a-zA-Z\s&]+(?:Journal|Review|Letters|Science|Research|Studies|Reports)[^,\.]*)/,
  );
  if (named?.[1]) {
    return named[1].trim();
  }
  return null;
}

/**
 * Extracts DOI from text
 */
export function extractDoi(text: string): string | null {
  const doiPattern = /\b(10\.\d{4,}(?:\.\d+)*\/[^\s]+)\b/i;
  const match = text.match(doiPattern);
  return match ? match[1] ?? null : null;
}

/**
 * Determines publication type from text
 */
export function determinePublicationType(text: string): 'journal' | 'conference' | 'book' | 'chapter' | 'other' {
  const lower = text.toLowerCase();

  if (lower.includes('conference') || lower.includes('proceedings') || lower.includes('symposium')) {
    return 'conference';
  }
  if (lower.includes('book chapter') || lower.includes('chapter in')) {
    return 'chapter';
  }
  if (
    /\buniversity\s+publication\b/i.test(text) ||
    /\bvdm\b/i.test(text) ||
    /\btranslation\s+in\s+persian\b/i.test(text) ||
    /\bisbn\b/i.test(text) ||
    (lower.includes('book') && !lower.includes('book chapter'))
  ) {
    return 'book';
  }
  if (lower.includes('journal') || lower.includes('scie') || lower.includes('ssci')) {
    return 'journal';
  }

  return 'other';
}

/**
 * Extracts authors from citation text
 */
export function extractAuthors(text: string): string | null {
  const parts = parseApaCitationParts(text);
  if (parts?.authors) {
    const authors = parts.authors.trim();
    if (authors.includes(',') || authors.includes('&') || authors.includes('and')) {
      return authors;
    }
  }

  const pattern = /^([^(]+?)(?:\s*\(?\d{4}(?:,\s*[A-Za-z]+)?\)?)/;
  const match = text.match(pattern);

  if (match) {
    const authors = match[1]?.trim() ?? '';
    if (authors.includes(',') || authors.includes('&') || authors.includes('and')) {
      return authors;
    }
  }

  return null;
}
