import { SITE_CONTENT_RAW } from '@/content/defaults';
import type { SiteContent } from '@/content/schema';
import { assertSiteContent, validateSiteContent } from '@/content/validators';

export type ReviewBaselineMode = 'auto' | 'working_draft' | 'canonical' | 'published';

export type ReviewBaselineCapabilities = {
  hasWorkingDraft: boolean;
  hasPublished: boolean;
};

export type ReviewBaselineResolution = {
  baseline: SiteContent;
  baselineSource: 'working_draft' | 'canonical' | 'published';
  /** Human-readable description of the chosen snapshot. */
  baselineLabel: string;
  fallbackWarnings: { message: string; code?: string }[];
  capabilities: ReviewBaselineCapabilities;
};

export function parseReviewBaselineMode(raw: string | null | undefined): ReviewBaselineMode {
  if (raw === 'working_draft' || raw === 'canonical' || raw === 'published' || raw === 'auto') {
    return raw;
  }
  return 'auto';
}

function siteFromPayload(payload: unknown): SiteContent | null {
  const parsed = validateSiteContent(payload);
  return parsed.success && parsed.data ? parsed.data : null;
}

export type ReviewBaselineInput = {
  workingDraftPayload: unknown | null;
  publishedPayload: unknown | null;
  publishedSequence: number | null;
  publishedVersionId: string | null;
};

/**
 * Pure baseline selection for import review (caller supplies payloads from DB / in-repo canonical).
 */
export function resolveImportReviewBaseline(
  mode: ReviewBaselineMode,
  input: ReviewBaselineInput,
): ReviewBaselineResolution {
  const working = input.workingDraftPayload !== null ? siteFromPayload(input.workingDraftPayload) : null;
  const published = input.publishedPayload !== null ? siteFromPayload(input.publishedPayload) : null;

  const capabilities: ReviewBaselineCapabilities = {
    hasWorkingDraft: Boolean(working),
    hasPublished: Boolean(published),
  };

  const canonical = assertSiteContent(SITE_CONTENT_RAW);
  const fallbackWarnings: { message: string; code?: string }[] = [];

  const pickCanonical = (label: string): ReviewBaselineResolution => ({
    baseline: canonical,
    baselineSource: 'canonical',
    baselineLabel: label,
    fallbackWarnings,
    capabilities,
  });

  if (mode === 'canonical') {
    return pickCanonical('In-repo canonical site content (`SITE_CONTENT_RAW`)');
  }

  if (mode === 'published') {
    if (published) {
      const seq = input.publishedSequence ?? '?';
      const vid = input.publishedVersionId ? `${input.publishedVersionId.slice(0, 8)}…` : '';
      return {
        baseline: published,
        baselineSource: 'published',
        baselineLabel: `Latest published database snapshot (#${seq}${vid ? `, ${vid}` : ''})`,
        fallbackWarnings,
        capabilities,
      };
    }
    fallbackWarnings.push({
      code: 'BASELINE_FALLBACK',
      message: 'No valid published `ContentVersion` found — fell back to in-repo canonical baseline.',
    });
    return pickCanonical('In-repo canonical (no published snapshot available)');
  }

  if (mode === 'working_draft') {
    if (working) {
      return {
        baseline: working,
        baselineSource: 'working_draft',
        baselineLabel: 'Current working draft in the database',
        fallbackWarnings,
        capabilities,
      };
    }
    fallbackWarnings.push({
      code: 'BASELINE_FALLBACK',
      message: 'No working draft exists — fell back to in-repo canonical baseline.',
    });
    return pickCanonical('In-repo canonical (requested working draft, but none exists)');
  }

  // auto
  if (working) {
    return {
      baseline: working,
      baselineSource: 'working_draft',
      baselineLabel: 'Current working draft (default when a draft exists)',
      fallbackWarnings,
      capabilities,
    };
  }
  return pickCanonical('In-repo canonical (default when no working draft)');
}
