/**
 * Generic semantic identity helpers for candidate review (no record-specific rules).
 */

import type { PublicationItem, SiteContent } from '@/content/schema';
import { publicationIdentityKeys } from '@/parser/publicationDeduplicate';
import type { Award, Publication } from '@/types/details';

export function normalizeReviewTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function titleTokenSimilarity(a: string, b: string): number {
  const tokenize = (s: string) =>
    new Set(normalizeReviewTitle(s).split(' ').filter((w) => w.length > 3));
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  if (tokensA.size === 0 || tokensB.size === 0) {
    return 0;
  }
  let overlap = 0;
  for (const w of tokensA) {
    if (tokensB.has(w)) {
      overlap += 1;
    }
  }
  return overlap / Math.max(tokensA.size, tokensB.size);
}

export type SourceTextIndex = {
  normalizedText: string;
  apaTitlePhrases: ReadonlySet<string>;
};

export type SourceMentionEvidence = {
  found: boolean;
  method: 'exact' | 'apa-title' | 'contiguous-token-sequence' | 'none';
  confidence: 'high' | 'medium' | 'low';
};

/** Extract APA-style title phrases from raw HTML/plain source text. */
export function buildSourceTextIndex(rawHtml: string | null | undefined): SourceTextIndex {
  const plain = (rawHtml ?? '').replace(/<[^>]+>/g, ' ');
  const normalizedText = normalizeReviewTitle(plain);
  const apaTitlePhrases = new Set<string>();
  for (const m of plain.matchAll(/\(\d{4}(?:,\s*[a-z]+)?\)\.\s+([^.(]{15,140}?)\./gi)) {
    const phrase = normalizeReviewTitle(m[1] ?? '');
    if (phrase.length >= 12) {
      apaTitlePhrases.add(phrase);
    }
  }
  return { normalizedText, apaTitlePhrases };
}

/** Maximum filler tokens allowed between consecutive title tokens in bounded-gap matching. */
export const SOURCE_TITLE_MAX_INTER_TOKEN_GAP = 2;

function significantTitleTokens(normalizedPhrase: string): string[] {
  return normalizedPhrase.split(' ').filter((w) => w.length > 4);
}

/**
 * Sliding window on significant tokens only (length > 4).
 */
export function hasSlidingTokenWindow(
  normalizedHaystack: string,
  titleTokens: readonly string[],
): boolean {
  if (titleTokens.length < 3) {
    return false;
  }
  const haystackTokens = significantTitleTokens(normalizeReviewTitle(normalizedHaystack));
  if (haystackTokens.length < titleTokens.length) {
    return false;
  }
  for (let i = 0; i <= haystackTokens.length - titleTokens.length; i++) {
    let matched = true;
    for (let j = 0; j < titleTokens.length; j++) {
      if (haystackTokens[i + j] !== titleTokens[j]) {
        matched = false;
        break;
      }
    }
    if (matched) {
      return true;
    }
  }
  return false;
}

/**
 * Bounded-gap on significant tokens only: title tokens in order with at most `maxGap` fillers between pairs.
 */
export function hasBoundedGapTokenSequence(
  normalizedHaystack: string,
  titleTokens: readonly string[],
  maxGap: number = SOURCE_TITLE_MAX_INTER_TOKEN_GAP,
): boolean {
  if (titleTokens.length < 3) {
    return false;
  }
  const haystackTokens = significantTitleTokens(normalizeReviewTitle(normalizedHaystack));
  if (haystackTokens.length < titleTokens.length) {
    return false;
  }

  for (let start = 0; start < haystackTokens.length; start++) {
    let hayIdx = start;
    let titleIdx = 0;
    let gapCount = 0;

    while (hayIdx < haystackTokens.length && titleIdx < titleTokens.length) {
      if (haystackTokens[hayIdx] === titleTokens[titleIdx]) {
        titleIdx += 1;
        hayIdx += 1;
        gapCount = 0;
        continue;
      }
      gapCount += 1;
      if (gapCount > maxGap) {
        break;
      }
      hayIdx += 1;
    }

    if (titleIdx === titleTokens.length) {
      return true;
    }
  }
  return false;
}

/**
 * Conservative source mention check — scattered tokens across the CV do not qualify.
 */
export function evaluateSourceMentionEvidence(
  title: string,
  index: SourceTextIndex,
): SourceMentionEvidence {
  const key = normalizeReviewTitle(title);
  if (!key) {
    return { found: false, method: 'none', confidence: 'low' };
  }

  if (index.normalizedText.includes(key)) {
    return { found: true, method: 'exact', confidence: 'high' };
  }

  if (index.apaTitlePhrases.has(key)) {
    return { found: true, method: 'apa-title', confidence: 'high' };
  }

  for (const phrase of index.apaTitlePhrases) {
    if (phrase.includes(key) || key.includes(phrase)) {
      return { found: true, method: 'apa-title', confidence: 'medium' };
    }
  }

  const tokens = significantTitleTokens(key);
  if (hasSlidingTokenWindow(index.normalizedText, tokens)) {
    return { found: true, method: 'contiguous-token-sequence', confidence: 'medium' };
  }
  if (hasBoundedGapTokenSequence(index.normalizedText, tokens)) {
    return { found: true, method: 'contiguous-token-sequence', confidence: 'low' };
  }

  return { found: false, method: 'none', confidence: 'low' };
}

/** @deprecated Use `evaluateSourceMentionEvidence`. */
export function isTitleMentionedInSource(title: string, index: SourceTextIndex): boolean {
  return evaluateSourceMentionEvidence(title, index).found;
}

export function isAuthorStringPublicationTitle(title: string): boolean {
  const t = title.trim();
  return /^[A-Z][a-z]+,\s+[A-Z]\./.test(t) && !/\(\d{4}/.test(t) && t.length < 80;
}

/** Awards list rows that belong in service/membership narrative, not `about.awards`. */
export function isAwardWrongSectionArtifact(title: string): boolean {
  const t = normalizeReviewTitle(title);
  if (!t) {
    return false;
  }
  if (/^professional memberships?$/.test(t)) {
    return true;
  }
  if (/\bmemberships?\b/.test(t) && !/\baward\b/.test(t) && !/\bfellowship\b/.test(t) && !/\bfellow\b/.test(t)) {
    return true;
  }
  return false;
}

export function publicationItemToDetails(pub: PublicationItem): Publication {
  return {
    id: pub.id,
    title: pub.title,
    authors: pub.authors,
    journal: pub.journal,
    year: pub.year,
    type: pub.type === 'book' ? 'book' : pub.type,
    doi: pub.doi ?? null,
    volume: null,
    issue: null,
    pages: null,
    link: null,
    impactFactor: pub.impactFactor ?? null,
    quartile: pub.quartile ?? null,
    raw: null,
  };
}

export function awardItemToDetails(a: SiteContent['about']['awards'][number]): Award {
  return {
    id: a.id,
    title: a.title,
    organization: a.organization,
    year: a.year,
    category: a.category,
    details: a.details,
    raw: a.impact,
  };
}

export function isBaselinePublicationSuperseded(
  base: PublicationItem,
  candidate: readonly Publication[],
): boolean {
  const basePub = publicationItemToDetails(base);
  const baseKeys = new Set(
    publicationIdentityKeys(basePub)
      .filter((k) => k.confidence !== 'low')
      .map((k) => k.key),
  );
  for (const c of candidate) {
    const candidateKeys = publicationIdentityKeys(c).filter((k) => k.confidence !== 'low');
    if (candidateKeys.some((k) => baseKeys.has(k.key))) {
      return true;
    }
    if (c.year === base.year && titleTokenSimilarity(c.title, base.title) >= 0.55) {
      return true;
    }
  }
  return false;
}

export function isAwardMatchedByCandidate(
  base: SiteContent['about']['awards'][number],
  candidate: readonly Award[],
): boolean {
  const baseKey = normalizeReviewTitle(base.title);
  for (const c of candidate) {
    const candidateKey = normalizeReviewTitle(c.title);
    if (candidateKey === baseKey) {
      return true;
    }
    if (titleTokenSimilarity(c.title, base.title) >= 0.55) {
      return true;
    }
  }
  return false;
}

const AWARD_CLUSTER_SIMILARITY = 0.65;

/** Group baseline award ids that likely describe the same event. */
export function clusterBaselineAwardIds(
  awards: readonly SiteContent['about']['awards'][number][],
): string[][] {
  const clusters: string[][] = [];
  const consumed = new Set<string>();

  for (let i = 0; i < awards.length; i++) {
    const a = awards[i]!;
    if (consumed.has(a.id)) {
      continue;
    }
    const cluster = [a.id];
    consumed.add(a.id);
    for (let j = i + 1; j < awards.length; j++) {
      const b = awards[j]!;
      if (consumed.has(b.id)) {
        continue;
      }
      if (titleTokenSimilarity(a.title, b.title) >= AWARD_CLUSTER_SIMILARITY) {
        cluster.push(b.id);
        consumed.add(b.id);
      }
    }
    if (cluster.length > 1) {
      clusters.push(cluster);
    }
  }
  return clusters;
}

export function clusterMemberIds(decision: {
  existingId?: string;
  relatedExistingIds?: string[];
}): string[] {
  if (!decision.existingId) {
    return [];
  }
  return [decision.existingId, ...(decision.relatedExistingIds ?? [])];
}

export function makeDecisionId(parts: string[]): string {
  return parts.filter(Boolean).join(':');
}
