/**
 * Extracts patent number from text
 */
export function extractPatentNumber(text: string): string | null {
  const patterns = [
    // US publication/application (e.g. US 2025/0166525 A1)
    /\bUS\s*(\d{4}\/\d{7}\s*A\d)\b/i,
    /\b(\d{4}\/\d{7}\s*A\d)\b/i,
    // US application serial (e.g. 19/326,960 or Application No. 18/821,509)
    /\b(\d{2}\/\d{3},\d{3})\b/,
    /US\s*(?:Patent\s*(?:No\.?)?\s*)?(\d{1,3}[,.]?\d{3}[,.]?\d{3}(?:[A-Z]\d)?)/i,
    /(?:Patent\s*No\.?\s*)(10-\d{6,9})\b/i,
    /\b(10-\d{4}-\d{7})\b/,
    /\b(10-\d{6,9})\b/,
    /(?:Application\s*No\.?\s*)?(\d{2}-\d{4}-\d{7})/i,
    /(?:Patent\s*(?:No\.?)?\s*)?(\d{2}-\d{7})(?!\d)/i,
    /\b(Application\s+No\.?\s*10-\d{4}-\d{7})\b/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  
  return null;
}

/**
 * Determines patent status from text
 */
export function determinePatentStatus(text: string): 'registered' | 'pending' | 'expired' | null {
  const lower = text.toLowerCase();

  // Phrase-specific before generic "application"
  if (/\b(?:patent\s+)?registration\s+completed\b/i.test(text)) {
    return 'registered';
  }
  if (lower.includes('registered') || lower.includes('granted') || lower.includes('issued')) {
    return 'registered';
  }
  if (/\b(?:patent\s+)?application\s+completed\b/i.test(text)) {
    return 'pending';
  }
  if (lower.includes('pending') || lower.includes('under examination')) {
    return 'pending';
  }
  if (/\bapplication\b/i.test(text) && !/\bregistration\b/i.test(text)) {
    return 'pending';
  }
  if (lower.includes('expired')) {
    return 'expired';
  }

  return null;
}

/**
 * Determines patent type from text
 */
export function determinePatentType(text: string): 'international' | 'korean' | 'other' | null {
  // Korean patent-office numbers first — avoids false US match inside "apparatus of"
  if (/\b10-\d{4,}/.test(text)) {
    return 'korean';
  }

  if (
    /\bkorean\s+patent\b/i.test(text) ||
    /\brepublic\s+of\s+korea\b/i.test(text) ||
    /\bkipo\b/i.test(text) ||
    /\bkorea\b/i.test(text) ||
    /한국/.test(text)
  ) {
    return 'korean';
  }

  if (
    /\bus\s+patent\b/i.test(text) ||
    /\binternational\s+patent\b/i.test(text) ||
    /\bunited\s+states\b/i.test(text) ||
    /\buspto\b/i.test(text) ||
    /\bUS\s+International\s+Patent\b/.test(text)
  ) {
    return 'international';
  }

  if (/\bUS\s*(?:\d{4}\/\d{7}|\d{1,3}[,.]?\d{3}[,.]?\d{3})/i.test(text)) {
    return 'international';
  }

  return 'other';
}
