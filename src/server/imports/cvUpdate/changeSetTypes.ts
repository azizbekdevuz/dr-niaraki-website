/**
 * Persisted three-way CV change-set types (accepted CV × candidate × website).
 */

import type { FieldOwnershipClass } from '@/server/imports/cvUpdate/fieldOwnership';

export type CvChangeKind =
  | 'unchanged'
  | 'added'
  | 'modified'
  | 'removed'
  | 'uncertain_match'
  | 'conflict_manual'
  | 'protected_lock'
  | 'truncated_candidate'
  | 'new_section'
  | 'website_only';

export type CvChangeDecisionAction = 'accept' | 'keep_website' | 'edit' | 'ignore' | 'lock_website';

export type CvChangeSectionKey =
  | 'profile'
  | 'summary'
  | 'contact'
  | 'publications'
  | 'patents'
  | 'education'
  | 'appointments'
  | 'awards'
  | 'projects'
  | 'research_interests'
  | 'teaching'
  | 'supervision'
  | 'service'
  | 'unknown_section'
  | 'website_chrome';

export type CvChangeItem = {
  id: string;
  sectionKey: CvChangeSectionKey;
  fieldPath: string;
  itemKey?: string;
  kind: CvChangeKind;
  ownership: FieldOwnershipClass;
  /** High-confidence CV-controlled change ready for draft without professor review. */
  safelyPrepared: boolean;
  requiresReview: boolean;
  label: string;
  summary: string;
  previousCvValue?: unknown;
  candidateValue?: unknown;
  websiteValue?: unknown;
  editedValue?: unknown;
  warnings: string[];
  /** Linked reconciliation decision id when applicable. */
  reconcileDecisionId?: string;
};

export type CvChangeSectionSummary = {
  sectionKey: CvChangeSectionKey;
  label: string;
  changes: number;
  unchanged: number;
  requiresReview: number;
  safelyPrepared: number;
};

export type CvUnknownSectionProposal = {
  sectionId: string;
  sourceTitle: string;
  normalizedTitle: string;
  textPreview: string;
  rememberedPresentation?: string | null;
};

export type CvChangeSetSummary = {
  totalChanges: number;
  safelyPrepared: number;
  requiresReview: number;
  unchangedItemCount: number;
  noWebsiteRelevantChanges: boolean;
};

export type CvAcceptedBaselineRef = {
  baselineId: string;
  sourceImportId: string;
  acceptedAt: string;
  parserVersion: string;
  mappingVersion: string;
  sourceTextHash: string | null;
};

export type CvWebsiteRef = {
  sourceType: 'working_draft' | 'published' | 'canonical';
  versionId?: string | null;
  label?: string | null;
};

export type CvChangeSet = {
  schemaVersion: 1;
  /** Comparison algorithm version; regenerate when older than current. */
  algorithmVersion: number;
  generatedAt: string;
  importId: string;
  candidateSourceTextHash: string | null;
  baseline: CvAcceptedBaselineRef | null;
  website: CvWebsiteRef;
  summary: CvChangeSetSummary;
  sectionSummaries: CvChangeSectionSummary[];
  /** Non-unchanged items only (professor payload). */
  items: CvChangeItem[];
  unknownSections: CvUnknownSectionProposal[];
  /** Opaque revision for stale decision checks. */
  changeSetRevision: string;
};

export type CvChangeDecision = {
  changeId: string;
  action: CvChangeDecisionAction;
  editedValue?: unknown;
  /** When action is lock_website — persist ImportFieldLock. */
  lockForFutureImports?: boolean;
};

export type CvChangeDecisionsEnvelope = {
  schemaVersion: 1;
  changeSetRevision: string;
  savedAt: string;
  decisions: CvChangeDecision[];
};

export type NormalizedListItem = {
  stableId: string;
  fingerprint: string;
  title: string;
  payload: unknown;
};

export type AcceptedCvNormalizedSnapshot = {
  schemaVersion: 1;
  /** Bumped when comparison semantics change. */
  algorithmVersion?: number;
  scalars: Record<string, string | null>;
  lists: {
    publications: NormalizedListItem[];
    patents: NormalizedListItem[];
    education: NormalizedListItem[];
    appointments: NormalizedListItem[];
    awards: NormalizedListItem[];
    projects: NormalizedListItem[];
  };
  sectionFingerprints: Record<string, string>;
  sourceSectionMappings: Array<{
    normalizedTitle: string;
    mappedWebsiteSection: string | null;
    title: string;
  }>;
};
