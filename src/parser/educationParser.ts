/**
 * Education and Experience parser
 * Extracts academic qualifications and work experiences from CV text
 */

import type { Education, Position, Award, MutableEducation, MutablePosition, MutableAward } from '@/types/details';
import type { ParseWarning, ParseResult } from '@/types/parser';

import {
  generateStableId,
  extractYear,
  splitEntries,
  createWarning,
} from './parserUtils';

/**
 * Anchored regex that matches the start of an education/postdoc entry line.
 * Checked against the trimmed first line of each candidate entry.
 */
const EDUCATION_ENTRY_START_RE =
  /^(?:Post-?Doc(?:toral)?(?:\s+Fellowship)?|Ph\.?\s*D\.?|Doctor(?:ate)?|M\.?\s*Sc\.?|Master(?:'?s)?(?:\s+of\s+\w+)?|B\.?\s*Sc\.?|Bachelor(?:'?s)?(?:\s+of\s+\w+)?|B\.?\s*Eng\.?|M\.?\s*Eng\.?)/i;

/**
 * Extracts year-range or single year from a text fragment.
 * Handles "YYYY - YYYY", "YYYY – YYYY", "Month YYYY - Month YYYY", "YYYY - Present".
 */
function extractPeriodFromText(text: string): { period: string; year: string } | null {
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
    if (EDUCATION_ENTRY_START_RE.test(line) && current.length > 0) {
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

/**
 * Parses work experience section text into structured data
 */
export function parseExperience(text: string): ParseResult<Position[]> {
  const warnings: ParseWarning[] = [];
  const positions: Position[] = [];
  
  const entries = splitEntries(text);
  
  entries.forEach((entry, index) => {
    const position = parseExperienceEntry(entry, index, warnings);
    if (position) {
      positions.push(position);
    }
  });
  
  return { data: positions, warnings };
}

/**
 * Parses a single experience entry
 */
function parseExperienceEntry(
  text: string,
  index: number,
  warnings: ParseWarning[]
): Position | null {
  const trimmed = text.trim();
  
  if (trimmed.length < 20) {
    return null;
  }
  
  const position: MutablePosition = {
    id: generateStableId(trimmed, index),
    title: '',
    institution: '',
    location: null,
    period: '',
    type: 'other',
    details: null,
    achievements: [],
    raw: trimmed,
  };
  
  // Extract position title
  const titlePatterns = [
    /^((?:Associate\s+)?Professor|Research(?:er)?|Consultant|Manager|Director|Fellow)[^|\n]*/i,
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s*\|/,
  ];
  
  for (const pattern of titlePatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      position.title = match[1]?.trim() ?? '';
      break;
    }
  }
  
  if (!position.title) {
    position.title = trimmed.split('\n')[0]?.slice(0, 100) ?? '';
  }
  
  // Determine position type
  const lowerText = trimmed.toLowerCase();
  if (lowerText.includes('professor') || lowerText.includes('lecturer') || lowerText.includes('teaching')) {
    position.type = 'academic';
  } else if (lowerText.includes('research') || lowerText.includes('fellow') || lowerText.includes('scientist')) {
    position.type = 'research';
  } else if (lowerText.includes('consultant') || lowerText.includes('advisor')) {
    position.type = 'consulting';
  } else if (lowerText.includes('manager') || lowerText.includes('engineer') || lowerText.includes('developer')) {
    position.type = 'industry';
  }
  
  // Extract institution
  const institutionPatterns = [
    /(?:University|Institute|Company|Corporation|Inc\.|Corp\.|Ltd\.)[^,\n]*/i,
    /(?:INHA|KNTU|Sejong|HANCOM|KSIC)[^,\n]*/i,
  ];
  
  for (const pattern of institutionPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      position.institution = match[0].trim();
      break;
    }
  }
  
  if (!position.institution) {
    position.institution = 'Unknown Organization';
  }
  
  // Extract period
  const periodMatch = trimmed.match(/(\d{4})\s*[-–]\s*(\d{4}|\bPresent\b)/i);
  if (periodMatch) {
    position.period = `${periodMatch[1]} - ${periodMatch[2]}`;
  } else {
    const year = extractYear(trimmed);
    position.period = year ? year.toString() : 'Unknown';
    warnings.push(createWarning('experience', `Position ${index + 1}: period unclear`, 'info', index));
  }
  
  // Extract location
  const locationMatch = trimmed.match(/(South Korea|Korea|Australia|Iran|USA|Seoul|Incheon|Tehran)/i);
  if (locationMatch) {
    position.location = locationMatch[1];
  }
  
  // Extract achievements (bulleted items)
  const bulletItems = trimmed.match(/[•·\-]\s*([^\n]+)/g);
  if (bulletItems) {
    position.achievements = bulletItems.map(item => 
      item.replace(/^[•·\-]\s*/, '').trim()
    );
  }
  
  // Extract details
  const lines = trimmed.split('\n');
  const detailLines = lines.filter(line => 
    !line.match(/^\d{4}/) && 
    !line.match(/^[•·\-]/) &&
    line.trim().length > 10
  );
  if (detailLines.length > 1) {
    position.details = detailLines.slice(1).join('\n').trim();
  }
  
  return position as Position;
}

/**
 * Parses awards section text into structured data
 */
export function parseAwards(text: string): ParseResult<Award[]> {
  const warnings: ParseWarning[] = [];
  const awards: Award[] = [];
  
  const entries = splitEntries(text);
  
  entries.forEach((entry, index) => {
    const award = parseAwardEntry(entry, index);
    if (award) {
      awards.push(award);
    }
  });
  
  return { data: awards, warnings };
}

/**
 * Parses a single award entry
 */
function parseAwardEntry(
  text: string,
  index: number
): Award | null {
  const trimmed = text.trim();
  
  if (trimmed.length < 20) {
    return null;
  }
  
  const award: MutableAward = {
    id: generateStableId(trimmed, index),
    title: '',
    organization: null,
    year: null,
    category: null,
    details: null,
    raw: trimmed,
  };
  
  // Extract year
  const year = extractYear(trimmed);
  if (year) {
    award.year = year.toString();
  }
  
  // Extract title (first line or before year)
  const titleEnd = trimmed.search(/\d{4}/);
  if (titleEnd > 0) {
    award.title = trimmed.slice(0, titleEnd).trim();
  } else {
    award.title = trimmed.split('\n')[0]?.slice(0, 150) ?? '';
  }
  
  // Determine category
  const lowerText = trimmed.toLowerCase();
  if (lowerText.includes('research') || lowerText.includes('scientist') || lowerText.includes('paper')) {
    award.category = 'research';
  } else if (lowerText.includes('teaching') || lowerText.includes('educator') || lowerText.includes('instructor')) {
    award.category = 'teaching';
  } else if (lowerText.includes('service') || lowerText.includes('community') || lowerText.includes('volunteer')) {
    award.category = 'service';
  } else {
    award.category = 'other';
  }
  
  // Extract organization
  const orgPatterns = [
    /from (?:the )?([A-Z][^\n,]+)/i,
    /(?:by|awarded by)\s+(?:the\s+)?([A-Z][^\n,]+)/i,
    /(University|Institute|Foundation|Association|Government|Ministry)[^\n,]*/i,
  ];
  
  for (const pattern of orgPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      award.organization = match[1]?.trim() ?? '';
      break;
    }
  }
  
  // Extract details
  const lines = trimmed.split('\n').slice(1);
  if (lines.length > 0) {
    award.details = lines.join('\n').trim();
  }
  
  return award as Award;
}
