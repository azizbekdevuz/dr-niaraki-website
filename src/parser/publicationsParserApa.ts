/**
 * APA-style block splitting for publication-heavy CV text.
 */

export function isPublicationProseNoiseLine(line: string): boolean {
  const t = line.trim();
  if (!t) {
    return false;
  }
  const l = t.toLowerCase();
  return (
    // Explicit section-preamble labels (any length)
    /^publication\s+summary\b/i.test(t) ||
    // Quantitative overview phrases (with or without leading bullet)
    /^[•·\u2013\u2014\-]?\s*(over \d+|multiple books|regular contributor|publications have contributed|\d+\+ years)/i.test(
      t,
    ) ||
    /peer-reviewed publications in top-tier/i.test(l) ||
    // "Publications in high-impact journals including:" — overview prose, not an entry
    /^[•·\u2013\u2014\-]?\s*publications?\s+in\s+/i.test(t) ||
    // "Research contributions in:" — CV summary prose block
    /^research\s+contributions?\s+in\b/i.test(t) ||
    // "Selected publications include..."
    /^selected\s+publications?\s+include/i.test(t) ||
    // Bullet / indented-dash lines with no APA year "(YYYY)." — these are
    // journal-name lists or qualitative bullets, never real citation entries.
    (/^[•·\u2013\u2014\-]\s+/.test(t) && !/\(\d{4}\)/.test(t))
  );
}

/**
 * Splits APA-style citation blocks (Author, A. (YYYY). Title...) common in this CV.
 */
export function splitPublicationApaBlocks(text: string): string[] {
  const lines = text.split('\n');
  const out: string[] = [];
  let cur = '';

  const flush = () => {
    const t = cur.trim();
    if (t.length >= 55) {
      const head = t.split('\n')[0]?.trim() ?? '';
      if (!isPublicationProseNoiseLine(head)) {
        out.push(t);
      }
    }
    cur = '';
  };

  const isSubHeader = (s: string) => {
    const x = s.trim();
    return (
      (
        /^(books?(\s+and\s+book\s+chapters)?|book chapters|journal papers|conference papers|publications?)\b/i.test(
          x,
        ) && x.length < 100
      ) ||
      // "Publication Summary" heading that precedes prose overview blocks
      /^publication\s+summary\b/i.test(x)
    );
  };

  const isNewApaEntry = (line: string) =>
    /^[A-Z].{12,240}\(\d{4}(?:,\s*[A-Za-z]+)?\)\.\s/.test(line.trim());

  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      continue;
    }
    if (isSubHeader(t)) {
      flush();
      continue;
    }
    if (isPublicationProseNoiseLine(t)) {
      flush();
      continue;
    }
    if (isNewApaEntry(line) && cur.length > 80) {
      flush();
      cur = line;
    } else {
      cur = cur ? `${cur}\n${line}` : line;
    }
  }
  flush();
  return out.filter((e) => e.length >= 55);
}
