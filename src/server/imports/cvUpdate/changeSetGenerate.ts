/**
 * Three-way CV change-set generator (accepted CV × candidate × website).
 */

import { createHash } from 'node:crypto';

import type { SiteContent } from '@/content/schema';
import type { ImportCandidatePayload } from '@/server/imports/candidatePayload/types';
import { normalizeReviewTitle, makeDecisionId } from '@/server/imports/candidateReviewIdentity';
import { compareCvLists } from '@/server/imports/cvUpdate/changeSetGenerateLists';
import {
  compareReviewScalars,
  type FieldLockRow,
} from '@/server/imports/cvUpdate/changeSetGenerateScalars';
import type {
  CvAcceptedBaselineRef,
  CvChangeItem,
  CvChangeSectionKey,
  CvChangeSectionSummary,
  CvChangeSet,
  CvUnknownSectionProposal,
  CvWebsiteRef,
  AcceptedCvNormalizedSnapshot,
} from '@/server/imports/cvUpdate/changeSetTypes';
import { buildAcceptedCvNormalizedSnapshot } from '@/server/imports/cvUpdate/normalizeBaseline';
import { CV_CHANGE_ALGORITHM_VERSION } from '@/server/imports/cvUpdate/semanticEquality';
import type { Details } from '@/types/details';

export const SECTION_LABELS: Record<CvChangeSectionKey, string> = {
  profile: 'Profile',
  summary: 'Summary',
  contact: 'Contact',
  publications: 'Publications',
  patents: 'Patents',
  education: 'Education',
  appointments: 'Appointments',
  awards: 'Awards',
  projects: 'Projects',
  research_interests: 'Research',
  teaching: 'Teaching',
  supervision: 'Supervision',
  service: 'Service',
  unknown_section: 'New section',
  website_chrome: 'Website',
};

const SECTION_SUMMARY_ORDER: readonly CvChangeSectionKey[] = [
  'profile',
  'summary',
  'contact',
  'publications',
  'patents',
  'education',
  'appointments',
  'awards',
  'projects',
  'research_interests',
  'teaching',
  'supervision',
  'service',
  'unknown_section',
  'website_chrome',
];

/** Document header / identity source — never a dynamic website section proposal. */
export function isPreambleSectionTitle(title: string): boolean {
  const n = normalizeReviewTitle(title);
  return n === 'preamble' || n === 'header' || n === 'cv header' || n.startsWith('preamble ');
}

export type GenerateCvChangeSetInput = {
  importId: string;
  candidateDetails: Details;
  candidateEnvelope: ImportCandidatePayload | null;
  previousBaseline: AcceptedCvNormalizedSnapshot | null;
  website: SiteContent;
  websiteRef: CvWebsiteRef;
  fieldLocks: FieldLockRow[];
  sectionMappings: Array<{
    normalizedTitle: string;
    presentation: string;
    displayTitle: string | null;
  }>;
  baselineRef: CvAcceptedBaselineRef | null;
};

type SectionAccumulator = {
  changes: number;
  unchanged: number;
  requiresReview: number;
  safelyPrepared: number;
};

function mergeSectionCounts(
  target: Map<CvChangeSectionKey, SectionAccumulator>,
  sectionKey: CvChangeSectionKey,
  patch: Partial<SectionAccumulator>,
) {
  const row = target.get(sectionKey) ?? { changes: 0, unchanged: 0, requiresReview: 0, safelyPrepared: 0 };
  target.set(sectionKey, {
    changes: row.changes + (patch.changes ?? 0),
    unchanged: row.unchanged + (patch.unchanged ?? 0),
    requiresReview: row.requiresReview + (patch.requiresReview ?? 0),
    safelyPrepared: row.safelyPrepared + (patch.safelyPrepared ?? 0),
  });
}

function computeChangeSetRevision(
  items: readonly CvChangeItem[],
  unknownSections: readonly CvUnknownSectionProposal[],
): string {
  const stableItems = [...items]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((item) => ({
      id: item.id,
      sectionKey: item.sectionKey,
      fieldPath: item.fieldPath,
      itemKey: item.itemKey ?? null,
      kind: item.kind,
    }));
  const stableUnknown = [...unknownSections]
    .sort((a, b) => a.sectionId.localeCompare(b.sectionId))
    .map((row) => ({
      sectionId: row.sectionId,
      normalizedTitle: row.normalizedTitle,
    }));
  const payload = JSON.stringify({ items: stableItems, unknownSections: stableUnknown });
  return createHash('sha256').update(payload).digest('hex').slice(0, 32);
}

function buildUnknownSectionChanges(input: {
  envelope: ImportCandidatePayload | null;
  sectionMappings: GenerateCvChangeSetInput['sectionMappings'];
}): { items: CvChangeItem[]; unknownSections: CvUnknownSectionProposal[]; counts: SectionAccumulator } {
  const items: CvChangeItem[] = [];
  const unknownSections: CvUnknownSectionProposal[] = [];
  const counts: SectionAccumulator = { changes: 0, unchanged: 0, requiresReview: 0, safelyPrepared: 0 };
  const unmapped = input.envelope?.unmappedSections ?? [];
  const mappingByTitle = new Map(
    input.sectionMappings.map((row) => [row.normalizedTitle, row]),
  );

  for (const section of unmapped) {
    if (isPreambleSectionTitle(section.title)) {
      continue;
    }
    const normalizedTitle = normalizeReviewTitle(section.title);
    const mapping = mappingByTitle.get(normalizedTitle);
    if (mapping?.presentation === 'IGNORE' || mapping?.presentation === 'KEEP_IN_CV') {
      continue;
    }

    const raw = input.envelope?.rawSections.find((row) => row.id === section.sectionId);
    const textPreview = (raw?.rawText ?? section.title).trim().slice(0, 240);
    const rememberedPresentation = mapping?.presentation ?? null;
    unknownSections.push({
      sectionId: section.sectionId,
      sourceTitle: section.title,
      normalizedTitle,
      textPreview,
      rememberedPresentation,
    });

    const hasRememberedLayout = Boolean(rememberedPresentation);
    items.push({
      id: makeDecisionId(['change', 'unknown_section', section.sectionId]),
      sectionKey: 'unknown_section',
      fieldPath: `unknownSections.${section.sectionId}`,
      itemKey: section.sectionId,
      kind: 'new_section',
      ownership: 'review',
      safelyPrepared: hasRememberedLayout,
      requiresReview: !hasRememberedLayout,
      label: SECTION_LABELS.unknown_section,
      summary: hasRememberedLayout
        ? `New CV section "${section.title}" will use remembered layout ${rememberedPresentation}.`
        : `New CV section detected: ${section.title}`,
      candidateValue: {
        title: section.title,
        reason: section.reason,
        preview: textPreview,
        presentation: rememberedPresentation,
        displayTitle: mapping?.displayTitle ?? section.title,
      },
      warnings: [],
    });
    counts.changes += 1;
    if (hasRememberedLayout) {
      counts.safelyPrepared += 1;
    } else {
      counts.requiresReview += 1;
    }
  }

  return { items, unknownSections, counts };
}

function buildSectionSummaries(counts: Map<CvChangeSectionKey, SectionAccumulator>): CvChangeSectionSummary[] {
  return SECTION_SUMMARY_ORDER.filter((sectionKey) => counts.has(sectionKey)).map((sectionKey) => {
    const row = counts.get(sectionKey)!;
    return {
      sectionKey,
      label: SECTION_LABELS[sectionKey],
      changes: row.changes,
      unchanged: row.unchanged,
      requiresReview: row.requiresReview,
      safelyPrepared: row.safelyPrepared,
    };
  });
}

export function generateCvChangeSet(input: GenerateCvChangeSetInput): CvChangeSet {
  const candidateSnapshot = buildAcceptedCvNormalizedSnapshot({
    details: input.candidateDetails,
    envelope: input.candidateEnvelope,
  });

  const sectionCounts = new Map<CvChangeSectionKey, SectionAccumulator>();

  const scalarResult = compareReviewScalars({
    previousBaseline: input.previousBaseline,
    candidateSnapshot,
    website: input.website,
    fieldLocks: input.fieldLocks,
  });
  for (const [sectionKey, row] of scalarResult.countsBySection) {
    mergeSectionCounts(sectionCounts, sectionKey, row);
  }

  const listResult = compareCvLists({
    previousBaseline: input.previousBaseline,
    candidateSnapshot,
    website: input.website,
  });
  for (const [sectionKey, row] of listResult.countsBySection) {
    mergeSectionCounts(sectionCounts, sectionKey, row);
  }

  const unknownResult = buildUnknownSectionChanges({
    envelope: input.candidateEnvelope,
    sectionMappings: input.sectionMappings,
  });
  if (unknownResult.counts.changes > 0 || unknownResult.counts.requiresReview > 0) {
    mergeSectionCounts(sectionCounts, 'unknown_section', unknownResult.counts);
  }

  const items = [...scalarResult.items, ...listResult.items, ...unknownResult.items];
  const unknownSections = unknownResult.unknownSections;

  const totalChanges = items.length;
  const requiresReview = items.filter((item) => item.requiresReview).length;
  const safelyPrepared = items.filter((item) => item.safelyPrepared).length;
  const unchangedItemCount = [...sectionCounts.values()].reduce((sum, row) => sum + row.unchanged, 0);

  return {
    schemaVersion: 1,
    algorithmVersion: CV_CHANGE_ALGORITHM_VERSION,
    generatedAt: new Date().toISOString(),
    importId: input.importId,
    candidateSourceTextHash: input.candidateEnvelope?.sourceTextHash ?? null,
    baseline: input.baselineRef,
    website: input.websiteRef,
    summary: {
      totalChanges,
      safelyPrepared,
      requiresReview,
      unchangedItemCount,
      noWebsiteRelevantChanges: totalChanges === 0,
    },
    sectionSummaries: buildSectionSummaries(sectionCounts),
    items,
    unknownSections,
    changeSetRevision: computeChangeSetRevision(items, unknownSections),
  };
}
