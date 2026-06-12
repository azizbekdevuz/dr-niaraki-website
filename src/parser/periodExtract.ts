/**
 * Shared period/year extraction for education and experience parsers.
 */

/**
 * Extracts year-range or single year from a text fragment.
 * Handles "YYYY - YYYY", "YYYY – YYYY", "Month YYYY - Month YYYY", "YYYY - Present".
 */
export function extractPeriodFromText(text: string): { period: string; year: string } | null {
  // Direct: YYYY - YYYY
  const direct = text.match(/\b(\d{4})\s*[-–]\s*(\d{4})\b/);
  if (direct) {
    return { period: `${direct[1]} - ${direct[2]}`, year: direct[2]! };
  }

  // Direct: YYYY - Present
  const withPresent = text.match(/\b(\d{4})\s*[-–]\s*Present\b/i);
  if (withPresent) {
    return { period: `${withPresent[1]} - Present`, year: withPresent[1]! };
  }

  // Month YYYY - Month YYYY  (e.g. "Oct 2008 - Sept 2009")
  const yearMatches = [...text.matchAll(/\b(1\d{3}|20\d{2})\b/g)].map((m) => m[1]!);
  const hasPresent = /\bPresent\b/i.test(text);
  if (yearMatches.length >= 2) {
    const last = yearMatches[yearMatches.length - 1] ?? '';
    return { period: `${yearMatches[0] ?? ''} - ${last}`, year: last };
  }
  if (yearMatches.length === 1 && hasPresent) {
    return { period: `${yearMatches[0] ?? ''} - Present`, year: yearMatches[0] ?? '' };
  }

  return null;
}
