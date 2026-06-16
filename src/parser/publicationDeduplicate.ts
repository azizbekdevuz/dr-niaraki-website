/**
 * Post-parse publication deduplication — narrow semantic identity, no hardcoded titles.
 */

import type { MutablePublication, Publication } from '@/types/details';
import type { ParseWarning } from '@/types/parser';

import { createWarning } from './parserUtils';

function normalizePublicationDoi(raw: string | undefined): string {
  if (!raw) {
    return '';
  }
  let s = raw.trim().toLowerCase();
  s = s.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  s = s.replace(/^doi:\s*/i, '');
  return s.trim();
}

export type PublicationDedupResult = {
  data: Publication[];
  warnings: ParseWarning[];
  removedCount: number;
  recoveredTitleCount: number;
};

/** Title clearly truncated (e.g. author middle initial mistaken as title). */
export function isTruncatedPublicationTitle(title: string): boolean {
  const t = title.trim();
  return t.length <= 3 || /^[A-Z]\.?$/.test(t);
}

/** Recover title from APA raw when structured title is truncated. */
export function recoverPublicationTitleFromRaw(raw: string): string | null {
  const trimmed = raw.trim();
  const afterYear = trimmed.match(/\(\d{4}(?:,\s*[A-Za-z]+)?\)\.\s*(.+)$/s);
  if (!afterYear?.[1]) {
    return null;
  }
  const body = afterYear[1].trim();
  const journalBreak = body.search(
    /\.\s+(?:[A-Z][A-Za-z]+(?:\s+[A-Za-z]+){0,8},|\(?SCIE|\(?SSCI)/,
  );
  const title =
    journalBreak > 20
      ? body.slice(0, journalBreak).replace(/\.\s*$/, '').trim()
      : body.split(/\.\s+(?:[A-Z][a-z])/)[0]?.trim() ?? '';
  if (title.length < 15 || isTruncatedPublicationTitle(title)) {
    return null;
  }
  return title;
}

function normalizePubTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[^a-z0-9\s]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function authorSurnameKey(authors: string | null | undefined): string {
  if (!authors) {
    return '';
  }
  const parts = authors
    .split(/[,;&]/)
    .map((p) => p.trim().split(/\s+/).pop()?.toLowerCase() ?? '')
    .filter((s) => s.length > 1);
  return parts.slice(0, 4).sort().join('|');
}

export type IdentityConfidence = 'high' | 'medium' | 'low';

export function publicationIdentityKeys(
  pub: Pick<Publication, 'title' | 'authors' | 'year' | 'doi' | 'raw'>,
): Array<{ key: string; confidence: IdentityConfidence }> {
  const keys: Array<{ key: string; confidence: IdentityConfidence }> = [];
  const doi = normalizePublicationDoi(pub.doi ?? undefined);
  if (doi) {
    keys.push({ key: `doi:${doi}`, confidence: 'high' });
  }
  const title = normalizePubTitle(pub.title);
  const authors = authorSurnameKey(pub.authors);
  if (title.length >= 20 && pub.year) {
    keys.push({ key: `tya:${title}|${pub.year}|${authors}`, confidence: 'high' });
    keys.push({ key: `ty:${title}|${pub.year}`, confidence: 'medium' });
  }
  const rawNorm = (pub.raw ?? '').replace(/\s+/g, ' ').trim().slice(0, 140);
  if (rawNorm.length >= 90) {
    keys.push({ key: `raw:${rawNorm.toLowerCase()}`, confidence: 'high' });
  }
  return keys;
}

function publicationCompletenessScore(pub: Publication): number {
  let score = 0;
  score += (pub.title?.length ?? 0) * 2;
  score += pub.authors ? 20 : 0;
  score += pub.journal ? 15 : 0;
  score += pub.doi ? 30 : 0;
  score += pub.volume ? 5 : 0;
  score += pub.issue ? 3 : 0;
  score += pub.pages ? 3 : 0;
  score += pub.impactFactor ? 5 : 0;
  score += pub.quartile ? 3 : 0;
  score += (pub.raw?.length ?? 0);
  if (isTruncatedPublicationTitle(pub.title)) {
    score -= 500;
  }
  return score;
}

function mergePublicationMetadata(target: MutablePublication, source: Publication): void {
  if (!target.authors && source.authors) {
    target.authors = source.authors;
  }
  if (!target.journal && source.journal) {
    target.journal = source.journal;
  }
  if (!target.doi && source.doi) {
    target.doi = source.doi;
    target.link = source.link ?? target.link;
  }
  if (!target.volume && source.volume) {
    target.volume = source.volume;
  }
  if (!target.issue && source.issue) {
    target.issue = source.issue;
  }
  if (!target.pages && source.pages) {
    target.pages = source.pages;
  }
  if (!target.impactFactor && source.impactFactor) {
    target.impactFactor = source.impactFactor;
  }
  if (!target.quartile && source.quartile) {
    target.quartile = source.quartile;
  }
  if ((target.raw?.length ?? 0) < (source.raw?.length ?? 0) && source.raw) {
    target.raw = source.raw;
  }
}

function isExactPublicationDuplicate(a: Publication, b: Publication): boolean {
  if (a.year !== b.year) {
    return false;
  }
  if (normalizePubTitle(a.title) !== normalizePubTitle(b.title)) {
    return false;
  }
  const aa = (a.authors ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  const ab = (b.authors ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  return aa.length > 0 && aa === ab;
}

function findHighConfidenceDuplicateIndex(
  selfIndex: number,
  pub: Publication,
  pool: Publication[],
  consumed: Set<number>,
): number | null {
  for (let i = 0; i < pool.length; i++) {
    if (i === selfIndex || consumed.has(i)) {
      continue;
    }
    const other = pool[i]!;
    if (isExactPublicationDuplicate(pub, other)) {
      return i;
    }
  }

  const keys = publicationIdentityKeys(pub).filter((k) => k.confidence === 'high');
  if (keys.length === 0) {
    return null;
  }
  for (let i = 0; i < pool.length; i++) {
    if (i === selfIndex || consumed.has(i)) {
      continue;
    }
    const other = pool[i]!;
    const otherKeys = publicationIdentityKeys(other)
      .filter((k) => k.confidence === 'high')
      .map((k) => k.key);
    if (keys.some((k) => otherKeys.includes(k.key))) {
      if (pub.year && other.year && pub.year !== other.year) {
        continue;
      }
      const pubAuthors = authorSurnameKey(pub.authors);
      const otherAuthors = authorSurnameKey(other.authors);
      if (pubAuthors && otherAuthors && pubAuthors !== otherAuthors) {
        continue;
      }
      return i;
    }
  }
  return null;
}

/**
 * Recover truncated titles, then collapse high-confidence duplicate records.
 */
export function deduplicatePublications(
  publications: readonly Publication[],
  warningIndexOffset = 0,
): PublicationDedupResult {
  const warnings: ParseWarning[] = [];
  const working: MutablePublication[] = publications.map((p) => ({ ...p }));

  let recoveredTitleCount = 0;
  for (let i = 0; i < working.length; i++) {
    const pub = working[i]!;
    if (isTruncatedPublicationTitle(pub.title) && pub.raw) {
      const recovered = recoverPublicationTitleFromRaw(pub.raw);
      if (recovered) {
        pub.title = recovered;
        recoveredTitleCount += 1;
        warnings.push(
          createWarning(
            'publications',
            `Publication ${warningIndexOffset + i + 1}: recovered truncated title from raw citation`,
            'info',
            warningIndexOffset + i,
            recovered.slice(0, 80),
          ),
        );
      }
    }
  }

  const consumed = new Set<number>();
  const survivors: MutablePublication[] = [];
  let removedCount = 0;

  for (let i = 0; i < working.length; i++) {
    if (consumed.has(i)) {
      continue;
    }
    const current = working[i]!;
    const dupIdx = findHighConfidenceDuplicateIndex(i, current, working, consumed);
    if (dupIdx === null) {
      survivors.push(current);
      consumed.add(i);
      continue;
    }
    const duplicate = working[dupIdx]!;
    const keepCurrent = publicationCompletenessScore(current) >= publicationCompletenessScore(duplicate);
    const keeper = keepCurrent ? current : duplicate;
    const loser = keepCurrent ? duplicate : current;
    mergePublicationMetadata(keeper, loser);
    mergePublicationMetadata(keeper, keepCurrent ? duplicate : current);
    survivors.push(keeper);
    consumed.add(i);
    consumed.add(dupIdx);
    removedCount += 1;
    warnings.push(
      createWarning(
        'publications',
        `Removed duplicate publication (kept ${keeper.id}, dropped ${loser.id})`,
        'warning',
        warningIndexOffset + i,
        keeper.title.slice(0, 80),
      ),
    );
  }

  return {
    data: survivors as Publication[],
    warnings,
    removedCount,
    recoveredTitleCount,
  };
}
