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
export function determinePatentStatus(text: string): 'registered' | 'pending' | 'completed' | 'expired' | null {
  const lower = text.toLowerCase();
  
  if (lower.includes('registered') || lower.includes('granted')) {
    return 'registered';
  }
  if (lower.includes('pending') || lower.includes('under examination') || lower.includes('application')) {
    return 'pending';
  }
  if (lower.includes('completed') || lower.includes('issued')) {
    return 'completed';
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
  const lower = text.toLowerCase();
  
  if (lower.includes('us patent') || lower.includes('international patent') || lower.includes('us ')) {
    return 'international';
  }
  if (lower.includes('korean') || lower.includes('korea') || /10-\d{7}/.test(text)) {
    return 'korean';
  }
  
  return 'other';
}
