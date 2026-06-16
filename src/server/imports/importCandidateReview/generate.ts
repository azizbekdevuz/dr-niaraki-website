import 'server-only';

import { recordContentEvent } from '@/server/content/contentEvents';
import { withAppliedAccounting } from '@/server/imports/candidateReviewAccounting';
import { analyzeCandidateReview } from '@/server/imports/candidateReviewAnalyze';
import type {
  CandidateReviewApproval,
  CandidateReviewManifest,
} from '@/server/imports/candidateReviewManifest';
import { resolveImportMergeReviewBaseline } from '@/server/imports/importCandidateReview/baseline';
import { revisionForManifest } from '@/server/imports/importCandidateReview/revision';
import {
  toStoredManifestEnvelope,
  type StoredReviewManifestEnvelope,
} from '@/server/imports/importCandidateReview/storageSchema';
import type { DetailsSchemaType } from '@/validators/detailsSchema';

export type GenerateImportReviewManifestInput = {
  importId: string;
  sourceFileName: string;
  sourceTextHash: string;
  candidate: DetailsSchemaType;
};

export type GeneratedImportReviewManifest = {
  envelope: StoredReviewManifestEnvelope;
  manifest: CandidateReviewManifest;
};

export async function generateImportReviewManifest(
  input: GenerateImportReviewManifestInput,
): Promise<GeneratedImportReviewManifest> {
  const { baseline, baselineRef } = await resolveImportMergeReviewBaseline();
  const manifest = analyzeCandidateReview({
    candidate: input.candidate,
    baseline,
    baselineRef,
    importId: input.importId,
    generatedAt: new Date().toISOString(),
  });
  const manifestRevision = revisionForManifest(manifest, input.sourceTextHash);
  const envelope = toStoredManifestEnvelope({
    manifest,
    sourceTextHash: input.sourceTextHash,
    manifestRevision,
  });
  return { envelope, manifest };
}

export function summarizeReviewManifestForAudit(manifest: CandidateReviewManifest): {
  decisionCount: number;
  unresolvedPublications: number;
  unresolvedAwards: number;
  advisoryPatentDecisions: number;
  advisoryResearchDecisions: number;
  accounting: CandidateReviewManifest['accounting'];
} {
  return {
    decisionCount: manifest.decisions.length,
    unresolvedPublications: manifest.accounting.publications.unresolvedManualReview,
    unresolvedAwards: manifest.accounting.awards.unresolvedManualReview,
    advisoryPatentDecisions: manifest.accounting.patents.unresolvedAdvisoryDecisions,
    advisoryResearchDecisions: manifest.accounting.research.unresolvedAdvisoryDecisions,
    accounting: manifest.accounting,
  };
}

export async function recordImportReviewGeneratedEvent(input: {
  importId: string;
  manifestRevision: string;
  baselineRef: CandidateReviewManifest['baseline'];
  summary: ReturnType<typeof summarizeReviewManifestForAudit>;
}): Promise<void> {
  await recordContentEvent({
    eventType: 'SYSTEM_NOTE',
    payload: {
      kind: 'IMPORT_REVIEW_GENERATED',
      importId: input.importId,
      manifestRevision: input.manifestRevision,
      baseline: input.baselineRef,
      summary: input.summary,
    },
  });
}

export function applyApprovalsToStoredManifest(
  manifest: CandidateReviewManifest,
  approvals: readonly CandidateReviewApproval[],
): CandidateReviewManifest {
  return withAppliedAccounting(manifest, approvals);
}
