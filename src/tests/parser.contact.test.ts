/**
 * Contact parser unit tests
 */

import { describe, it, expect } from 'vitest';

import { parseContact } from '@/parser/contactParser';

describe('Contact Parser', () => {
  it('should extract email addresses', () => {
    const text = 'Email: professor@university.edu | Personal: prof@gmail.com';
    const result = parseContact(text);
    expect(result.data.email).toBeTruthy();
  });

  it('should extract phone numbers', () => {
    const text = 'Tel: +82-2-3277-2392 | Fax: +82-2-3277-2390';
    const result = parseContact(text);
    expect(result.data.phone).toBeTruthy();
  });

  it('should detect social links', () => {
    const text = 'LinkedIn: https://linkedin.com/in/professor | ResearchGate: https://researchgate.net/profile/prof';
    const result = parseContact(text);
    expect(result.data.social.linkedin).toBeTruthy();
    expect(result.data.social.researchGate).toBeTruthy();
  });

  it('should categorize official vs personal emails', () => {
    const text = 'Contact: prof@sejong.ac.kr, personal.email@gmail.com';
    const result = parseContact(text);
    expect(result.data.email).toContain('sejong');
    expect(result.data.personalEmail).toContain('gmail');
  });

  it('should classify x.com and twitter.com URLs as twitter', () => {
    const text = 'Twitter: https://x.com/professor | Also: https://twitter.com/professor';
    const result = parseContact(text);
    expect(result.data.social.twitter).toMatch(/x\.com|twitter\.com/);
  });

  it('should not classify unrelated domains containing "x.com" substring as twitter', () => {
    const text = 'Website: https://fax.company.com/page | CV: https://example.com/x.com/path';
    const result = parseContact(text);
    expect(result.data.social.twitter).toBeUndefined();
  });
});
