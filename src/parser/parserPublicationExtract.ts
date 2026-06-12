/**
 * Extracts DOI from text
 */
export function extractDoi(text: string): string | null {
  const doiPattern = /\b(10\.\d{4,}(?:\.\d+)*\/[^\s]+)\b/i;
  const match = text.match(doiPattern);
  return match ? match[1] ?? null : null;
}

/**
 * Extracts journal name from publication text
 */
export function extractJournalName(text: string): string | null {
  // Common patterns for journal names
  const patterns = [
    /(?:published in|in:?)\s*([^,\.\d]+?)(?:,|\.|Vol|Volume|\d)/i,
    /([A-Z][a-zA-Z\s&]+(?:Journal|Review|Letters|Science|Research|Studies)[^,\.]*)/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1]?.trim() ?? null;
    }
  }
  
  return null;
}

/**
 * Determines publication type from text
 */
export function determinePublicationType(text: string): 'journal' | 'conference' | 'book' | 'chapter' | 'other' {
  const lower = text.toLowerCase();
  
  if (lower.includes('conference') || lower.includes('proceedings') || lower.includes('symposium')) {
    return 'conference';
  }
  if (lower.includes('book chapter') || lower.includes('chapter in')) {
    return 'chapter';
  }
  if (lower.includes('book') && !lower.includes('book chapter')) {
    return 'book';
  }
  if (lower.includes('journal') || lower.includes('scie') || lower.includes('ssci')) {
    return 'journal';
  }
  
  return 'other';
}

/**
 * Extracts authors from citation text
 */
export function extractAuthors(text: string): string | null {
  // Pattern: Authors before year in parentheses
  const pattern = /^([^(]+?)(?:\s*\(?\d{4}\)?)/;
  const match = text.match(pattern);
  
  if (match) {
    const authors = match[1]?.trim() ?? '';
    // Validate it looks like author names
    if (authors.includes(',') || authors.includes('&') || authors.includes('and')) {
      return authors;
    }
  }
  
  return null;
}
