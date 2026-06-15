/**
 * Awards parser — extracts award entries from CV text
 */

import type { Award, MutableAward } from '@/types/details';
import type { ParseWarning, ParseResult } from '@/types/parser';

import { splitAwardEntries } from './awardsEntrySplit';
import { generateStableId, extractYear } from './parserUtils';

/**
 * Parses awards section text into structured data
 */
export function parseAwards(text: string): ParseResult<Award[]> {
  const warnings: ParseWarning[] = [];
  const awards: Award[] = [];

  const entries = splitAwardEntries(text);

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
function parseAwardEntry(text: string, index: number): Award | null {
  const trimmed = text.trim();

  if (trimmed.length < 20) {
    return null;
  }

  const firstLine = trimmed.split('\n')[0]?.trim() ?? '';
  if (/^professional\s+memberships/i.test(firstLine)) {
    return null;
  }

  const award: MutableAward = {
    id: generateStableId(trimmed, index),
    title: firstLine,
    organization: null,
    year: null,
    category: null,
    details: null,
    raw: trimmed,
  };

  const year = extractYear(trimmed);
  if (year) {
    award.year = year.toString();
  }

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

  const orgPatterns = [
    /(?:at|from)\s+(?:the\s+)?([A-Z][^\n,(]+(?:University|Institute|Association|Foundation|Lab|SDL)[^\n,)]*)/i,
    /(?:by|awarded by)\s+(?:the\s+)?([A-Z][^\n,]+)/i,
    /(International Engineering and Technology Institute \(IETI\))/i,
    /(Stanford-Elsevier)/i,
  ];

  for (const pattern of orgPatterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      award.organization = match[1].trim();
      break;
    }
  }

  const lines = trimmed.split('\n').slice(1);
  if (lines.length > 0) {
    award.details = lines.join('\n').trim();
  }

  return award as Award;
}
