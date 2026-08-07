/**
 * Professor-facing change-set response shaping (plain-language payload).
 */

import type {
  CvChangeDecision,
  CvChangeDecisionsEnvelope,
  CvChangeItem,
  CvChangeSet,
  CvChangeSetSummary,
} from '@/server/imports/cvUpdate/changeSetTypes';

export type ProfessorChangeItemDto = {
  id: string;
  sectionKey: CvChangeItem['sectionKey'];
  fieldPath: string;
  itemKey?: string;
  kind: CvChangeItem['kind'];
  safelyPrepared: boolean;
  requiresReview: boolean;
  label: string;
  summary: string;
  previousCvValue?: unknown;
  candidateValue?: unknown;
  websiteValue?: unknown;
  editedValue?: unknown;
  warnings: string[];
  ownership?: CvChangeItem['ownership'];
  reconcileDecisionId?: string;
};

export type ProfessorChangeSetDto = {
  summary: CvChangeSetSummary;
  sectionSummaries: CvChangeSet['sectionSummaries'];
  items: ProfessorChangeItemDto[];
  unknownSections: CvChangeSet['unknownSections'];
  changeSetRevision: string;
  generatedAt?: string;
  baseline?: CvChangeSet['baseline'];
  website?: CvChangeSet['website'];
  candidateSourceTextHash?: string | null;
};

export type ImportChangeSetSummaryCompact = Pick<
  CvChangeSetSummary,
  'totalChanges' | 'safelyPrepared' | 'requiresReview' | 'unchangedItemCount' | 'noWebsiteRelevantChanges'
> & {
  changeSetRevision: string;
  unknownSectionCount: number;
};

function toProfessorItem(item: CvChangeItem, advanced: boolean): ProfessorChangeItemDto {
  const dto: ProfessorChangeItemDto = {
    id: item.id,
    sectionKey: item.sectionKey,
    fieldPath: item.fieldPath,
    kind: item.kind,
    safelyPrepared: item.safelyPrepared,
    requiresReview: item.requiresReview,
    label: item.label,
    summary: item.summary,
    warnings: item.warnings,
  };
  if (item.itemKey !== undefined) {dto.itemKey = item.itemKey;}
  if (item.previousCvValue !== undefined) {dto.previousCvValue = item.previousCvValue;}
  if (item.candidateValue !== undefined) {dto.candidateValue = item.candidateValue;}
  if (item.websiteValue !== undefined) {dto.websiteValue = item.websiteValue;}
  if (item.editedValue !== undefined) {dto.editedValue = item.editedValue;}
  if (advanced) {
    dto.ownership = item.ownership;
    if (item.reconcileDecisionId !== undefined) {
      dto.reconcileDecisionId = item.reconcileDecisionId;
    }
  }
  return dto;
}

export function toProfessorChangeSetDto(changeSet: CvChangeSet, advanced: boolean): ProfessorChangeSetDto {
  const items = changeSet.items
    .filter((item) => item.kind !== 'unchanged')
    .map((item) => toProfessorItem(item, advanced));

  const dto: ProfessorChangeSetDto = {
    summary: changeSet.summary,
    sectionSummaries: changeSet.sectionSummaries,
    items,
    unknownSections: changeSet.unknownSections,
    changeSetRevision: changeSet.changeSetRevision,
  };

  if (advanced) {
    dto.generatedAt = changeSet.generatedAt;
    dto.baseline = changeSet.baseline;
    dto.website = changeSet.website;
    dto.candidateSourceTextHash = changeSet.candidateSourceTextHash;
  }

  return dto;
}

export function toChangeSetSummaryCompact(changeSet: CvChangeSet): ImportChangeSetSummaryCompact {
  return {
    totalChanges: changeSet.summary.totalChanges,
    safelyPrepared: changeSet.summary.safelyPrepared,
    requiresReview: changeSet.summary.requiresReview,
    unchangedItemCount: changeSet.summary.unchangedItemCount,
    noWebsiteRelevantChanges: changeSet.summary.noWebsiteRelevantChanges,
    changeSetRevision: changeSet.changeSetRevision,
    unknownSectionCount: changeSet.unknownSections.length,
  };
}

export function decisionsFromEnvelope(
  envelope: CvChangeDecisionsEnvelope | null,
): CvChangeDecision[] | null {
  if (!envelope) {return null;}
  return envelope.decisions;
}
