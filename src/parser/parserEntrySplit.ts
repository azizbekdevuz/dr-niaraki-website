/**
 * Splits publication/patent entries by bullet or double newline
 */
export function splitEntries(text: string): string[] {
  // Minimum entry length to filter out noise (but not short valid entries)
  const MIN_ENTRY_LENGTH = 10;
  
  // Try splitting by numbered entries first (more flexible pattern)
  const numberedPattern = /(?:^|\n)\s*(\d+)[\.\)]\s+/gm;
  const numberedMatches = [...text.matchAll(numberedPattern)];
  if (numberedMatches.length >= 2) {
    const entries: string[] = [];
    for (let i = 0; i < numberedMatches.length; i++) {
      const match = numberedMatches[i];
      if (!match || match.index === undefined) {
        continue;
      }
      const start = match.index + match[0].length;
      const nextMatch = i < numberedMatches.length - 1 ? numberedMatches[i + 1] : null;
      const end = nextMatch?.index ?? text.length;
      const entry = text.slice(start, end).trim();
      if (entry.length > MIN_ENTRY_LENGTH) {
        entries.push(entry);
      }
    }
    if (entries.length > 0) {
      return entries;
    }
  }
  
  // Try splitting by bullets
  const bulletPattern = /(?:^|\n)\s*[•·\-\*]\s+/gm;
  const bulletMatches = [...text.matchAll(bulletPattern)];
  if (bulletMatches.length >= 2) {
    const entries: string[] = [];
    for (let i = 0; i < bulletMatches.length; i++) {
      const match = bulletMatches[i];
      if (!match || match.index === undefined) {
        continue;
      }
      const start = match.index + match[0].length;
      const nextMatch = i < bulletMatches.length - 1 ? bulletMatches[i + 1] : null;
      const end = nextMatch?.index ?? text.length;
      const entry = text.slice(start, end).trim();
      if (entry.length > MIN_ENTRY_LENGTH) {
        entries.push(entry);
      }
    }
    if (entries.length > 0) {
      return entries;
    }
  }
  
  // Try splitting by lines that look like new entries (capitalized, long lines)
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length > 3) {
    const entries: string[] = [];
    let currentEntry = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() ?? '';
      // Check if this looks like start of new entry
      const isNewEntry = i > 0 && (
        /^[A-Z][A-Za-z\s]{20,}/.test(line) && // Starts with capital, long line
        currentEntry.length > 50 && // Previous entry was substantial
        !line.match(/^(?:and|the|in|on|at|for|with|by|from|to)\s/i) // Not a continuation word
      );
      
      if (isNewEntry && currentEntry.length > MIN_ENTRY_LENGTH) {
        entries.push(currentEntry.trim());
        currentEntry = line;
      } else {
        currentEntry += (currentEntry ? '\n' : '') + line;
      }
    }
    
    if (currentEntry.trim().length > MIN_ENTRY_LENGTH) {
      entries.push(currentEntry.trim());
    }
    
    if (entries.length > 1) {
      return entries;
    }
  }
  
  // Fall back to double newlines
  return text
    .split(/\n\n+/)
    .map(e => e.trim())
    .filter(e => e.length > MIN_ENTRY_LENGTH);
}
