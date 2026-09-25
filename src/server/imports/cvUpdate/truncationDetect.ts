/**
 * Detect truncated / downgraded CV candidates that must never silently replace website values.
 */

const MID_SENTENCE_END = /[,;:]\s*$/;
const MID_WORD_HYPHEN = /[A-Za-z]{2,}-\s*$/;
/** Incomplete final token such as "Pro", "Assistan", "Associat" (no sentence end). */
const INCOMPLETE_FINAL_TOKEN = /\b([A-Z][a-z]{1,7})\s*$/;
const OBVIOUS_CUTOFF = /\b(and|or|the|of|to|in|for|with|a|an)\s*$/i;
const COMPLETE_SENTENCE_END = /[.!?…]["')\]]?\s*$/;

const LIKELY_INCOMPLETE_STEMS = new Set([
  'pro',
  'prof',
  'profes',
  'professo',
  'assistan',
  'associat',
  'universi',
  'departm',
  'researc',
  'enginee',
  'technol',
  'informa',
  'comput',
]);

export type TruncationVerdict = {
  truncated: boolean;
  reason: string | null;
};

/** True when candidate text looks cut mid-word, mid-sentence, or suspiciously shorter. */
export function detectTruncatedCandidate(
  websiteValue: string,
  candidateValue: string,
): TruncationVerdict {
  const website = websiteValue.trim();
  const candidate = candidateValue.trim();
  if (!candidate) {
    return { truncated: true, reason: 'Candidate value is empty while website value exists.' };
  }
  if (!website) {
    return { truncated: false, reason: null };
  }
  if (candidate === website) {
    return { truncated: false, reason: null };
  }

  if (MID_WORD_HYPHEN.test(candidate)) {
    return { truncated: true, reason: 'Candidate appears to end mid-word.' };
  }
  if (!COMPLETE_SENTENCE_END.test(candidate)) {
    const incomplete = candidate.match(INCOMPLETE_FINAL_TOKEN);
    const stem = incomplete?.[1]?.toLowerCase() ?? '';
    if (stem && (LIKELY_INCOMPLETE_STEMS.has(stem) || (stem.length <= 4 && website.toLowerCase().includes(`${stem}`)))) {
      // Prefer signaling when website continues past this stem (e.g. Professor).
      const idx = website.toLowerCase().indexOf(stem);
      if (idx >= 0 && website.length > idx + stem.length + 2) {
        return {
          truncated: true,
          reason: `Candidate appears to end on an incomplete word ("${incomplete?.[1]}").`,
        };
      }
      if (LIKELY_INCOMPLETE_STEMS.has(stem)) {
        return {
          truncated: true,
          reason: `Candidate appears to end on an incomplete word ("${incomplete?.[1]}").`,
        };
      }
    }
  }
  if (MID_SENTENCE_END.test(candidate) && !COMPLETE_SENTENCE_END.test(candidate)) {
    return { truncated: true, reason: 'Candidate appears to end mid-sentence.' };
  }
  if (OBVIOUS_CUTOFF.test(candidate) && candidate.length + 12 < website.length) {
    return { truncated: true, reason: 'Candidate ends on a connective and is shorter than the website value.' };
  }

  // Identity / display-name downgrade: candidate is a strict shorter token subset.
  const websiteTokens = tokenizeIdentity(website);
  const candidateTokens = tokenizeIdentity(candidate);
  if (
    websiteTokens.length >= 3 &&
    candidateTokens.length >= 2 &&
    candidateTokens.length < websiteTokens.length &&
    candidateTokens.every((t) => websiteTokens.includes(t))
  ) {
    return {
      truncated: true,
      reason: 'Candidate looks like a shortened identity compared with the curated website value.',
    };
  }

  // Dramatic length collapse (e.g. intro cut off).
  if (website.length >= 80 && candidate.length < website.length * 0.55) {
    return {
      truncated: true,
      reason: 'Candidate is substantially shorter than the current website value.',
    };
  }

  // Website continues with more sentences after a shared prefix (clipped extraction).
  if (
    website.length >= 120 &&
    candidate.length >= 40 &&
    website.startsWith(candidate) &&
    website.length > candidate.length + 20 &&
    !COMPLETE_SENTENCE_END.test(candidate)
  ) {
    return {
      truncated: true,
      reason: 'Candidate is a clipped prefix of the complete website value.',
    };
  }

  return { truncated: false, reason: null };
}

function tokenizeIdentity(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

export function fingerprintText(value: unknown): string {
  const raw = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  let hash = 0;
  const s = raw.normalize('NFKC').trim().replace(/\s+/g, ' ');
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  return `t${(hash >>> 0).toString(16)}:${s.length}`;
}
