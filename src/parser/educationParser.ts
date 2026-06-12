/**
 * Education parser — extracts academic qualifications from CV text
 */

import type { Education, MutableEducation } from '@/types/details';
import type { ParseWarning, ParseResult } from '@/types/parser';

import {
  generateStableId,
  extractYear,
  splitEntries,
  createWarning,
} from './parserUtils';
import { extractPeriodFromText } from './periodExtract';

/**
 * Thesis/supervisor detail lines — attach to current entry, never start a new one.
 * Covers optional degree prefixes seen in real CVs (e.g. "PhD Supervisor:", "MSc. Supervisors:").
 */
const EDUCATION_DETAIL_PREFIX_RE =
  /^(?:(?:PhD|Ph\.?\s*D\.?|M\.?Sc\.?|B\.?Sc\.?)\s+)?(?:Supervisor[s]?|Dissertation|Thesis|Advisor[s]?)\s*:/i;

/**
 * Anchored regex for true education/postdoc entry-start lines.
 * Requires pipe-separated format or "in <field>" — excludes "PhD Supervisor:" / "MSc. Supervisors:".
 */
const EDUCATION_ENTRY_START_RE =
  /^(?:Post-?Doc(?:toral)?(?:\s+Fellowship)?(?:\s*\||\s*$)|(?:Ph\.?\s*D\.?|Doctor(?:ate)?|M\.?\s*Sc\.?|Master(?:'?s)?(?:\s+of\s+\w+)?|B\.?\s*Sc\.?|Bachelor(?:'?s)?(?:\s+of\s+\w+)?|B\.?\s*Eng\.?|M\.?\s*Eng\.?)(?:\s+in\s+|\s*\|))/i;

function isEducationEntryStartLine(line: string): boolean {
  if (EDUCATION_DETAIL_PREFIX_RE.test(line)) {
    return false;
  }
  return EDUCATION_ENTRY_START_RE.test(line);
}

/**
 * Education-aware entry splitter.
 *
 * Splits on lines that begin a new degree/fellowship entry (matched by EDUCATION_ENTRY_START_RE).
 * Pre-degree lines (recognition banners, etc.) accumulate into a header block that parseEducationEntry
 * will reject via the honor-banner filter.
 * Falls back to the generic splitEntries when no education-keyword boundaries are found.
 */
function splitEducationEntries(text: string): string[] {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const entries: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (isEducationEntryStartLine(line) && current.length > 0) {
      const joined = current.join('\n').trim();
      if (joined.length >= 20) {
        entries.push(joined);
      }
      current = [line];
    } else {
      current.push(line);
    }
  }

  if (current.length > 0) {
    const joined = current.join('\n').trim();
    if (joined.length >= 20) {
      entries.push(joined);
    }
  }

  return entries.length > 1 ? entries : splitEntries(text);
}

/**
 * Parses education section text into structured data
 */
export function parseEducation(text: string): ParseResult<Education[]> {
  const warnings: ParseWarning[] = [];
  const education: Education[] = [];

  const entries = splitEducationEntries(text);

  entries.forEach((entry, index) => {
    const edu = parseEducationEntry(entry, index, warnings);
    if (edu) {
      education.push(edu);
    }
  });

  return { data: education, warnings };
}

/**
 * Parses a single education entry.
 *
 * Handles two first-line formats:
 *   1. Pipe-separated:  "Ph.D. in Geo-Informatics Engineering | INHA University | South Korea | 2002 - 2006"
 *   2. Multi-line:      "Ph.D. in Geomatics Engineering\nUniversity of Melbourne | Australia | 2008"
 */
function parseEducationEntry(text: string, index: number, warnings: ParseWarning[]): Education | null {
  const trimmed = text.trim();
  if (trimmed.length < 20) {
    return null;
  }

  const edu: MutableEducation = {
    id: generateStableId(trimmed, index),
    degree: '',
    institution: '',
    location: null,
    year: null,
    period: null,
    thesis: null,
    supervisor: null,
    details: null,
    raw: trimmed,
  };

  const firstLine = trimmed.split('\n')[0]?.trim() ?? '';

  if (EDUCATION_DETAIL_PREFIX_RE.test(firstLine)) {
    return null;
  }

  // Skip recognition / honour banners (e.g. "Top 2% researcher...")
  const looksLikeHonorBanner =
    /^(?:top\s+\d|fellow\s*\||recognized for|contributing to|developing |collaborating |research focus)/i.test(firstLine);
  const hasStructuredDegree =
    /(?:Ph\.?\s*D|Post-?Doc|Doctor(?:ate)?|M\.?\s*Sc|B\.?\s*Sc|Master|Bachelor)/i.test(trimmed);
  if (looksLikeHonorBanner && !hasStructuredDegree) {
    return null;
  }

  // ── Degree type ─────────────────────────────────────────────────────────────
  // Checked against first line only. Post-Doctoral MUST come before Ph.D. because
  // "Doctoral" contains the substring "Doctor" which the Ph.D. pattern would match.
  const degreePatterns = [
    { pattern: /^Post-?Doc(?:toral)?(?:\s+Fellowship)?/i, type: 'Post-Doctoral Fellowship' },
    { pattern: /\bPh\.?\s*D\.?\b/i, type: 'Ph.D.' },
    { pattern: /\bDoctor(?:ate)?\b/i, type: 'Ph.D.' },
    { pattern: /\bM\.?\s*Sc\.?\b|Master(?:'?s)?(?:\s+of)?/i, type: 'M.Sc.' },
    { pattern: /\bB\.?\s*Sc\.?\b|Bachelor(?:'?s)?(?:\s+of)?/i, type: 'B.Sc.' },
  ];
  for (const { pattern, type } of degreePatterns) {
    if (pattern.test(firstLine)) {
      edu.degree = type;
      break;
    }
  }
  if (!edu.degree) {
    edu.degree = firstLine.length > 100 ? firstLine.slice(0, 100) : firstLine;
    warnings.push(createWarning('education', `Education ${index + 1}: degree type unclear`, 'info', index));
  }

  // ── Field of study ("in X Engineering/Science") from first line ─────────────
  // Allow en-dash (U+2013) and em-dash (U+2014) inside field names.
  const fieldMatch = firstLine.match(
    /\bin\s+([A-Za-z\u2013\u2014\-]+(?:\s+[A-Za-z\u2013\u2014\-]+){0,4}\s+(?:Engineering|Science|Studies|Technology))/i,
  );
  if (fieldMatch?.[1]) {
    edu.degree = `${edu.degree} in ${fieldMatch[1].trim()}`;
  }

  // ── Parse pipe-separated first line: Degree | Institution | Location | Period ─
  const pipes = firstLine.split('|').map((p) => p.trim());
  if (pipes.length >= 2 && pipes[1] && pipes[1].length > 3) {
    edu.institution = pipes[1];
  }
  if (!edu.location && pipes.length >= 3 && pipes[2]) {
    edu.location = pipes[2] || null;
  }
  if (!edu.period && pipes.length >= 4 && pipes[3]) {
    const p = extractPeriodFromText(pipes[3]);
    if (p) {
      edu.period = p.period;
      edu.year = p.year;
    }
  }

  // ── Institution fallback ─────────────────────────────────────────────────────
  if (!edu.institution) {
    const institutionPatterns = [
      /(?:University|Institute|College|School)[^,\n|]*/i,
      /(?:INHA|KNTU|Sejong|Toosi)[^,\n|]*/i,
      /\|?\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\s+University)/,
    ];
    for (const pattern of institutionPatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        edu.institution = match[0].replace(/^\|?\s*/, '').trim();
        break;
      }
    }
  }
  if (!edu.institution) {
    warnings.push(createWarning('education', `Education ${index + 1}: institution not found`, 'warning', index));
    edu.institution = 'Unknown Institution';
  }

  // ── Location fallback ────────────────────────────────────────────────────────
  if (!edu.location) {
    const locationMatch = trimmed.match(/(South Korea|Korea|Australia|Iran|USA|United States)/i);
    if (locationMatch) {
      edu.location = locationMatch[1] ?? null;
    }
  }

  // ── Period / year fallback ───────────────────────────────────────────────────
  if (!edu.period) {
    const p = extractPeriodFromText(trimmed);
    if (p) {
      edu.period = p.period;
      edu.year = p.year;
    } else {
      const y = extractYear(trimmed);
      if (y) {
        edu.year = y.toString();
      }
    }
  }

  // ── Thesis / Dissertation ────────────────────────────────────────────────────
  const thesisMatch = trimmed.match(/(?:Thesis|Dissertation)[:\s]+[""]?([^"""\n]+)[""]?/i);
  if (thesisMatch) {
    edu.thesis = thesisMatch[1]?.trim() ?? null;
  }

  // ── Supervisor ───────────────────────────────────────────────────────────────
  const supervisorMatch = trimmed.match(/Supervisor[s]?[:\s]+(?:Prof\.?\s*)?([^\n]+)/i);
  if (supervisorMatch) {
    edu.supervisor = supervisorMatch[1]?.trim() ?? null;
  }

  // ── Details (all lines after the first) ─────────────────────────────────────
  const detailLines = trimmed.split('\n').slice(1);
  if (detailLines.length > 0) {
    const det = detailLines.join('\n').trim();
    edu.details = det || null;
  }

  return edu as Education;
}
