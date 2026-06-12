/**
 * Deterministic utilities for sanitizing imported professional summary fields.
 *
 * Responsibilities:
 * - Trim homeAboutIntro and aboutIntroTagline to safe display lengths.
 * - Remove obvious duplicate opening paragraphs from professionalSummaryParagraphs.
 * - Produce trimNotes for the merge safety report (non-blocking).
 */

import { nonEmptyLines } from '@/server/imports/detailsMergeNormalize';

/** Maximum characters for home page about intro. */
export const HOME_INTRO_MAX = 600;

/** Maximum characters for about page intro tagline. */
export const TAGLINE_MAX = 300;

/**
 * Number of leading words used to fingerprint a paragraph for duplicate detection.
 * Paragraphs whose first DEDUP_WORDS normalized words match an earlier paragraph are dropped.
 */
const DEDUP_WORDS = 12;

export type SummaryInput = {
  profileSummary: string | null | undefined;
  brief: string | null | undefined;
  full: string | null | undefined;
  profileTitle: string | null | undefined;
  cvSummaryMergePolicy: 'split_v1' | null | undefined;
};

export type SanitizedSummary = {
  homeAboutIntro: string;
  aboutIntroTagline: string;
  professionalSummaryParagraphs: string[];
  /** Non-blocking messages for the merge safety report. Empty when nothing was trimmed/deduped. */
  trimNotes: string[];
};

/**
 * Truncates `text` at the last sentence boundary at or before `max` characters.
 * Falls back to the last word boundary, then hard-truncates.
 */
export function trimToFieldMax(text: string, max: number): { result: string; wasTrimmed: boolean } {
  if (text.length <= max) {
    return { result: text, wasTrimmed: false };
  }
  const candidate = text.slice(0, max);

  // Find position after the last sentence-ending punctuation (.!?) followed by whitespace
  // within the candidate. Keep the punctuation, discard everything after.
  let lastSentencePos = -1;
  const sentenceRe = /[.!?][)"']?(?=\s|$)/g;
  let m: RegExpExecArray | null;
  while ((m = sentenceRe.exec(candidate)) !== null) {
    lastSentencePos = m.index + 1; // position after the punctuation character
  }

  if (lastSentencePos > max * 0.5) {
    return { result: candidate.slice(0, lastSentencePos).trim(), wasTrimmed: true };
  }

  // Fall back to last word boundary
  const lastSpace = candidate.lastIndexOf(' ');
  if (lastSpace > max * 0.5) {
    return { result: `${candidate.slice(0, lastSpace).trim()}\u2026`, wasTrimmed: true };
  }

  return { result: `${candidate.trim()}\u2026`, wasTrimmed: true };
}

/** Extracts a short normalized fingerprint from the first DEDUP_WORDS words of a paragraph. */
function paragraphFingerprint(para: string): string {
  return para
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, DEDUP_WORDS)
    .join(' ');
}

/**
 * Removes paragraphs whose opening DEDUP_WORDS words match an earlier paragraph.
 * Preserves order of first occurrences.
 */
export function deduplicateParagraphs(paragraphs: string[]): { paragraphs: string[]; removedCount: number } {
  const seen = new Set<string>();
  const out: string[] = [];
  let removedCount = 0;

  for (const para of paragraphs) {
    const fp = paragraphFingerprint(para);
    if (fp.length === 0) {
      continue;
    }
    if (seen.has(fp)) {
      removedCount += 1;
    } else {
      seen.add(fp);
      out.push(para);
    }
  }

  return { paragraphs: out, removedCount };
}

/**
 * Sanitizes imported summary fields into publish-safe values.
 * Pure and deterministic — safe to call multiple times with the same input.
 */
export function sanitizeImportedSummary(input: SummaryInput): SanitizedSummary {
  const { profileSummary, brief, full, profileTitle, cvSummaryMergePolicy } = input;
  const trimNotes: string[] = [];

  // --- Professional summary paragraphs ---
  const rawParas =
    cvSummaryMergePolicy === 'split_v1'
      ? [...nonEmptyLines(profileSummary), ...nonEmptyLines(brief)]
      : [...nonEmptyLines(profileSummary), ...nonEmptyLines(brief), ...nonEmptyLines(full)];

  const { paragraphs: professionalSummaryParagraphs, removedCount } = deduplicateParagraphs(rawParas);
  if (removedCount > 0) {
    trimNotes.push(
      `${removedCount} duplicate paragraph(s) removed from professional summary to avoid repeated opening text.`,
    );
  }

  // --- Home intro ---
  const introSource = (profileSummary ?? brief ?? '').trim();
  let homeAboutIntro = '';
  if (introSource) {
    const { result, wasTrimmed } = trimToFieldMax(introSource, HOME_INTRO_MAX);
    homeAboutIntro = result;
    if (wasTrimmed) {
      trimNotes.push(
        `Home intro trimmed from ${introSource.length} to ${result.length} chars to fit display limit (${HOME_INTRO_MAX}).`,
      );
    }
  }

  // --- About tagline ---
  const taglineSource = (brief ?? profileTitle ?? '').trim();
  let aboutIntroTagline = '';
  if (taglineSource) {
    const { result, wasTrimmed } = trimToFieldMax(taglineSource, TAGLINE_MAX);
    aboutIntroTagline = result;
    if (wasTrimmed) {
      trimNotes.push(
        `About tagline trimmed from ${taglineSource.length} to ${result.length} chars to fit display limit (${TAGLINE_MAX}).`,
      );
    }
  }

  return { homeAboutIntro, aboutIntroTagline, professionalSummaryParagraphs, trimNotes };
}
