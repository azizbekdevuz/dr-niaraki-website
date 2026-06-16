import 'server-only';

import { SITE_CONTENT_RAW } from '@/content/defaults';
import type { SiteContent } from '@/content/schema';
import { validateSiteContent } from '@/content/validators';
import { getLatestPublishedVersion, getWorkingDraft } from '@/server/content/contentWorkflowCore';
import type { CandidateReviewBaselineRef } from '@/server/imports/candidateReviewManifest';
import {
  resolveImportReviewBaseline,
  type ReviewBaselineResolution,
} from '@/server/imports/reviewBaseline';

export type ImportMergeReviewBaseline = {
  baseline: SiteContent;
  baselineRef: CandidateReviewBaselineRef;
  resolution: ReviewBaselineResolution;
};

/**
 * Baseline used for candidate reconciliation — matches merge baseline selection
 * (working draft when valid, otherwise in-repo canonical).
 */
export async function resolveImportMergeReviewBaseline(): Promise<ImportMergeReviewBaseline> {
  const working = await getWorkingDraft();
  const published = await getLatestPublishedVersion();
  const resolution = resolveImportReviewBaseline('auto', {
    workingDraftPayload: working?.payload ?? null,
    publishedPayload: published?.payload ?? null,
    publishedSequence: published?.publishSequence ?? null,
    publishedVersionId: published?.id ?? null,
  });

  let versionId: string | null = null;
  if (resolution.baselineSource === 'working_draft') {
    versionId = working?.id ?? null;
  } else if (resolution.baselineSource === 'published') {
    versionId = published?.id ?? null;
  }

  const baselineRef: CandidateReviewBaselineRef = {
    sourceType: resolution.baselineSource,
    versionId,
    publishSequence:
      resolution.baselineSource === 'published' ? (published?.publishSequence ?? null) : null,
    label: resolution.baselineLabel,
  };

  return { baseline: resolution.baseline, baselineRef, resolution };
}

/** Fallback when only canonical is available without DB (tests). */
export function resolveCanonicalMergeReviewBaseline(): ImportMergeReviewBaseline {
  const parsed = validateSiteContent(SITE_CONTENT_RAW);
  if (!parsed.success) {
    throw new Error('Canonical baseline failed validation.');
  }
  const resolution = resolveImportReviewBaseline('canonical', {
    workingDraftPayload: null,
    publishedPayload: null,
    publishedSequence: null,
    publishedVersionId: null,
  });
  return {
    baseline: parsed.data,
    baselineRef: {
      sourceType: 'canonical',
      versionId: null,
      publishSequence: null,
      label: resolution.baselineLabel,
    },
    resolution,
  };
}
