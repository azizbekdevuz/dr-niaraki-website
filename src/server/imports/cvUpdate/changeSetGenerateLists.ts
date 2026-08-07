/**
 * CV-controlled list comparison for change-set generation.
 * Equality uses semantic payloads only (no generated IDs / raw fields).
 */

import type { SiteContent } from '@/content/schema';
import {
  makeDecisionId,
  titleTokenSimilarity,
} from '@/server/imports/candidateReviewIdentity';
import type {
  AcceptedCvNormalizedSnapshot,
  CvChangeItem,
  CvChangeSectionKey,
  NormalizedListItem,
} from '@/server/imports/cvUpdate/changeSetTypes';
import { websiteListById } from '@/server/imports/cvUpdate/changeSetWebsiteValues';
import {
  matchTitleKey,
  normalizeIdentityNumber,
  normalizeSemanticText,
  semanticAppointment,
  semanticAward,
  semanticDiffPaths,
  semanticEducation,
  semanticEqual,
  semanticPatent,
  semanticProject,
  semanticPublication,
} from '@/server/imports/cvUpdate/semanticEquality';
import { detectTruncatedCandidate } from '@/server/imports/cvUpdate/truncationDetect';

const FUZZY_TITLE_THRESHOLD = 0.75;

type ListSectionDef = {
  listKey: keyof AcceptedCvNormalizedSnapshot['lists'];
  sectionKey: CvChangeSectionKey;
  fieldPath: string;
  label: string;
};

export const CV_LIST_SECTIONS: readonly ListSectionDef[] = [
  { listKey: 'publications', sectionKey: 'publications', fieldPath: 'publications.items', label: 'Publications' },
  { listKey: 'patents', sectionKey: 'patents', fieldPath: 'patents.items', label: 'Patents' },
  { listKey: 'education', sectionKey: 'education', fieldPath: 'about.journey', label: 'Education' },
  { listKey: 'appointments', sectionKey: 'appointments', fieldPath: 'about.experiences', label: 'Appointments' },
  { listKey: 'awards', sectionKey: 'awards', fieldPath: 'about.awards', label: 'Awards' },
  { listKey: 'projects', sectionKey: 'projects', fieldPath: 'research.projects', label: 'Projects' },
] as const;

type ListMatchKind = 'id' | 'fingerprint' | 'number' | 'title' | 'fuzzy';

type MatchedPair = {
  previous: NormalizedListItem;
  candidate: NormalizedListItem;
  matchKind: ListMatchKind;
};

export type ListSectionCounts = {
  changes: number;
  unchanged: number;
  requiresReview: number;
  safelyPrepared: number;
};

function payloadField(payload: unknown, key: string): unknown {
  if (!payload || typeof payload !== 'object') {return undefined;}
  return (payload as Record<string, unknown>)[key];
}

function itemNumberKey(item: NormalizedListItem): string | null {
  return normalizeIdentityNumber(payloadField(item.payload, 'number'));
}

function itemCountryKey(item: NormalizedListItem): string | null {
  return normalizeSemanticText(payloadField(item.payload, 'country'))?.toLowerCase() ?? null;
}

/** Prefer exact identity keys; avoid pairing same-title KR/US patent filings. */
function titleMatchScore(prev: NormalizedListItem, cand: NormalizedListItem): number {
  if (semanticEqual(prev.payload, cand.payload)) {return 1000;}
  if (prev.fingerprint && cand.fingerprint && prev.fingerprint === cand.fingerprint) {return 900;}

  const prevNum = itemNumberKey(prev);
  const candNum = itemNumberKey(cand);
  if (prevNum && candNum) {
    if (prevNum === candNum) {return 800;}
    // Different explicit numbers → not the same record even if titles match.
    return -1;
  }

  const prevCountry = itemCountryKey(prev);
  const candCountry = itemCountryKey(cand);
  if (prevCountry && candCountry && prevCountry === candCountry) {return 50;}
  if (prevCountry && candCountry && prevCountry !== candCountry) {return 5;}
  return 10;
}

function matchListItems(
  previous: readonly NormalizedListItem[],
  candidate: readonly NormalizedListItem[],
): { pairs: MatchedPair[]; previousOnly: NormalizedListItem[]; candidateOnly: NormalizedListItem[] } {
  const prevRemaining = [...previous];
  const candRemaining = [...candidate];
  const pairs: MatchedPair[] = [];

  const takePair = (prevIdx: number, candIdx: number, matchKind: ListMatchKind) => {
    const prev = prevRemaining[prevIdx];
    const cand = candRemaining[candIdx];
    if (!prev || !cand) {return;}
    pairs.push({ previous: prev, candidate: cand, matchKind });
    candRemaining.splice(candIdx, 1);
    prevRemaining.splice(prevIdx, 1);
  };

  for (let i = prevRemaining.length - 1; i >= 0; i -= 1) {
    const prev = prevRemaining[i];
    if (!prev) {continue;}
    const idx = candRemaining.findIndex((c) => c.stableId === prev.stableId);
    if (idx >= 0) {takePair(i, idx, 'id');}
  }

  for (let i = prevRemaining.length - 1; i >= 0; i -= 1) {
    const prev = prevRemaining[i];
    if (!prev?.fingerprint) {continue;}
    const idx = candRemaining.findIndex((c) => c.fingerprint === prev.fingerprint);
    if (idx >= 0) {takePair(i, idx, 'fingerprint');}
  }

  for (let i = prevRemaining.length - 1; i >= 0; i -= 1) {
    const prev = prevRemaining[i];
    if (!prev) {continue;}
    const prevNum = itemNumberKey(prev);
    if (!prevNum) {continue;}
    const idx = candRemaining.findIndex((c) => itemNumberKey(c) === prevNum);
    if (idx >= 0) {takePair(i, idx, 'number');}
  }

  for (let i = prevRemaining.length - 1; i >= 0; i -= 1) {
    const prev = prevRemaining[i];
    if (!prev) {continue;}
    const prevTitle = matchTitleKey(prev.title);
    if (!prevTitle) {continue;}

    let bestIdx = -1;
    let bestScore = 0;
    for (let j = 0; j < candRemaining.length; j += 1) {
      const cand = candRemaining[j];
      if (!cand) {continue;}
      if (matchTitleKey(cand.title) !== prevTitle) {continue;}
      const score = titleMatchScore(prev, cand);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = j;
      }
    }
    // Require a positive disambiguation score so same-title different-number pairs stay unmatched.
    if (bestIdx >= 0 && bestScore > 0) {takePair(i, bestIdx, 'title');}
  }

  for (let i = prevRemaining.length - 1; i >= 0; i -= 1) {
    const prev = prevRemaining[i];
    if (!prev) {continue;}
    let bestIdx = -1;
    let bestScore = 0;
    for (let j = 0; j < candRemaining.length; j += 1) {
      const cand = candRemaining[j];
      if (!cand) {continue;}
      // Do not fuzzy-match across different explicit identity numbers.
      const prevNum = itemNumberKey(prev);
      const candNum = itemNumberKey(cand);
      if (prevNum && candNum && prevNum !== candNum) {continue;}
      const score = titleTokenSimilarity(prev.title, cand.title);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = j;
      }
    }
    if (bestIdx >= 0 && bestScore >= FUZZY_TITLE_THRESHOLD) {
      takePair(i, bestIdx, 'fuzzy');
    }
  }

  return { pairs, previousOnly: prevRemaining, candidateOnly: candRemaining };
}

function listItemTruncated(websiteTitle: string | undefined, candidateTitle: string): boolean {
  if (!websiteTitle) {return false;}
  return detectTruncatedCandidate(websiteTitle, candidateTitle).truncated;
}

function websiteSemanticPayload(
  listKey: ListSectionDef['listKey'],
  websiteValue: unknown,
): unknown | null {
  if (!websiteValue || typeof websiteValue !== 'object') {return null;}
  const row = websiteValue as Record<string, unknown>;
  switch (listKey) {
    case 'publications':
      return semanticPublication(row);
    case 'patents':
      return semanticPatent(row);
    case 'education':
      return semanticEducation(row);
    case 'appointments':
      return semanticAppointment(row);
    case 'awards':
      return semanticAward(row);
    case 'projects':
      return semanticProject(row);
    default:
      return null;
  }
}

function buildListChangeItem(input: {
  section: ListSectionDef;
  kind: CvChangeItem['kind'];
  itemKey: string;
  label: string;
  summary: string;
  previous?: NormalizedListItem;
  candidate?: NormalizedListItem;
  websiteValue?: unknown;
  safelyPrepared: boolean;
  requiresReview: boolean;
  warnings?: string[];
}): CvChangeItem {
  return {
    id: makeDecisionId(['change', input.section.sectionKey, input.itemKey, input.kind]),
    sectionKey: input.section.sectionKey,
    fieldPath: input.section.fieldPath,
    itemKey: input.itemKey,
    kind: input.kind,
    ownership: 'cv',
    safelyPrepared: input.safelyPrepared,
    requiresReview: input.requiresReview,
    label: input.label,
    summary: input.summary,
    previousCvValue: input.previous?.payload,
    candidateValue: input.candidate?.payload,
    websiteValue: input.websiteValue
      ? websiteSemanticPayload(input.section.listKey, input.websiteValue) ?? input.websiteValue
      : undefined,
    warnings: input.warnings ?? [],
  };
}

function websiteTitleOf(websiteValue: unknown): string | undefined {
  if (!websiteValue || typeof websiteValue !== 'object') {return undefined;}
  if ('title' in websiteValue) {return String((websiteValue as { title?: string }).title ?? '');}
  if ('position' in websiteValue) {return String((websiteValue as { position?: string }).position ?? '');}
  return undefined;
}

export function compareCvLists(input: {
  previousBaseline: AcceptedCvNormalizedSnapshot | null;
  candidateSnapshot: AcceptedCvNormalizedSnapshot;
  website: SiteContent;
}): { items: CvChangeItem[]; countsBySection: Map<CvChangeSectionKey, ListSectionCounts> } {
  const items: CvChangeItem[] = [];
  const countsBySection = new Map<CvChangeSectionKey, ListSectionCounts>();

  for (const section of CV_LIST_SECTIONS) {
    const previous = input.previousBaseline?.lists[section.listKey] ?? [];
    const candidate = input.candidateSnapshot.lists[section.listKey];
    const websiteById = websiteListById(input.website, section.listKey);
    const counts: ListSectionCounts = { changes: 0, unchanged: 0, requiresReview: 0, safelyPrepared: 0 };

    const { pairs, previousOnly, candidateOnly } = matchListItems(previous, candidate);

    for (const pair of pairs) {
      // Semantic equality only — never treat ID/raw/metadata as a change.
      if (semanticEqual(pair.previous.payload, pair.candidate.payload)) {
        counts.unchanged += 1;
        continue;
      }

      const websiteValue = websiteById.get(pair.candidate.stableId) ?? websiteById.get(pair.previous.stableId);
      const websiteSemantic = websiteSemanticPayload(section.listKey, websiteValue);
      // If candidate already matches website, no website-relevant change.
      if (websiteSemantic && semanticEqual(websiteSemantic, pair.candidate.payload)) {
        counts.unchanged += 1;
        continue;
      }

      if (process.env.NODE_ENV !== 'production') {
        const paths = semanticDiffPaths(pair.previous.payload, pair.candidate.payload);
        if (paths.length === 0) {
          throw new Error(
            `BUG: modified ${section.sectionKey} item has no semantic diff paths (id=${pair.candidate.stableId})`,
          );
        }
      }

      const truncated = listItemTruncated(websiteTitleOf(websiteValue), pair.candidate.title);
      const fuzzyOnly = pair.matchKind === 'fuzzy';
      let kind: CvChangeItem['kind'] = 'modified';
      if (truncated) {kind = 'truncated_candidate';}
      else if (fuzzyOnly) {kind = 'uncertain_match';}
      const requiresReview = truncated || fuzzyOnly;
      const safelyPrepared = !requiresReview;

      let summary = 'Item fields changed in the fresh CV.';
      if (fuzzyOnly) {summary = 'Matched by similar title only — confirm before applying.';}
      else if (truncated) {summary = 'Updated item looks truncated compared with the website.';}

      items.push(
        buildListChangeItem({
          section,
          kind,
          itemKey: pair.candidate.stableId,
          label: `${section.label}: ${pair.candidate.title}`,
          summary,
          previous: pair.previous,
          candidate: pair.candidate,
          websiteValue,
          safelyPrepared,
          requiresReview,
          warnings: truncated ? ['Candidate title or payload may be truncated.'] : undefined,
        }),
      );
      counts.changes += 1;
      if (requiresReview) {counts.requiresReview += 1;}
      if (safelyPrepared) {counts.safelyPrepared += 1;}
    }

    for (const removed of previousOnly) {
      const websiteValue = websiteById.get(removed.stableId);
      items.push(
        buildListChangeItem({
          section,
          kind: 'removed',
          itemKey: removed.stableId,
          label: `${section.label}: ${removed.title}`,
          summary: 'Present in the previous accepted CV but absent from the fresh candidate.',
          previous: removed,
          websiteValue,
          safelyPrepared: false,
          requiresReview: true,
        }),
      );
      counts.changes += 1;
      counts.requiresReview += 1;
    }

    for (const added of candidateOnly) {
      // Already on website with same semantic payload → not a change.
      let alreadyOnWebsite = false;
      for (const webRow of websiteById.values()) {
        const webSemantic = websiteSemanticPayload(section.listKey, webRow);
        if (webSemantic && semanticEqual(webSemantic, added.payload)) {
          alreadyOnWebsite = true;
          break;
        }
      }
      if (alreadyOnWebsite) {
        counts.unchanged += 1;
        continue;
      }

      const websiteValue = websiteById.get(added.stableId);
      const truncated = listItemTruncated(websiteTitleOf(websiteValue), added.title);
      const kind: CvChangeItem['kind'] = truncated ? 'truncated_candidate' : 'added';
      const requiresReview = truncated;
      const safelyPrepared = !truncated;

      items.push(
        buildListChangeItem({
          section,
          kind,
          itemKey: added.stableId,
          label: `${section.label}: ${added.title}`,
          summary: truncated
            ? 'New item looks truncated compared with any website counterpart.'
            : 'New item in the fresh CV.',
          candidate: added,
          websiteValue,
          safelyPrepared,
          requiresReview,
        }),
      );
      counts.changes += 1;
      if (requiresReview) {counts.requiresReview += 1;}
      if (safelyPrepared) {counts.safelyPrepared += 1;}
    }

    countsBySection.set(section.sectionKey, counts);
  }

  return { items, countsBySection };
}
