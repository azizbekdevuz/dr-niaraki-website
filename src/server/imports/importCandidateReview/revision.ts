import { createHash } from 'node:crypto';

import type { CandidateReviewManifest } from '@/server/imports/candidateReviewManifest';

/** Stable revision for manifest + approvals concurrency and stale-submission checks. */
export function computeImportReviewManifestRevision(input: {
  sourceTextHash: string;
  decisionIds: readonly string[];
}): string {
  const payload = JSON.stringify({
    sourceTextHash: input.sourceTextHash,
    decisionIds: [...input.decisionIds].sort(),
  });
  return createHash('sha256').update(payload).digest('hex').slice(0, 32);
}

export function manifestDecisionIds(manifest: CandidateReviewManifest): string[] {
  return manifest.decisions.map((d) => d.decisionId);
}

export function revisionForManifest(manifest: CandidateReviewManifest, sourceTextHash: string): string {
  return computeImportReviewManifestRevision({
    sourceTextHash,
    decisionIds: manifestDecisionIds(manifest),
  });
}
