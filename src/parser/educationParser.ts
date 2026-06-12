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

/** Subsection headings that must never become positions. */
const EXPERIENCE_HEADING_RE =
  /^(?:Professional Work Experiences|ACADEMIC APPOINTMENTS|EARLIER POSITIONS|Research Activities|Selected Projects|Teaching)$/i;

/** Marks the start of project/initiative blocks — employment parsing stops here. */
const EXPERIENCE_SECTION_STOP_RE =
  /^(?:Research Projects Experiences|International Academic Initiatives|Academic Program Development|International Partnerships)\b/i;

const EXPERIENCE_BULLET_RE = /^[•·*\-]\s+/;

/** Standalone period line (often on the line after a pipe-formatted appointment). */
const EXPERIENCE_PERIOD_LINE_RE =
  /^(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|Winter|Summer|Spring|Fall)\s+)?\d{4}\s*[-–]\s*(?:Present|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+)?\d{4}/i;

/** Lines that are detail/bullet prose — attach to current entry, never start a new one. */
const EXPERIENCE_DETAIL_LINE_RE =
  /^(?:Led |Taught |Supervised |Designed |Developed |Managed |Secured |Contributed |Collaborated |Facilitated |Supported |Mentored |Provided |Introduced |Produced |Serving |Engaged )/i;

/** Anchored regex for the start of a work-appointment line. */
const EXPERIENCE_ENTRY_START_RE =
  /^(?:(?:Associate|Assistant|Full|Visiting|Adjunct|Research)\s+)?(?:Professor|Lecturer)|^International\s+Consultant|^Invited\s+Researcher|^ITS\s+Researcher|^GIS\s+Manager|^Executive\s+Manager|^Research\s+(?:Professor|Fellow|Scientist)|^(?:Senior\s+)?(?:Consultant|Manager|Director|Engineer)\b/i;

/** Pipe-formatted appointment: "Role | Institution, Location" */
const EXPERIENCE_PIPE_START_RE = /^[A-Z][A-Za-z\s,&'./()\-]{3,100}\s*\|/;

function flushExperienceBlock(block: string[], entries: string[]): void {
  const joined = block.join('\n').trim();
  if (joined.length >= 20) {
    entries.push(joined);
  }
}

/**
 * Experience-aware entry splitter.
 *
 * Splits on strong appointment-start lines, attaches period/bullet/detail lines to the
 * current block, skips subsection headings, and stops at project/initiative sections.
 */
function splitExperienceEntries(text: string): string[] {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const entries: string[] = [];
  let current: string[] = [];
  let inNonEmploymentSection = false;

  for (const line of lines) {
    if (EXPERIENCE_SECTION_STOP_RE.test(line)) {
      if (current.length > 0) {
        flushExperienceBlock(current, entries);
        current = [];
      }
      inNonEmploymentSection = true;
      continue;
    }
    if (inNonEmploymentSection) {
      continue;
    }

    if (EXPERIENCE_HEADING_RE.test(line)) {
      if (current.length > 0) {
        flushExperienceBlock(current, entries);
        current = [];
      }
      continue;
    }

    const isNewEntry =
      (EXPERIENCE_ENTRY_START_RE.test(line) || EXPERIENCE_PIPE_START_RE.test(line)) &&
      !EXPERIENCE_BULLET_RE.test(line) &&
      !EXPERIENCE_PERIOD_LINE_RE.test(line) &&
      !EXPERIENCE_DETAIL_LINE_RE.test(line);

    if (isNewEntry && current.length > 0) {
      flushExperienceBlock(current, entries);
      current = [line];
    } else {
      current.push(line);
    }
  }

  if (current.length > 0 && !inNonEmploymentSection) {
    flushExperienceBlock(current, entries);
  }

  return entries.length > 0 ? entries : splitEntries(text);
}

function inferPositionType(text: string): MutablePosition['type'] {
  const lower = text.toLowerCase();
  if (lower.includes('professor') || lower.includes('lecturer')) {
    return 'academic';
  }
  if (lower.includes('research') || lower.includes('fellow') || lower.includes('scientist')) {
    return 'research';
  }
  if (lower.includes('consultant') || lower.includes('advisor')) {
    return 'consulting';
  }
  if (lower.includes('manager') || lower.includes('engineer') || lower.includes('developer')) {
    return 'industry';
  }
  return 'other';
}

function isPublishableExperienceEntry(trimmed: string, position: MutablePosition): boolean {
  const firstLine = trimmed.split('\n')[0]?.trim() ?? '';
  if (EXPERIENCE_HEADING_RE.test(firstLine)) {
    return false;
  }

  const hasTitle =
    position.title.length > 3 &&
    !EXPERIENCE_DETAIL_LINE_RE.test(position.title) &&
    !EXPERIENCE_HEADING_RE.test(position.title);
  const hasInstitution =
    position.institution.length > 3 && position.institution !== 'Unknown Organization';
  const hasPeriod = position.period.length > 0 && position.period !== 'Unknown';
  const isStrongPipe = EXPERIENCE_PIPE_START_RE.test(firstLine) && firstLine.split('|').length >= 2;

  if (isStrongPipe && (hasTitle || hasInstitution)) {
    return true;
  }
  return (hasTitle || hasInstitution) && hasPeriod;
}

/**
 * Parses work experience section text into structured data
 */
export function parseExperience(text: string): ParseResult<Position[]> {
  const warnings: ParseWarning[] = [];
  const positions: Position[] = [];

  const entries = splitExperienceEntries(text);

  entries.forEach((entry, index) => {
    const position = parseExperienceEntry(entry, index, warnings);
    if (position) {
      positions.push(position);
    }
  });

  return { data: positions, warnings };
}

/**
 * Parses a single experience entry.
 *
 * Handles pipe-separated first lines and multi-line blocks where the period
 * appears on the following line (common in real DOCX CVs).
 */
function parseExperienceEntry(text: string, index: number, warnings: ParseWarning[]): Position | null {
  const trimmed = text.trim();
  if (trimmed.length < 20) {
    return null;
  }

  const firstLine = trimmed.split('\n')[0]?.trim() ?? '';
  if (EXPERIENCE_HEADING_RE.test(firstLine)) {
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

  // ── Pipe-separated first line: Title | Institution [, Location] [| Period] ──
  const pipes = firstLine.split('|').map((p) => p.trim());
  if (pipes.length >= 2 && pipes[0] && pipes[1]) {
    position.title = pipes[0];
    position.institution = pipes[1];
    if (pipes.length >= 3 && pipes[2] && !/\d{4}/.test(pipes[2])) {
      position.location = pipes[2];
    }
    if (pipes.length >= 4 && pipes[3]) {
      const p = extractPeriodFromText(pipes[3]);
      if (p) {
        position.period = p.period;
      }
    }
  }

  // ── Title fallback ───────────────────────────────────────────────────────────
  if (!position.title) {
    const titlePatterns = [
      /^((?:(?:Associate|Assistant|Full|Visiting|Adjunct|Research|International|Invited|ITS|GIS|Executive)\s+)*(?:Professor|Lecturer|Consultant|Researcher|Manager|Director|Fellow))[^|\n]*/i,
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,4})\s*\|/,
    ];
    for (const pattern of titlePatterns) {
      const match = trimmed.match(pattern);
      if (match?.[1]) {
        position.title = match[1].trim();
        break;
      }
    }
    if (!position.title) {
      position.title = firstLine.slice(0, 100);
    }
  }

  position.type = inferPositionType(trimmed);

  // ── Institution fallback ─────────────────────────────────────────────────────
  if (!position.institution || position.institution.length <= 3) {
    const institutionPatterns = [
      /(?:University|Institute|Company|Corporation|Inc\.|Corp\.|Ltd\.)[^,\n|]*/i,
      /(?:INHA|KNTU|Sejong|HANCOM|KSIC|Hancom|Melbourne)[^,\n|]*/i,
      /\|\s*([^|]+(?:University|Institute|Company|Corporation|Organization)[^|\n]*)/i,
    ];
    for (const pattern of institutionPatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        position.institution = (match[1] ?? match[0]).replace(/^\|?\s*/, '').trim();
        break;
      }
    }
  }
  if (!position.institution) {
    position.institution = 'Unknown Organization';
  }

  // ── Period / year ────────────────────────────────────────────────────────────
  if (!position.period) {
    const p = extractPeriodFromText(trimmed);
    if (p) {
      position.period = p.period;
    } else {
      const year = extractYear(trimmed);
      if (year) {
        position.period = year.toString();
      }
    }
  }

  // ── Location fallback ────────────────────────────────────────────────────────
  if (!position.location) {
    const locationMatch = trimmed.match(/(South Korea|Korea|Australia|Iran|USA|Seoul|Incheon|Tehran)/i);
    if (locationMatch) {
      position.location = locationMatch[1] ?? null;
    }
  }

  if (!isPublishableExperienceEntry(trimmed, position)) {
    return null;
  }

  if (!position.period) {
    position.period = 'Unknown';
    warnings.push(createWarning('experience', `Position ${index + 1}: period unclear`, 'info', index));
  }

  // ── Achievements (bulleted items) ────────────────────────────────────────────
  const bulletItems = trimmed.match(/^[•·*\-]\s+([^\n]+)/gm);
  if (bulletItems) {
    position.achievements = bulletItems.map((item) => item.replace(/^[•·*\-]\s+/, '').trim());
  }

  // ── Details (non-bullet continuation lines after the first) ─────────────────
  const detailLines = trimmed
    .split('\n')
    .slice(1)
    .filter((line) => {
      const t = line.trim();
      return (
        t.length > 10 &&
        !EXPERIENCE_BULLET_RE.test(t) &&
        !EXPERIENCE_PERIOD_LINE_RE.test(t) &&
        !/^\d{4}\s*[-–]/.test(t)
      );
    });
  if (detailLines.length > 0) {
    position.details = detailLines.join('\n').trim();
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
