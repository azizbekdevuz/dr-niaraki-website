/**
 * Extracts year from text using various patterns
 */
export function extractYear(text: string): number | null {
  // Try patterns like (2024), 2024, 2024., etc.
  const patterns = [
    /\((\d{4})\)/,           // (2024)
    /\b(19\d{2}|20\d{2})\b/, // 1999 or 20XX
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const year = parseInt(match[1] ?? '', 10);
      if (year >= 1900 && year <= new Date().getFullYear() + 1) {
        return year;
      }
    }
  }
  
  return null;
}
