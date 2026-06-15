/**
 * Shared period/year extraction for education and experience parsers.
 */

const MONTH =
  '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';

/**
 * Extracts month-year range such as "March 2022 - February 2030".
 */
export function extractMonthYearPeriod(text: string): string | null {
  const re = new RegExp(`\\b${MONTH}\\s+\\d{4}\\s*[-–]\\s*${MONTH}\\s+\\d{4}\\b`, 'i');
  const m = text.match(re);
  if (!m?.[0]) {
    return null;
  }
  return m[0].replace(/\s*[-–]\s*/, ' - ');
}

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

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

export type PeriodEnd = { year: number; month: number | null };

/** Parses the ending month/year (or year-only) from a period string. */
export function parsePeriodEnd(period: string | null | undefined): PeriodEnd | null {
  if (!period?.trim()) {
    return null;
  }
  const monthRe = new RegExp(`[-–]\\s*(${MONTH})\\s+(\\d{4})\\s*$`, 'i');
  const monthEnd = period.match(monthRe);
  if (monthEnd?.[1] && monthEnd[2]) {
    const key = monthEnd[1].toLowerCase();
    const month = MONTH_INDEX[key] ?? MONTH_INDEX[key.slice(0, 3)];
    if (month !== undefined) {
      return { year: parseInt(monthEnd[2], 10), month };
    }
  }
  const yearEnd = period.match(/[-–]\s*(\d{4})\s*$/);
  if (yearEnd?.[1]) {
    return { year: parseInt(yearEnd[1], 10), month: null };
  }
  return null;
}

/**
 * Infers research project status from explicit wording and parsed period end.
 * Year-only end in the current year is treated as ongoing (ambiguous), not completed.
 */
export function resolveResearchProjectStatus(
  text: string,
  period: string | null | undefined,
  now: Date = new Date(),
): 'ongoing' | 'completed' {
  if (/\b(present|ongoing|active)\b/i.test(text)) {
    return 'ongoing';
  }
  if (/\b(completed|finished)\b/i.test(text)) {
    return 'completed';
  }

  const end = parsePeriodEnd(period);
  if (!end) {
    return 'completed';
  }

  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();

  if (end.month !== null) {
    const endDate = new Date(end.year, end.month, 1);
    const nowDate = new Date(nowYear, nowMonth, 1);
    if (endDate > nowDate) {
      return 'ongoing';
    }
    if (endDate < nowDate) {
      return 'completed';
    }
    return /\bpresent\b/i.test(text) ? 'ongoing' : 'ongoing';
  }

  if (end.year > nowYear) {
    return 'ongoing';
  }
  if (end.year < nowYear) {
    return 'completed';
  }
  return 'ongoing';
}
