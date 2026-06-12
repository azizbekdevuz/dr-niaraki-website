import crypto from 'node:crypto';

/**
 * Generates a stable ID from text using slug + short hash
 */
export function generateStableId(text: string, index?: number): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
  
  const hash = crypto
    .createHash('md5')
    .update(text + (index ?? ''))
    .digest('hex')
    .slice(0, 8);
  
  return `${slug}-${hash}`;
}
