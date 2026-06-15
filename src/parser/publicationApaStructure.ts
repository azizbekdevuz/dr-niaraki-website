/**
 * APA citation structure — standard `Author (YYYY). Title. Journal` and
 * alternate `Author, A. Title (YYYY). Journal` seen in this CV.
 */

export type ApaCitationParts = {
  authors: string;
  /** Citation body after `). ` when title is parsed separately (alternate form). */
  body: string;
  year: number;
  /** Set for alternate form; empty for standard until title extraction runs on body. */
  title?: string;
};

const TITLE_LIKE_IN_AUTHORS =
  /\b(?:Selection|Mapping|Using|Site|System|Modeling|Analysis|Groundwater|Spatial|Designing|Learning|Potential)\b/;

function looksLikeAuthorsIncludeTitle(authors: string): boolean {
  return authors.length > 90 || (TITLE_LIKE_IN_AUTHORS.test(authors) && !/\(\d{4}/.test(authors));
}

function parseYear(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const year = parseInt(value, 10);
  if (year >= 1900 && year <= new Date().getFullYear() + 1) {
    return year;
  }
  return null;
}

/**
 * Parses author/year/body from a single citation block.
 */
export function parseApaCitationParts(text: string): ApaCitationParts | null {
  const trimmed = text.trim();

  const standard = trimmed.match(/^([^(]+?)\s*\((\d{4})(?:,\s*[A-Za-z]+)?\)\.\s*(.+)$/s);
  if (standard?.[1] && standard[2] && standard[3]) {
    const authors = standard[1].trim();
    const year = parseYear(standard[2]);
    const body = standard[3].trim();
    if (year !== null && !looksLikeAuthorsIncludeTitle(authors)) {
      return { authors, year, body };
    }
  }

  const alternate = trimmed.match(
    /^((?:[A-Z][^,()]+,\s*)+(?:&\s*(?:[A-Z][^,()]+,\s*)*[A-Z]\.))\s+(.+?)\s*\((\d{4})(?:,\s*[A-Za-z]+)?\)\.\s*(.+)$/s,
  );
  if (alternate?.[1] && alternate[2] && alternate[3] && alternate[4]) {
    const year = parseYear(alternate[3]);
    if (year !== null) {
      return {
        authors: alternate[1].trim(),
        title: alternate[2].trim(),
        year,
        body: alternate[4].trim(),
      };
    }
  }

  if (standard?.[1] && standard[2] && standard[3]) {
    const year = parseYear(standard[2]);
    if (year !== null) {
      return { authors: standard[1].trim(), year, body: standard[3].trim() };
    }
  }

  return null;
}

/** Count distinct APA author-year starts in a text block. */
export function countApaCitationStarts(text: string): number {
  const matches = text.match(/^[A-Z].{8,200}\(\d{4}(?:,\s*[A-Za-z]+)?\)\./gm);
  return matches?.length ?? 0;
}

/** Subsection heading blocks that bundle many citations — never a single publication. */
export function isPublicationSubsectionMegaBlob(text: string): boolean {
  const t = text.trim();
  if (/^BOOKS\s+AND\s+BOOK\s+CHAPTERS\b/im.test(t)) {
    return true;
  }
  if (/^JOURNAL\s+PAPERS\b/im.test(t) && countApaCitationStarts(t) > 2) {
    return true;
  }
  return false;
}
