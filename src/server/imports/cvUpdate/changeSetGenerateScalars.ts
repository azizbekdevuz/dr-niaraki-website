/**
 * Review-controlled scalar comparison for CV change-set generation.
 */

import type { SiteContent } from '@/content/schema';
import { makeDecisionId } from '@/server/imports/candidateReviewIdentity';
import type {
  AcceptedCvNormalizedSnapshot,
  CvChangeItem,
  CvChangeSectionKey,
} from '@/server/imports/cvUpdate/changeSetTypes';
import {
  snapshotScalarValue,
  websiteScalarValue,
} from '@/server/imports/cvUpdate/changeSetWebsiteValues';
import {
  isWebsiteControlledPath,
  REVIEW_CONTROLLED_FIELDS,
} from '@/server/imports/cvUpdate/fieldOwnership';
import { detectTruncatedCandidate, fingerprintText } from '@/server/imports/cvUpdate/truncationDetect';

export type FieldLockRow = {
  fieldPath: string;
  lockedWebsiteFingerprint: string;
  rejectedSourceFingerprint: string | null;
};

export type ScalarSectionCounts = {
  changes: number;
  unchanged: number;
  requiresReview: number;
  safelyPrepared: number;
};

function norm(value: string | null | undefined): string {
  return (value ?? '').trim();
}

function sectionKeyForFieldPath(fieldPath: string): CvChangeSectionKey {
  if (fieldPath.startsWith('contact.')) {return 'contact';}
  if (fieldPath.startsWith('about.page.')) {return 'summary';}
  if (fieldPath === 'profile.homeAboutIntro' || fieldPath === 'profile.aboutIntroTagline') {
    return 'summary';
  }
  return 'profile';
}

function isLockSuppressed(
  fieldPath: string,
  candidateValue: string | null,
  fieldLocks: readonly FieldLockRow[],
): boolean {
  const lock = fieldLocks.find((row) => row.fieldPath === fieldPath);
  if (!lock?.rejectedSourceFingerprint) {return false;}
  return lock.rejectedSourceFingerprint === fingerprintText(candidateValue ?? '');
}

export function compareReviewScalars(input: {
  previousBaseline: AcceptedCvNormalizedSnapshot | null;
  candidateSnapshot: AcceptedCvNormalizedSnapshot;
  website: SiteContent;
  fieldLocks: readonly FieldLockRow[];
}): { items: CvChangeItem[]; countsBySection: Map<CvChangeSectionKey, ScalarSectionCounts> } {
  const items: CvChangeItem[] = [];
  const countsBySection = new Map<CvChangeSectionKey, ScalarSectionCounts>();

  const bump = (sectionKey: CvChangeSectionKey, patch: Partial<ScalarSectionCounts>) => {
    const row = countsBySection.get(sectionKey) ?? {
      changes: 0,
      unchanged: 0,
      requiresReview: 0,
      safelyPrepared: 0,
    };
    countsBySection.set(sectionKey, {
      changes: row.changes + (patch.changes ?? 0),
      unchanged: row.unchanged + (patch.unchanged ?? 0),
      requiresReview: row.requiresReview + (patch.requiresReview ?? 0),
      safelyPrepared: row.safelyPrepared + (patch.safelyPrepared ?? 0),
    });
  };

  for (const rule of REVIEW_CONTROLLED_FIELDS) {
    if (isWebsiteControlledPath(rule.fieldPath)) {continue;}

    const sectionKey = sectionKeyForFieldPath(rule.fieldPath);
    const previousValue = snapshotScalarValue(rule.fieldPath, input.previousBaseline);
    const candidateValue = snapshotScalarValue(rule.fieldPath, input.candidateSnapshot);
    const websiteValue = websiteScalarValue(rule.fieldPath, input.website);

    const prev = norm(previousValue);
    const cand = norm(candidateValue);
    const web = norm(websiteValue);

    if (isLockSuppressed(rule.fieldPath, candidateValue, input.fieldLocks)) {
      bump(sectionKey, { unchanged: 1 });
      continue;
    }

    if (prev === cand) {
      bump(sectionKey, { unchanged: 1 });
      continue;
    }

    if (cand === web) {
      bump(sectionKey, { unchanged: 1 });
      continue;
    }

    const truncation =
      web && cand ? detectTruncatedCandidate(web, cand) : { truncated: false, reason: null };
    const threeWayConflict = Boolean(prev && cand && web && prev !== cand && web !== prev && web !== cand);

    let kind: CvChangeItem['kind'] = 'modified';
    if (truncation.truncated) {
      kind = 'truncated_candidate';
    } else if (threeWayConflict) {
      kind = 'conflict_manual';
    }

    const requiresReview = true;
    const safelyPrepared = false;
    const warnings = truncation.reason ? [truncation.reason] : [];

    let summary = 'Candidate differs from the current website value.';
    if (threeWayConflict) {
      summary = 'Previous CV, candidate, and website all differ — manual resolution required.';
    } else if (truncation.truncated) {
      summary = 'Candidate value looks truncated or downgraded compared with the website.';
    }

    items.push({
      id: makeDecisionId(['change', sectionKey, rule.fieldPath]),
      sectionKey,
      fieldPath: rule.fieldPath,
      kind,
      ownership: rule.ownership,
      safelyPrepared,
      requiresReview,
      label: rule.label,
      summary,
      previousCvValue: previousValue,
      candidateValue,
      websiteValue,
      warnings,
    });

    bump(sectionKey, { changes: 1, requiresReview: 1 });
  }

  return { items, countsBySection };
}
