/**
 * Venue/title contamination checks — avoids false "malformed" when journal
 * words appear inside titles (e.g. "remote sensing", "Groundwater"/"Water").
 */

/** True when journal is a substring of title only inside a longer word or phrase. */
export function isJournalAccidentalTitleSubstring(title: string, journal: string): boolean {
  const j = journal.trim();
  if (!j || j.length < 2) {
    return false;
  }

  const t = title.toLowerCase();
  const jl = j.toLowerCase();

  if (jl.includes(' ')) {
    const phrase = jl.split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
    const phraseRe = new RegExp(`\\b${phrase}\\b`, 'i');
    if (phraseRe.test(title)) {
      return true;
    }
    return false;
  }

  const wordRe = new RegExp(`\\b${jl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  if (wordRe.test(title)) {
    return true;
  }

  return t.includes(jl) && !wordRe.test(title);
}

/**
 * True when title incorrectly includes the venue string (parse bleed), not
 * methodology wording.
 */
export function isVenueBleedingIntoTitle(title: string, journal: string): boolean {
  const j = journal.trim();
  if (!j || j.length < 8) {
    return false;
  }
  const tl = title.toLowerCase();
  const jl = j.toLowerCase();
  if (!tl.includes(jl)) {
    return false;
  }
  if (isJournalAccidentalTitleSubstring(title, journal)) {
    return false;
  }
  return tl.startsWith(jl) || tl.endsWith(jl);
}

/**
 * Forensic M4-style check with word-boundary awareness.
 */
export function isMalformedPublicationVenue(
  title: string,
  journal: string | null | undefined,
): boolean {
  const j = (journal ?? '').trim();
  if (!j || j === '—' || j === '\u2014') {
    return false;
  }
  if (j.length < 3 || title.length <= 20) {
    return false;
  }
  if (j.length >= title.length * 0.85) {
    return false;
  }
  if (isJournalAccidentalTitleSubstring(title, j)) {
    return false;
  }
  if (isVenueBleedingIntoTitle(title, j)) {
    return true;
  }
  const jl = j.toLowerCase();
  const tl = title.toLowerCase();
  return tl.includes(jl);
}
