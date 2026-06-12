import 'server-only';

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const URL_RE = /https?:\/\/[^\s<>"\]]+/gi;
const PHONE_RE = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;

const DAY = '(?:0[1-9]|[12]\\d|3[01])';
const MONTH = '(?:0[1-9]|1[0-2])';
const YEAR = '(?:19|20)\\d{2}';

const ISO_DATE_RE = new RegExp(`\\b${YEAR}[-/.]${MONTH}[-/.]${DAY}\\b`, 'g');
const DMY_DATE_RE = new RegExp(`\\b${DAY}[-/.]${MONTH}[-/.]${YEAR}\\b`, 'g');
const YEAR_RANGE_RE = /\b(19|20)\d{2}\s*-\s*(19|20)\d{2}\b/g;

const DATE_TOKEN_PREFIX = '\x00DATE';
const DATE_TOKEN_SUFFIX = '\x00';

function protectPattern(text: string, re: RegExp, tokens: string[]): string {
  return text.replace(re, (match) => {
    const idx = tokens.length;
    tokens.push(match);
    return `${DATE_TOKEN_PREFIX}${idx}${DATE_TOKEN_SUFFIX}`;
  });
}

function restoreProtected(text: string, tokens: string[]): string {
  return text.replace(
    new RegExp(`${DATE_TOKEN_PREFIX}(\\d+)${DATE_TOKEN_SUFFIX}`, 'g'),
    (_m, idx) => tokens[Number(idx)] ?? _m,
  );
}

function protectDatesAndYearRanges(text: string): { text: string; tokens: string[] } {
  const tokens: string[] = [];
  let out = text;
  out = protectPattern(out, YEAR_RANGE_RE, tokens);
  out = protectPattern(out, ISO_DATE_RE, tokens);
  out = protectPattern(out, DMY_DATE_RE, tokens);
  return { text: out, tokens };
}

export function redactSensitiveText(text: string): string {
  const { text: protectedText, tokens } = protectDatesAndYearRanges(text);
  const redacted = protectedText
    .replace(EMAIL_RE, '[redacted-email]')
    .replace(URL_RE, '[redacted-url]')
    .replace(PHONE_RE, (m) => (m.replace(/\D/g, '').length >= 7 ? '[redacted-phone]' : m));
  return restoreProtected(redacted, tokens);
}
