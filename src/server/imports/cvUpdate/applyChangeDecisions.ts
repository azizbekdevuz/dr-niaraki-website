/**
 * Translate professor change decisions into merge freezes + precise field/item patches.
 * Review-controlled scalars stay frozen by default; list sections stay frozen and are
 * patched item-by-item so one acceptance never rewrites an entire list.
 */

import type { SiteContent } from '@/content/schema';
import type { DynamicSectionPresentation } from '@/content/schema';
import type {
  CvChangeDecision,
  CvChangeItem,
  CvChangeSet,
} from '@/server/imports/cvUpdate/changeSetTypes';
import {
  buildDynamicSectionFromCvText,
  mergeDynamicSectionIntoSiteContent,
} from '@/server/imports/cvUpdate/dynamicSections';
import {
  matchTitleKey,
  semanticAward,
  semanticEqual,
  semanticPatent,
  semanticPublication,
} from '@/server/imports/cvUpdate/semanticEquality';
import type { CvDetailsMergeFreezeKey } from '@/server/imports/importMergeSectionSafety.types';

const ALL_OWNERSHIP_LIST_FREEZES: readonly CvDetailsMergeFreezeKey[] = [
  'profile',
  'summary',
  'contact',
  'publications',
  'patents',
  'journey',
  'experiences',
  'awards',
  'researchProjects',
  'researchInterests',
  'cvNarrative',
];

function decisionFor(itemId: string, decisions: ReadonlyMap<string, CvChangeDecision>): CvChangeDecision | undefined {
  return decisions.get(itemId);
}

function isAccepted(decision: CvChangeDecision | undefined, item: CvChangeItem): boolean {
  if (decision) {
    return decision.action === 'accept' || decision.action === 'edit';
  }
  // Never auto-accept review-controlled, truncated, removals, conflicts, or unknown sections.
  if (item.ownership === 'review') {return false;}
  if (item.kind === 'removed' || item.kind === 'conflict_manual' || item.kind === 'uncertain_match') {
    return false;
  }
  if (item.kind === 'truncated_candidate' || item.kind === 'new_section') {return false;}
  return item.safelyPrepared && !item.requiresReview;
}

/**
 * When a change set exists, freeze review scalars and all CV list sections.
 * Accepted values are applied afterward as precise patches.
 */
export function resolveOwnershipFreezesFromChangeSet(input: {
  changeSet: CvChangeSet | null;
  decisions: readonly CvChangeDecision[];
  baseFreezes: ReadonlySet<CvDetailsMergeFreezeKey>;
}): Set<CvDetailsMergeFreezeKey> {
  const freezes = new Set<CvDetailsMergeFreezeKey>(input.baseFreezes);
  if (!input.changeSet) {
    return freezes;
  }
  for (const key of ALL_OWNERSHIP_LIST_FREEZES) {
    freezes.add(key);
  }
  return freezes;
}

function asString(value: unknown): string | null {
  if (typeof value === 'string') {return value;}
  if (typeof value === 'number' || typeof value === 'boolean') {return String(value);}
  return null;
}

function applyScalarPatch(site: SiteContent, item: CvChangeItem, decision: CvChangeDecision | undefined): SiteContent {
  const next = structuredClone(site);
  const value = decision?.action === 'edit' ? decision.editedValue : item.candidateValue;
  const text = asString(value);
  if (text === null) {return next;}

  switch (item.fieldPath) {
    case 'profile.displayName':
      next.profile.displayName = text.trim() || next.profile.displayName;
      break;
    case 'profile.roleLine':
      next.profile.roleLine = text.trim() || next.profile.roleLine;
      break;
    case 'profile.homeAboutIntro':
      next.profile.homeAboutIntro = text.trim() || next.profile.homeAboutIntro;
      break;
    case 'profile.aboutIntroTagline':
      next.profile.aboutIntroTagline = text.trim() || next.profile.aboutIntroTagline;
      break;
    case 'about.page.professionalSummaryParagraphs': {
      const paras = text
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (paras.length) {next.about.page.professionalSummaryParagraphs = paras;}
      break;
    }
    case 'contact.info.email':
      next.contact.info.email = text.trim() || next.contact.info.email;
      break;
    case 'contact.info.personalEmail':
      next.contact.info.personalEmail = text.trim() || next.contact.info.personalEmail;
      break;
    case 'contact.info.phone':
      next.contact.info.phone = text.trim() || next.contact.info.phone;
      break;
    case 'contact.info.cellPhone':
      next.contact.info.cellPhone = text.trim() || next.contact.info.cellPhone;
      break;
    case 'contact.info.address':
      next.contact.info.address = text.trim() || next.contact.info.address;
      break;
    case 'contact.info.department':
      next.contact.info.department = text.trim() || next.contact.info.department;
      break;
    case 'contact.info.university':
      next.contact.info.university = text.trim() || next.contact.info.university;
      break;
    case 'contact.info.websiteDisplay':
      next.contact.info.websiteDisplay = text.trim() || next.contact.info.websiteDisplay;
      break;
    default:
      break;
  }
  return next;
}

function publicationFromSemantic(payload: unknown, fallbackId: string): SiteContent['publications']['items'][number] | null {
  if (!payload || typeof payload !== 'object') {return null;}
  const p = payload as Record<string, unknown>;
  const title = asString(p.title)?.trim();
  if (!title) {return null;}
  const yearRaw = p.year;
  const year =
    typeof yearRaw === 'number'
      ? yearRaw
      : Number.parseInt(asString(yearRaw) ?? '', 10) || new Date().getFullYear();
  const typeRaw = asString(p.type)?.toLowerCase();
  const type =
    typeRaw === 'journal' || typeRaw === 'conference' || typeRaw === 'book' || typeRaw === 'other'
      ? typeRaw
      : 'other';
  return {
    id: fallbackId,
    title,
    authors: asString(p.authors)?.trim() || 'Unknown',
    journal: asString(p.journal)?.trim() || 'Unknown',
    year,
    type,
    doi: asString(p.doi)?.trim() || undefined,
  };
}

function patentFromSemantic(payload: unknown, fallbackId: string): SiteContent['patents']['items'][number] | null {
  if (!payload || typeof payload !== 'object') {return null;}
  const p = payload as Record<string, unknown>;
  const title = asString(p.title)?.trim();
  if (!title) {return null;}
  const statusRaw = asString(p.status)?.toLowerCase();
  let status: 'registered' | 'pending' | 'unknown' | 'expired' = 'unknown';
  if (
    statusRaw === 'registered' ||
    statusRaw === 'pending' ||
    statusRaw === 'unknown' ||
    statusRaw === 'expired'
  ) {
    status = statusRaw;
  } else if (statusRaw === 'completed') {
    status = 'registered';
  }
  const typeRaw = asString(p.type)?.toLowerCase();
  const type = typeRaw === 'international' || typeRaw === 'korean' ? typeRaw : 'korean';
  return {
    id: fallbackId,
    title,
    number: asString(p.number)?.trim() || 'Unknown',
    country: asString(p.country)?.trim() || 'Unknown',
    date: asString(p.date)?.trim() || 'Unknown',
    inventors: asString(p.inventors)?.trim() || 'Unknown',
    status,
    type,
  };
}

function awardFromSemantic(payload: unknown, fallbackId: string): SiteContent['about']['awards'][number] | null {
  if (!payload || typeof payload !== 'object') {return null;}
  const p = payload as Record<string, unknown>;
  const title = asString(p.title)?.trim();
  if (!title) {return null;}
  const organization = asString(p.organization)?.trim() || 'Unknown';
  const year = asString(p.year)?.trim() || 'Unknown';
  const details = asString(p.details)?.trim() || title;
  return {
    id: fallbackId,
    title,
    organization,
    year,
    details,
    impact: details,
    category: 'research',
  };
}

function findListIndexByTitle<T extends { id: string; title?: string; position?: string }>(
  rows: T[],
  title: string,
  preferredId?: string,
): number {
  if (preferredId) {
    const byId = rows.findIndex((r) => r.id === preferredId);
    if (byId >= 0) {return byId;}
  }
  const key = matchTitleKey(title);
  return rows.findIndex((r) => matchTitleKey(String(r.title ?? r.position ?? '')) === key);
}

function applyListPatches(site: SiteContent, changeSet: CvChangeSet, decisions: ReadonlyMap<string, CvChangeDecision>): SiteContent {
  const next = structuredClone(site);

  for (const item of changeSet.items) {
    const decision = decisionFor(item.id, decisions);
    if (!isAccepted(decision, item)) {continue;}
    if (item.ownership !== 'cv') {continue;}

    const payload = decision?.action === 'edit' ? decision.editedValue : item.candidateValue;
    const previousTitle =
      item.previousCvValue && typeof item.previousCvValue === 'object' && 'title' in item.previousCvValue
        ? String((item.previousCvValue as { title?: string }).title ?? '')
        : item.label;

    if (item.sectionKey === 'publications') {
      if (item.kind === 'removed') {
        const idx = findListIndexByTitle(next.publications.items, previousTitle, item.itemKey);
        if (idx >= 0) {next.publications.items.splice(idx, 1);}
        continue;
      }
      const mapped = publicationFromSemantic(payload, item.itemKey ?? `pub-${Date.now()}`);
      if (!mapped) {continue;}
      if (item.kind === 'added') {
        if (!next.publications.items.some((r) => semanticEqual(semanticPublication(r), semanticPublication(mapped)))) {
          next.publications.items.push(mapped);
        }
      } else {
        const idx = findListIndexByTitle(next.publications.items, previousTitle || mapped.title, item.itemKey);
        if (idx >= 0) {next.publications.items[idx] = { ...mapped, id: next.publications.items[idx]!.id };}
        else {next.publications.items.push(mapped);}
      }
      continue;
    }

    if (item.sectionKey === 'patents') {
      if (item.kind === 'removed') {
        const idx = findListIndexByTitle(next.patents.items, previousTitle, item.itemKey);
        if (idx >= 0) {next.patents.items.splice(idx, 1);}
        continue;
      }
      const mapped = patentFromSemantic(payload, item.itemKey ?? `pat-${Date.now()}`);
      if (!mapped) {continue;}
      if (item.kind === 'added') {
        if (!next.patents.items.some((r) => semanticEqual(semanticPatent(r), semanticPatent(mapped)))) {
          next.patents.items.push(mapped);
        }
      } else {
        const idx = findListIndexByTitle(next.patents.items, previousTitle || mapped.title, item.itemKey);
        if (idx >= 0) {next.patents.items[idx] = { ...mapped, id: next.patents.items[idx]!.id };}
        else {next.patents.items.push(mapped);}
      }
      continue;
    }

    if (item.sectionKey === 'awards') {
      if (item.kind === 'removed') {
        const idx = findListIndexByTitle(next.about.awards, previousTitle, item.itemKey);
        if (idx >= 0) {next.about.awards.splice(idx, 1);}
        continue;
      }
      const mapped = awardFromSemantic(payload, item.itemKey ?? `awd-${Date.now()}`);
      if (!mapped) {continue;}
      if (item.kind === 'added') {
        if (!next.about.awards.some((r) => semanticEqual(semanticAward(r), semanticAward(mapped)))) {
          next.about.awards.push(mapped);
        }
      } else {
        const idx = findListIndexByTitle(next.about.awards, previousTitle || mapped.title, item.itemKey);
        if (idx >= 0) {next.about.awards[idx] = { ...mapped, id: next.about.awards[idx]!.id };}
        else {next.about.awards.push(mapped);}
      }
    }
  }

  return next;
}

/**
 * Apply accepted review-controlled scalars and CV list item patches onto a frozen merge result.
 */
export function applyAcceptedChangePatches(input: {
  site: SiteContent;
  changeSet: CvChangeSet | null;
  decisions: readonly CvChangeDecision[];
}): SiteContent {
  if (!input.changeSet) {return input.site;}
  const byId = new Map(input.decisions.map((d) => [d.changeId, d]));
  let next = input.site;

  for (const item of input.changeSet.items) {
    if (item.ownership !== 'review') {continue;}
    if (item.kind === 'new_section') {continue;}
    const decision = decisionFor(item.id, byId);
    if (!isAccepted(decision, item)) {continue;}
    // Truncated candidates require explicit edit (or accept of a complete edited value).
    if (item.kind === 'truncated_candidate' && decision?.action !== 'edit' && decision?.action !== 'accept') {
      continue;
    }
    if (item.kind === 'truncated_candidate' && decision?.action === 'accept') {
      // Accepting a truncated value is allowed only with an edited complete value.
      if (decision.editedValue === undefined) {continue;}
    }
    next = applyScalarPatch(next, item, decision);
  }

  next = applyListPatches(next, input.changeSet, byId);
  return next;
}

const PRESENTATION_MAP: Record<string, DynamicSectionPresentation> = {
  RICH_TEXT: 'rich_text',
  BULLET_LIST: 'bullet_list',
  TIMELINE: 'timeline',
  GROUPED_CARDS: 'grouped_cards',
  KEY_VALUE: 'key_value',
  rich_text: 'rich_text',
  bullet_list: 'bullet_list',
  timeline: 'timeline',
  grouped_cards: 'grouped_cards',
  key_value: 'key_value',
};

/**
 * Apply accepted unknown-section decisions onto a draft SiteContent.
 */
export function applyAcceptedDynamicSections(input: {
  site: SiteContent;
  changeSet: CvChangeSet | null;
  decisions: readonly CvChangeDecision[];
}): SiteContent {
  if (!input.changeSet) {return input.site;}
  const byId = new Map(input.decisions.map((d) => [d.changeId, d]));
  let next = input.site;

  for (const item of input.changeSet.items) {
    if (item.kind !== 'new_section') {continue;}
    const decision = decisionFor(item.id, byId);
    if (!isAccepted(decision, item)) {continue;}

    const edited = (decision?.editedValue ?? item.candidateValue) as {
      title?: string;
      displayTitle?: string;
      presentation?: string;
      preview?: string;
      sortOrder?: number;
    } | null;

    const presentationRaw = edited?.presentation;
    if (!presentationRaw || presentationRaw === 'KEEP_IN_CV' || presentationRaw === 'IGNORE') {
      continue;
    }
    const presentation = PRESENTATION_MAP[presentationRaw];
    if (!presentation) {continue;}

    const title = (edited?.displayTitle || edited?.title || item.label).trim();
    const rawText = typeof edited?.preview === 'string' ? edited.preview : String(
      edited && typeof edited === 'object' && 'preview' in edited
        ? edited.preview
        : (item.candidateValue as { preview?: string } | null)?.preview ?? '',
    );
    const section = buildDynamicSectionFromCvText({
      id: `dyn-${item.itemKey ?? item.id}`,
      title,
      presentation,
      rawText,
      sortOrder: typeof edited?.sortOrder === 'number' ? edited.sortOrder : 100,
      sourceNormalizedTitle: item.itemKey,
    });
    next = mergeDynamicSectionIntoSiteContent(next, section);
  }

  return next;
}
