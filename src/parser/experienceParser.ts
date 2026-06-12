/**
 * Experience parser — extracts work experience / positions from CV text
 */

import type { Position, MutablePosition } from '@/types/details';
import type { ParseWarning, ParseResult } from '@/types/parser';

import {
  generateStableId,
  extractYear,
  splitEntries,
  createWarning,
} from './parserUtils';
import { extractPeriodFromText } from './periodExtract';

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
