/**
 * Extracts email addresses from text
 */
export function extractEmails(text: string): string[] {
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.match(emailPattern) || [];
}

/**
 * Extracts phone numbers from text
 */
export function extractPhoneNumbers(text: string): string[] {
  const phonePattern = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
  const matches = text.match(phonePattern) || [];
  return matches.filter(p => p.replace(/\D/g, '').length >= 7);
}

/**
 * Extracts URLs from text
 */
export function extractUrls(text: string): string[] {
  const urlPattern = /https?:\/\/[^\s<>"\]]+/gi;
  return text.match(urlPattern) || [];
}
