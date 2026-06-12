/**
 * Awards parser — extracts award entries from CV text
 */

import type { Award, MutableAward } from '@/types/details';
import type { ParseWarning, ParseResult } from '@/types/parser';

import { generateStableId, extractYear, splitEntries } from './parserUtils';

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
