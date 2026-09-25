/**
 * Client types for professor CV update panel (mirrors API DTO; no technical jargon in UI).
 */

export type ProfessorChangeDecisionAction =
  | 'accept'
  | 'keep_website'
  | 'edit'
  | 'ignore'
  | 'lock_website';

export type ProfessorLocalDecision = {
  changeId: string;
  action: ProfessorChangeDecisionAction;
  editedValue?: unknown;
  lockForFutureImports?: boolean;
};

export type ProfessorChangeItem = {
  id: string;
  sectionKey: string;
  fieldPath: string;
  itemKey?: string;
  kind: string;
  safelyPrepared: boolean;
  requiresReview: boolean;
  label: string;
  summary: string;
  previousCvValue?: unknown;
  candidateValue?: unknown;
  websiteValue?: unknown;
  editedValue?: unknown;
  warnings: string[];
};

export type ProfessorSectionSummary = {
  sectionKey: string;
  label: string;
  changes: number;
  unchanged: number;
  requiresReview: number;
  safelyPrepared: number;
};

export type ProfessorUnknownSection = {
  sectionId: string;
  sourceTitle: string;
  normalizedTitle: string;
  textPreview: string;
  rememberedPresentation?: string | null;
};

export type ProfessorChangeSet = {
  summary: {
    totalChanges: number;
    safelyPrepared: number;
    requiresReview: number;
    unchangedItemCount: number;
    noWebsiteRelevantChanges: boolean;
  };
  sectionSummaries: ProfessorSectionSummary[];
  items: ProfessorChangeItem[];
  unknownSections: ProfessorUnknownSection[];
  changeSetRevision: string;
};

export type UnknownSectionPresentation =
  | 'RICH_TEXT'
  | 'BULLET_LIST'
  | 'TIMELINE'
  | 'GROUPED_CARDS'
  | 'KEEP_IN_CV'
  | 'IGNORE';

export function formatChangeValue(value: unknown): string {
  if (typeof value === 'string') {
    return value.length > 0 ? value : '—';
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'undefined' || Object.is(value, null)) {
    return '—';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
