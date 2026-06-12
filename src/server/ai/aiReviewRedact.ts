import 'server-only';

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const URL_RE = /https?:\/\/[^\s<>"\]]+/gi;
const PHONE_RE = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;

export function redactSensitiveText(text: string): string {
  return text
    .replace(EMAIL_RE, '[redacted-email]')
    .replace(URL_RE, '[redacted-url]')
    .replace(PHONE_RE, (m) => (m.replace(/\D/g, '').length >= 7 ? '[redacted-phone]' : m));
}
