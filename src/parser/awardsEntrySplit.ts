/**
 * Award-specific entry splitting (distinct from generic splitEntries).
 */

export function splitAwardEntries(text: string): string[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const entries: string[] = [];
  let current = '';

  const isNewAwardLine = (line: string): boolean => {
    if (line.length < 20) {
      return false;
    }
    if (/^professional\s+memberships/i.test(line)) {
      return false;
    }
    if (/^(?:Recognized for|For |Certificate issued|Honored for|Awarded for)\b/i.test(line)) {
      return false;
    }
    return (
      /^(?:\d{1,2}(?:st|nd|rd|th)\s)/i.test(line) ||
      /^(?:19|20)\d{2}\s/.test(line) ||
      /^(?:Recognized|Appointed|Certificate|Keynote|Honou?rable|Award|Selected|BEST|NATIONALLY|AUSTRALIAN|KOREAN|Editorial|Ministerial|BK21)\b/i.test(
        line,
      )
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (/^professional\s+memberships/i.test(line)) {
      break;
    }
    if (i > 0 && isNewAwardLine(line) && current.length > 30) {
      entries.push(current.trim());
      current = line;
    } else {
      current += (current ? '\n' : '') + line;
    }
  }

  if (current.trim().length >= 20) {
    entries.push(current.trim());
  }

  return entries;
}
